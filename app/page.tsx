import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-cream-100 relative overflow-hidden">

      {/* Top gold rule */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cream-100 via-gold-500 to-cream-100" />

      {/* Trophy mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-gold-500 flex items-center justify-center text-2xl">
          📚
        </div>
        <div className="flex items-center gap-3">
          <div className="h-px w-10 bg-gold-400" />
          <span className="text-xs tracking-[0.3em] uppercase text-ink-300 font-medium">Book Club</span>
          <div className="h-px w-10 bg-gold-400" />
        </div>
      </div>

      {/* Title */}
      <h1 className="font-display text-5xl md:text-7xl font-bold text-ink-900 text-center leading-tight">
        What Do We Read Next?
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px w-6 bg-gold-500" />
        <p className="text-xs tracking-[0.25em] uppercase text-ink-300">Monthly Pick · 2026</p>
        <div className="h-px w-6 bg-gold-500" />
      </div>

      {/* Subtitle */}
      <p className="mt-6 text-ink-500 text-center max-w-xs text-base leading-relaxed">
        Rank your favourite candidates. The instant-runoff method will find the book everyone can get behind.
      </p>

      {/* CTA */}
      <Link
        href="/sign-in"
        className="mt-10 px-8 py-3.5 bg-ink-900 text-cream-100 text-sm font-medium tracking-wide hover:bg-ink-800 transition-colors duration-200"
      >
        Cast Your Vote →
      </Link>

      <Link href="/polls" className="mt-4 text-sm text-gold-600 hover:text-gold-500 transition-colors underline underline-offset-4">
        View all polls
      </Link>

      {/* Bottom gold rule */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cream-100 via-gold-500 to-cream-100" />

    </main>
  );
}
