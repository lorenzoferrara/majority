import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/polls")
      .then((res) => res.json())
      .then((data) => {
        setPolls(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-300">Loading…</p>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-500">No polls available yet.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <header className="mb-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Book Club</p>
          <h1 className="font-display text-5xl font-bold text-ink-900">Monthly Votes</h1>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gold-400" />
            <span className="text-xs text-ink-200">Read · Rank · Decide</span>
            <div className="h-px w-12 bg-gold-400" />
          </div>
        </header>

        <div className="flex flex-col divide-y divide-cream-200">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/polls/${poll.id}`}
              className="group flex items-center justify-between py-6 hover:pl-2 transition-all duration-200"
            >
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900 group-hover:text-gold-700 transition-colors">
                  {poll.month}
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span
                  className={`text-xs tracking-wider uppercase font-medium px-2.5 py-1 border ${
                    poll.status === "OPEN"
                      ? "text-green-700 border-green-300 bg-green-50"
                      : poll.status === "CLOSED"
                      ? "text-red-700 border-red-200 bg-red-50"
                      : "text-ink-300 border-cream-300 bg-cream-200"
                  }`}
                >
                  {poll.status}
                </span>
                <span className="text-ink-200 group-hover:text-gold-500 transition-colors text-lg">→</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
