import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";

export default function Results() {
  const { pollId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function loadResults() {
    fetch(`/api/results/${pollId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Failed to load results"))
      .then(setData)
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load results"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadResults(); }, [pollId]);
  useSSE({ "ballot-submitted": loadResults });

  if (loading) {
    return (
      <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">
          <p className="text-xs tracking-[0.3em] uppercase text-pastel-muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">
          <p className="text-sm text-pastel-ink mb-1 font-semibold">Something went wrong</p>
          <p className="text-xs text-pastel-mid mb-6">{error}</p>
          <button onClick={loadResults} className="text-xs tracking-[0.35em] uppercase text-pastel-mid border border-pastel-border px-5 py-2.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors">
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { poll, options, totalBallots, winner, isTie, firstChoiceCounts, rounds } = data;

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-16 py-14">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>
        <h1 className="font-display text-5xl font-bold text-pastel-ink leading-none mb-1">{poll.month}</h1>
        <p className="text-xs tracking-[0.4em] uppercase text-pastel-muted mb-10">Results</p>

        {/* Winner */}
        {poll.status === "CLOSED" && (
          <div className="mb-10 border-l-4 border-pastel-gold pl-5 py-1">
            {winner ? (
              <>
                <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
                <p className="font-display text-3xl font-bold text-pastel-ink">{winner.label}</p>
              </>
            ) : isTie ? (
              <p className="font-display text-2xl italic text-pastel-mid">It's a tie.</p>
            ) : (
              <p className="font-display text-xl italic text-pastel-muted">No winner determined.</p>
            )}
          </div>
        )}

        {poll.status !== "CLOSED" && (
          <div className="mb-10 py-4 border-t border-pastel-border">
            <p className="text-sm text-pastel-mid italic">Results are published once voting closes.</p>
          </div>
        )}

        {/* Vote summary label */}
        <div className="flex items-center justify-between text-[11px] tracking-[0.3em] uppercase text-pastel-muted mb-4">
          <span>First-choice votes</span>
          <span>{totalBallots} ballot{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {/* Bars */}
        <div className="flex flex-col gap-2 mb-12">
          {options
            .slice()
            .sort((a, b) => (firstChoiceCounts[b.id] || 0) - (firstChoiceCounts[a.id] || 0))
            .map((option) => {
              const count = firstChoiceCounts[option.id] || 0;
              const pct = totalBallots > 0 ? Math.round((count / totalBallots) * 100) : 0;
              const isWinner = winner?.id === option.id;
              return (
                <div key={option.id} className={`px-4 py-4 border ${isWinner ? "border-pastel-gold bg-amber-50" : "border-pastel-border bg-[#f4f0ec]"}`}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className={`font-display text-xl font-semibold ${isWinner ? "text-pastel-ink" : "text-pastel-mid"}`}>
                      {option.label}
                    </span>
                    <span className="text-pastel-muted text-xs tabular-nums ml-4 shrink-0 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-pastel-border w-full rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${isWinner ? "bg-pastel-gold" : "bg-pastel-muted"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* IRV rounds */}
        {rounds.length > 1 && (
          <details className="mb-10 group">
            <summary className="cursor-pointer text-[11px] tracking-[0.4em] uppercase text-pastel-mid hover:text-pastel-ink transition-colors select-none list-none flex items-center gap-3 mb-4">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
              Round-by-round ({rounds.length} rounds)
            </summary>
            <div className="flex flex-col gap-2">
              {rounds.map((r) => (
                <div key={r.round} className="px-4 py-4 border border-pastel-border bg-[#f4f0ec]">
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-muted font-semibold mb-3">Round {r.round}</p>
                  {Object.entries(r.counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([id, count]) => {
                      const opt = options.find((o) => o.id === id);
                      return (
                        <div key={id} className="flex justify-between text-sm py-1">
                          <span className="text-pastel-ink font-medium">{opt?.label ?? id}</span>
                          <span className="text-pastel-mid tabular-nums">{count}</span>
                        </div>
                      );
                    })}
                  {r.eliminated.length > 0 && (
                    <p className="text-xs text-pastel-rose mt-3 italic font-medium">
                      Eliminated: {r.eliminated.map((o) => o.label).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-8 text-[11px] tracking-[0.35em] uppercase border-t border-pastel-border pt-8">
          <Link to={`/polls/${pollId}`} className="text-pastel-mid hover:text-pastel-ink transition-colors font-semibold">
            ← Ballot
          </Link>
          <Link to="/polls" className="text-pastel-mid hover:text-pastel-ink transition-colors font-semibold">
            All polls
          </Link>
        </div>

      </div>
    </main>
  );
}
