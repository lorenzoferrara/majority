import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-black via-zinc-900 to-black text-zinc-100">
      
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">
        <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
          🏆 Oscar Voting
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-3 text-zinc-400 text-center max-w-md text-sm md:text-base">
        Rank your favorite films and let the instant-runoff system decide the winner.
      </p>

      {/* CTA */}
      <Link
        href="/sign-in"
        className="
          mt-8
          px-6 py-3
          rounded-xl
          font-semibold
          text-black
          bg-gradient-to-r from-orange-400 to-amber-300
          hover:from-orange-300 hover:to-yellow-200
          transition-all duration-200
          shadow-lg shadow-orange-500/20
          hover:shadow-orange-400/40
          active:scale-95
        "
      >
        Sign in to vote →
      </Link>

      {/* Decorative glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-orange-500/10 blur-3xl rounded-full" />
      </div>

    </main>
  );
}