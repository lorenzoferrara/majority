import { Link } from "react-router-dom";

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">
          Book Club
        </p>
        <h1 className="font-serif text-4xl font-bold text-ink-900 mb-4">
          What Do We Read Next?
        </h1>
        <p className="text-xs tracking-[0.25em] uppercase text-ink-300 mb-5">
          Monthly Pick - 2026
        </p>
        <p className="text-ink-500 text-sm max-w-md mx-auto">
          Rank your favourite candidates. The instant-runoff method will find
          the book everyone can get behind.
        </p>

        <Link
          to="/sign-in"
          className="inline-block mt-8 px-8 py-3.5 bg-ink-900 text-cream-100 text-sm font-medium tracking-wide hover:bg-ink-800 transition-colors duration-200"
        >
          Sign In To Vote
        </Link>
      </div>
    </main>
  );
}
