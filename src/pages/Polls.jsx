import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function loadPolls() {
    setLoading(true);
    setError(null);
    fetch("/api/polls")
      .then((r) => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then((d) => { setPolls(d); setLoading(false); })
      .catch((e) => { setError(e.message || "Failed to load polls"); setLoading(false); });
  }

  useEffect(() => { loadPolls(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-graphite-950 flex items-center justify-center">
      <p className="text-[9px] tracking-[0.4em] uppercase text-graphite-400">Loading</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-graphite-950 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm text-parchment-200 mb-2">Something went wrong</p>
        <p className="text-xs text-graphite-400 mb-8">{error}</p>
        <button
          onClick={loadPolls}
          className="text-[9px] tracking-[0.35em] uppercase text-graphite-400 border border-graphite-700 px-5 py-2.5 hover:border-gold-600 hover:text-gold-600 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (polls.length === 0) return (
    <div className="min-h-screen bg-graphite-950 flex items-center justify-center">
      <p className="text-sm text-graphite-400 font-light italic">No votes scheduled yet.</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-graphite-950 px-6 py-20">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-16">
          <div className="h-px flex-1 bg-graphite-800" />
          <span className="text-[9px] tracking-[0.5em] uppercase text-gold-600 font-medium">Book Club</span>
          <div className="h-px flex-1 bg-graphite-800" />
        </div>

        <div className="mb-14">
          <h1 className="font-display text-6xl font-light text-parchment-100 leading-none mb-4">
            Monthly Votes
          </h1>
          <p className="text-sm text-parchment-300 font-light tracking-wide">Read · Rank · Decide</p>
        </div>

        <div>
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/polls/${poll.id}`}
              className="group flex items-center justify-between py-5 border-b border-graphite-800 hover:border-graphite-600 transition-colors duration-200"
            >
              <div className="min-w-0">
                <p className="font-display text-2xl text-parchment-100 group-hover:text-gold-400 transition-colors duration-200 leading-snug">
                  {poll.month}
                </p>
                <p className="text-xs text-parchment-300 mt-1 tracking-wide">
                  Cast your vote for this month's selection
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 ml-6">
                <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2.5 py-1 border transition-colors duration-200 ${
                  poll.status === "OPEN"
                    ? "border-gold-500 text-gold-400"
                    : poll.status === "CLOSED"
                    ? "border-graphite-600 text-parchment-300"
                    : "border-graphite-700 text-parchment-300"
                }`}>
                  {poll.status}
                </span>
                <span className="text-parchment-300 group-hover:text-gold-400 transition-colors duration-200 text-base">→</span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-[9px] tracking-[0.2em] uppercase text-parchment-300">
          {polls.length} vote{polls.length !== 1 ? "s" : ""} available
        </p>

      </div>
    </main>
  );
}
