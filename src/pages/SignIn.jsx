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
    <main className="min-h-screen flex items-center justify-center bg-cream-100 px-4 relative">

      {/* Top gold rule */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cream-100 via-gold-500 to-cream-100" />

      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-gold-500 mb-5 text-2xl">
            📚
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">Welcome</h1>
          <p className="text-ink-300 text-sm">Enter your name and the club passphrase</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-widest uppercase text-ink-300">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Lorenzo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 text-sm bg-cream-50 border border-cream-300 text-ink-900 placeholder-ink-100 focus:outline-none focus:border-gold-500 transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-widest uppercase text-ink-300">
              Passphrase
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="px-4 py-3 text-sm bg-cream-50 border border-cream-300 text-ink-900 placeholder-ink-100 focus:outline-none focus:border-gold-500 transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3">
              Wrong passphrase or name. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-ink-900 text-cream-100 text-sm font-medium tracking-wide hover:bg-ink-800 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Cast Your Vote →"}
          </button>
        </form>

        <p className="text-center text-xs text-ink-200 mt-8">
          Ask the host for the passphrase if you don't have it.
        </p>
      </div>

      {/* Bottom gold rule */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cream-100 via-gold-500 to-cream-100" />
    </main>
  );
}
