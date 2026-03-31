import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const [name, setName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const expected = import.meta.env.VITE_APP_PASSPHRASE;

    if (!expected || passphrase !== expected) {
      setError(true);
      setLoading(false);
      return;
    }

    localStorage.setItem("majority_user", JSON.stringify({ name: name.trim() }));
    navigate("/polls");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-graphite-900 px-6">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0a0a08 inset !important;
          -webkit-text-fill-color: #f5f0e8 !important;
          caret-color: #f5f0e8;
        }
      `}</style>
      <div className="w-full max-w-sm border border-graphite-700 bg-graphite-950 px-10 py-14">

        {/* Wordmark */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-graphite-700" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-gold-600 font-medium">Book Club</span>
          <div className="h-px flex-1 bg-graphite-700" />
        </div>

        <div className="mb-10">
          <h1 className="font-display text-6xl font-light text-parchment-100 leading-none mb-3">Welcome</h1>
          <p className="text-sm tracking-wide text-graphite-400">Members only — enter to vote.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          <div>
            <label className="block text-[11px] tracking-[0.4em] uppercase text-graphite-400 mb-3">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Lorenzo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-graphite-700 pb-2.5 text-base text-parchment-100 placeholder-graphite-600 focus:outline-none focus:border-gold-600 transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.4em] uppercase text-graphite-400 mb-3">
              Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-transparent border-b border-graphite-700 pb-2.5 text-base text-parchment-100 placeholder-graphite-600 focus:outline-none focus:border-gold-600 transition-colors duration-200"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 -mt-2">
              Wrong passphrase. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-gold-600 text-graphite-950 text-xs font-semibold tracking-[0.35em] uppercase hover:bg-gold-500 transition-colors duration-200 disabled:opacity-40"
          >
            {loading ? "…" : "Enter"}
          </button>
        </form>

        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-graphite-600">
          Majority · {new Date().getFullYear()}
        </p>

      </div>
    </main>
  );
}
