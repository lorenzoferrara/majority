"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [passphrase, setPassphrase] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await signIn("credentials", {
      passphrase,
      name,
      callbackUrl: "/",
      redirect: false,
    });

    if (res?.error) {
      setError(true);
      setLoading(false);
    } else {
      router.push(`/polls`);
    }
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
            <label className="text-xs font-medium tracking-widest uppercase text-ink-300">Your Name</label>
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
            <label className="text-xs font-medium tracking-widest uppercase text-ink-300">Passphrase</label>
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


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await signIn("credentials", {
      passphrase,
      name,
      callbackUrl: "/",
      redirect: false,
    });

    if (res?.error) {
      setError(true);
      setLoading(false);
    } else {
      router.push(`/polls`);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-black via-zinc-900 to-black text-zinc-100">
      
      {/* Glow background */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-orange-500/10 blur-3xl rounded-full" />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm p-8 rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="text-xl font-semibold">
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Oscar Voting
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Enter your name and the passphrase to vote
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Your name</label>
            <input
              type="text"
              placeholder="e.g. Lorenzo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                px-3 py-2 text-sm rounded-lg
                bg-black/40 border border-white/10
                focus:outline-none focus:border-orange-400
                transition
              "
              required
            />
          </div>

          {/* Passphrase */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Passphrase</label>
            <input
              type="password"
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="
                px-3 py-2 text-sm rounded-lg
                bg-black/40 border border-white/10
                focus:outline-none focus:border-orange-400
                transition
              "
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">
              Wrong passphrase. Try again.
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              mt-2 py-2.5 rounded-lg text-sm font-semibold
              text-black
              bg-gradient-to-r from-orange-400 to-amber-300
              hover:from-orange-300 hover:to-yellow-200
              transition-all duration-200
              shadow-lg shadow-orange-500/20
              hover:shadow-orange-400/40
              disabled:opacity-50
              active:scale-95
            "
          >
            {loading ? "Entering…" : "Enter →"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Ask the host for the passphrase if you don't have it.
        </p>
      </div>
    </main>
  );
}