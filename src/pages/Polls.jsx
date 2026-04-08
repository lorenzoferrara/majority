import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useSSE({ "polls-changed": loadPolls });

  function loadPolls() {
    setLoading(true);
    setError(null);
    fetch("/api/polls")
      .then((r) => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then((d) => { setPolls(d); setLoading(false); })
      .catch((e) => { setError(e.message || "Failed to load polls"); setLoading(false); });
  }

  useEffect(() => { loadPolls(); }, []);

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">

        <div className="flex items-center gap-3 mb-12">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>

        <h1 className="font-display text-5xl font-light text-pastel-ink leading-none mb-3">Monthly Votes</h1>
        <p className="text-sm text-pastel-mid mb-10 tracking-wide">Read · Rank · Decide</p>

        {loading && (
          <p className="text-[11px] tracking-[0.3em] uppercase text-pastel-muted py-4">Loading…</p>
        )}

        {error && (
          <div>
            <p className="text-sm text-pastel-ink mb-1">Something went wrong</p>
            <p className="text-xs text-pastel-mid mb-6">{error}</p>
            <button
              onClick={loadPolls}
              className="text-[9px] tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-5 py-2.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && polls.length === 0 && (
          <p className="text-sm text-pastel-mid font-light italic">No votes scheduled yet.</p>
        )}

        {!loading && !error && polls.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {polls.map((poll) => (
                <Link
                  key={poll.id}
                  to={`/polls/${poll.id}`}
                  className="group flex items-center justify-between px-5 py-4 border border-pastel-border bg-pastel-option hover:border-pastel-gold hover:bg-[#fdf8f0] transition-all duration-200"
                >
                  <div className="min-w-0">
                    <p className="font-display text-2xl text-pastel-ink group-hover:text-pastel-gold transition-colors duration-200 leading-snug">
                      {poll.month}
                    </p>
                    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium mt-1 inline-block ${
                      poll.status === "OPEN" ? "text-pastel-sage"
                      : poll.status === "CLOSED" ? "text-pastel-rose"
                      : "text-pastel-muted"
                    }`}>{poll.status}</span>
                  </div>
                  <span className="text-pastel-muted group-hover:text-pastel-gold transition-colors duration-200 ml-4 shrink-0">→</span>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
              {polls.length} votation{polls.length !== 1 ? "s" : ""} available
            </p>
          </>
        )}

        <p className="mt-10 text-center text-[11px] tracking-[0.2em] uppercase text-pastel-muted">
          Majority · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
