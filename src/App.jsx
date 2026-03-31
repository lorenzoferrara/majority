import { Link } from "react-router-dom";

export default function App() {
  return (
    <main className="min-h-screen bg-graphite-950 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-6">
          Book Club
        </p>
        <h1 className="font-display text-6xl font-light text-parchment-100 mb-5 leading-tight">
          What Do We Read Next?
        </h1>
        <p className="text-xs tracking-[0.25em] uppercase text-parchment-300 mb-6">
          Monthly Pick — 2026
        </p>
        <p className="text-parchment-200 text-base max-w-md mx-auto leading-relaxed">
          Rank your favourite candidates. The instant-runoff method will find
          the book everyone can get behind.
        </p>

        <Link
          to="/sign-in"
          className="inline-block mt-10 px-10 py-4 bg-gold-600 text-graphite-950 text-xs font-medium tracking-[0.2em] uppercase hover:bg-gold-500 transition-colors duration-200"
        >
          Sign In To Vote
        </Link>
      </div>
    </main>
  );
}
