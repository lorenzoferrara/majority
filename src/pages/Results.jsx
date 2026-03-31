import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

export default function Results() {
  const { pollId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/results/${pollId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Failed to load results"))
      .then(setData)
      .catch((e) => setError(typeof e === "string" ? e : "Failed to load results"))
      .finally(() => setLoading(false));
  }, [pollId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-300 animate-pulse">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-red-500">{error}</p>
      </div>
    );
  }

  const { poll, options, totalBallots, winner, isTie, firstChoiceCounts, rounds } = data;

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Book Club</p>
          <h1 className="font-display text-5xl font-bold text-ink-900">{poll.month}</h1>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gold-400" />
            <span className="text-xs text-ink-200">Results</span>
            <div className="h-px w-12 bg-gold-400" />
          </div>
        </header>

        {/* Winner banner */}
        {poll.status === "CLOSED" && (
          <div className="mb-10 border border-gold-400 bg-gold-50 px-8 py-6 text-center">
            {winner ? (
              <>
                <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-2">Winner</p>
                <p className="font-display text-3xl font-bold text-ink-900">{winner.label}</p>
              </>
            ) : isTie ? (
              <p className="font-display text-2xl font-bold text-ink-900">It's a tie!</p>
            ) : (
              <p className="font-display text-xl text-ink-400">No winner determined</p>
            )}
          </div>
        )}

        {poll.status !== "CLOSED" && (
          <div className="mb-10 px-4 py-3 border border-cream-300 bg-cream-50 text-ink-300 text-sm text-center">
            Results are not published until voting closes.
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 flex items-center justify-between text-xs text-ink-200 uppercase tracking-widest">
          <span>First-choice votes</span>
          <span>{totalBallots} ballot{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {/* First-choice bars */}
        <div className="flex flex-col divide-y divide-cream-200 mb-12">
          {options
            .slice()
            .sort((a, b) => (firstChoiceCounts[b.id] || 0) - (firstChoiceCounts[a.id] || 0))
            .map((option) => {
              const count = firstChoiceCounts[option.id] || 0;
              const pct = totalBallots > 0 ? Math.round((count / totalBallots) * 100) : 0;
              const isWinner = winner?.id === option.id;
              return (
                <div key={option.id} className="py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-display text-base font-semibold ${isWinner ? "text-gold-700" : "text-ink-800"}`}>
                      {option.label}
                      {isWinner && <span className="ml-2 text-xs text-gold-500 font-medium tracking-widest uppercase">Winner</span>}
                    </span>
                    <span className="text-ink-300 text-sm tabular-nums">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-cream-200 w-full">
                    <div
                      className={`h-1.5 transition-all duration-700 ${isWinner ? "bg-gold-500" : "bg-ink-300"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* IRV rounds */}
        {rounds.length > 1 && (
          <details className="mb-10 border border-cream-300">
            <summary className="px-5 py-3 cursor-pointer text-xs uppercase tracking-widest text-ink-300 hover:text-ink-700 transition-colors select-none">
              Round-by-round breakdown ({rounds.length} rounds)
            </summary>
            <div className="divide-y divide-cream-200 px-5">
              {rounds.map((r) => (
                <div key={r.round} className="py-4">
                  <p className="text-xs uppercase tracking-widest text-ink-200 mb-2">Round {r.round}</p>
                  {Object.entries(r.counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([id, count]) => {
                      const opt = options.find((o) => o.id === id);
                      return (
                        <div key={id} className="flex justify-between text-sm py-0.5">
                          <span className="text-ink-700">{opt?.label ?? id}</span>
                          <span className="text-ink-300 tabular-nums">{count}</span>
                        </div>
                      );
                    })}
                  {r.eliminated.length > 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Eliminated: {r.eliminated.map((o) => o.label).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Back */}
        <div className="flex items-center gap-6 text-xs">
          <Link to={`/polls/${pollId}`} className="text-ink-200 hover:text-gold-500 transition-colors">
            ← Back to ballot
          </Link>
          <Link to="/polls" className="text-ink-200 hover:text-gold-500 transition-colors">
            All polls
          </Link>
        </div>

      </div>
    </main>
  );
}
