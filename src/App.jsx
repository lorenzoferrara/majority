import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function App() {
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

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #FDFAF7 inset !important;
          -webkit-text-fill-color: #1C1712 !important;
          caret-color: #1C1712;
        }
      `}</style>
      <div className="relative w-full max-w-5xl border border-pastel-border bg-pastel-card px-5 sm:px-12 lg:px-16 py-8 sm:py-12 lg:py-14 overflow-hidden">
        <div aria-hidden className="absolute -top-20 -left-16 h-56 w-56 rounded-full border border-pastel-border/70" />
        <div aria-hidden className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-pastel-border/70" />

        <div className="relative flex items-center gap-3 mb-8 sm:mb-10 lg:mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-start">
          <div aria-hidden className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-pastel-border/70" />

          <section className="md:pr-5 lg:pr-6 text-center">
            <h1 className="font-display text-4xl sm:text-5xl md:text-[3.9rem] lg:text-[4.8rem] font-light text-pastel-ink leading-[0.94] mb-4">
              What Do We Read Next?
            </h1>
            <p className="text-xs tracking-[0.25em] uppercase text-pastel-mid mb-6">
              Monthly Pick - {new Date().getFullYear()}
            </p>

            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <div className="h-px w-8 bg-pastel-border" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-pastel-muted">Rank · Decide · Read</span>
              <div className="h-px w-8 bg-pastel-border" />
            </div>

            <p className="text-pastel-mid text-base sm:text-lg leading-relaxed mb-0 max-w-lg mx-auto">
              Rank your favourite candidates. The instant-runoff method will find the book everyone can get behind.
            </p>
          </section>

          <section className="md:pl-5 lg:pl-6">
            <div className="border border-pastel-border/80 bg-pastel-option px-5 sm:px-7 py-6 sm:py-8 relative">
              <div aria-hidden className="absolute right-5 top-5 h-4 w-4 rounded-full border border-pastel-gold/60" />

              <div className="mb-8">
              <h2 className="font-display text-4xl sm:text-5xl font-light text-pastel-ink leading-none mb-3">Enter</h2>
              <p className="text-sm tracking-wide text-pastel-mid">Members only - sign in to vote.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-7">
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
                  <p className="text-sm text-pastel-rose -mt-1">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 py-3.5 bg-pastel-ink text-pastel-card text-xs font-semibold tracking-[0.35em] uppercase hover:bg-pastel-gold hover:text-pastel-ink transition-colors duration-200 disabled:opacity-40"
                >
                  {loading ? "..." : "Sign In To Vote"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <p className="mt-10 text-[11px] tracking-[0.2em] uppercase text-pastel-muted text-center">
          Majority · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
