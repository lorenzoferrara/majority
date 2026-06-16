import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useSignIn() {
  const [name, setName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const nextPath = location.state?.from?.pathname || "/polls";

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) {
          navigate(nextPath, { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate, nextPath]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), passphrase }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: res.ok ? "Unexpected server response." : `Sign-in failed (${res.status}).` };

      if (!res.ok) {
        setError(data.error || "Sign-in failed.");
        setLoading(false);
        return;
      }

      navigate(nextPath, { replace: true });
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  return {
    name,
    setName,
    passphrase,
    setPassphrase,
    error,
    loading,
    handleSubmit,
  };
}
