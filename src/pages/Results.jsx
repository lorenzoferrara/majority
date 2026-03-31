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
      <div className="min-h-screen flex items-center justify-center bg-graphite-950">
        <p className="font-display text-2xl italic text-graphite-600">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-graphite-950">
        <p className="font-display text-xl italic text-graphite-500">{error}</p>
      </div>
    );
  }

  const { poll, options, totalBallots, winner, isTie, firstChoiceCounts, rounds } = data;

  return (
    <main className="min-h-screen bg-graphite-950 px-8 py-20">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <header className="mb-16">
          <p className="text-[9px] tracking-[0.5em] uppercase text-gold-600 font-medium mb-5">Book Club</p>
          <h1 className="font-display text-6xl font-semibold text-parchment-100 leading-none">{poll.month}</h1>
          <p className="text-[9px] tracking-[0.4em] uppercase text-graphite-500 mt-4">Results</p>
        </header>

        {/* Winner */}
        {poll.status === "CLOSED" && (
          <div className="mb-14 border-l-2 border-gold-600 pl-6">
            {winner ? (
              <>
                <p className="text-[9px] tracking-[0.4em] uppercase text-gold-600 font-medium mb-2">Winner</p>
                <p className="font-display text-3xl font-semibold text-parchment-100">{winner.label}</p>
              </>
            ) : isTie ? (
              <p className="font-display text-2xl italic text-parchment-300">It's a tie.</p>
            ) : (
              <p className="font-display text-xl italic text-graphite-500">No winner determined.</p>
            )}
          </div>
        )}

        {poll.status !== "CLOSED" && (
          <div className="mb-12 py-5 border-t border-graphite-800">
            <p className="text-sm text-graphite-500 font-light italic">Results are published once voting closes.</p>
          </div>
        )}

        {/* Vote summary */}
        <div className="flex items-center justify-between text-[9px] tracking-[0.3em] uppercase text-graphite-600 mb-6">
          <span>First-choice votes</span>
          <span>{totalBallots} ballot{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {/* Bars */}
        <div className="flex flex-col mb-14">
          {options
            .slice()
            .sort((a, b) => (firstChoiceCounts[b.id] || 0) - (firstChoiceCounts[a.id] || 0))
            .map((option) => {
              const count = firstChoiceCounts[option.id] || 0;
              const pct = totalBallots > 0 ? Math.round((count / totalBallots) * 100) : 0;
              const isWinner = winner?.id === option.id;
              return (
                <div key={option.id} className="py-5 border-b border-graphite-800">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className={`font-display text-base ${isWinner ? "text-parchment-100" : "text-parchment-300"}`}>
                      {option.label}
                    </span>
                    <span className="text-graphite-500 text-xs tabular-nums ml-4 shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="h-px bg-graphite-800 w-full">
                    <div
                      className={`h-px transition-all duration-700 ${isWinner ? "bg-gold-500" : "bg-graphite-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* IRV rounds */}
        {rounds.length > 1 && (
          <details className="mb-12 group">
            <summary className="cursor-pointer text-[9px] tracking-[0.4em] uppercase text-graphite-600 hover:text-graphite-400 transition-colors select-none list-none flex items-center gap-3">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
              Round-by-round ({rounds.length} rounds)
            </summary>
            <div className="mt-6 flex flex-col border-t border-graphite-800">
              {rounds.map((r) => (
                <div key={r.round} className="py-5 border-b border-graphite-800">
                  <p className="text-[9px] tracking-[0.4em] uppercase text-graphite-600 mb-3">Round {r.round}</p>
                  {Object.entries(r.counts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([id, count]) => {
                      const opt = options.find((o) => o.id === id);
                      return (
                        <div key={id} className="flex justify-between text-sm py-1">
                          <span className="text-parchment-300 font-light">{opt?.label ?? id}</span>
                          <span className="text-graphite-500 tabular-nums">{count}</span>
                        </div>
                      );
                    })}
                  {r.eliminated.length > 0 && (
                    <p className="text-[10px] text-graphite-600 mt-3 italic">
                      Eliminated: {r.eliminated.map((o) => o.label).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-8 text-[9px] tracking-[0.35em] uppercase">
          <Link to={`/polls/${pollId}`} className="text-graphite-600 hover:text-graphite-400 transition-colors">
            ← Ballot
          </Link>
          <Link to="/polls" className="text-graphite-600 hover:text-graphite-400 transition-colors">
            All polls
          </Link>
        </div>

      </div>
    </main>
  );
}
