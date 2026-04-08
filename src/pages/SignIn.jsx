import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SignIn() {
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
        if (res.ok) navigate(nextPath, { replace: true });
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

  return (
    <main className="min-h-screen flex items-center justify-center bg-pastel-bg px-6">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #FDFAF7 inset !important;
          -webkit-text-fill-color: #1C1712 !important;
          caret-color: #1C1712;
        }
      `}</style>
      <div className="w-full max-w-sm border border-pastel-border bg-pastel-card px-10 py-14">

        {/* Wordmark */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="mb-10">
          <h1 className="font-display text-6xl font-light text-pastel-ink leading-none mb-3">Welcome</h1>
          <p className="text-sm tracking-wide text-pastel-mid">Members only — enter to vote.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          <div>
            <label className="block text-[11px] tracking-[0.4em] uppercase text-pastel-mid mb-3">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Gianfranca"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-pastel-border pb-2.5 text-base text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.4em] uppercase text-pastel-mid mb-3">
              Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-transparent border-b border-pastel-border pb-2.5 text-base text-pastel-ink placeholder-pastel-muted focus:outline-none focus:border-pastel-gold transition-colors duration-200"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-pastel-rose -mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-pastel-ink text-pastel-card text-xs font-semibold tracking-[0.35em] uppercase hover:bg-pastel-gold hover:text-pastel-ink transition-colors duration-200 disabled:opacity-40"
          >
            {loading ? "…" : "Enter"}
          </button>
        </form>

        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          Majority · {new Date().getFullYear()}
        </p>

      </div>
    </main>
  );
}
