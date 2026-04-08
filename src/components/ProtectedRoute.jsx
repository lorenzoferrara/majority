import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => {
        if (cancelled) return;
        setStatus(res.ok ? "authorized" : "unauthorized");
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthorized");
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">
          <p className="text-xs tracking-[0.3em] uppercase text-pastel-muted">Checking access…</p>
        </div>
      </main>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return <Outlet />;
}