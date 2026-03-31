import { Link } from "react-router-dom";

export default function App() {
  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-16 text-center">

        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <h1 className="font-display text-6xl font-light text-pastel-ink leading-none mb-4">
          What Do We Read Next?
        </h1>
        <p className="text-xs tracking-[0.25em] uppercase text-pastel-mid mb-6">
          Monthly Pick — {new Date().getFullYear()}
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-8 bg-pastel-border" />
          <span className="text-[10px] tracking-[0.15em] uppercase text-pastel-muted">Read · Rank · Decide</span>
          <div className="h-px w-8 bg-pastel-border" />
        </div>

        <p className="text-pastel-mid text-sm leading-relaxed mb-10">
          Rank your favourite candidates. The instant-runoff method will find the book everyone can get behind.
        </p>

        <Link
          to="/sign-in"
          className="block py-3.5 bg-pastel-ink text-pastel-card text-xs font-semibold tracking-[0.35em] uppercase hover:bg-pastel-gold hover:text-pastel-ink transition-colors duration-200"
        >
          Sign In To Vote
        </Link>

        <p className="mt-10 text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          Majority · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
