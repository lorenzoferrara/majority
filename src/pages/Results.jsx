import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";

function Medal({ rank }) {
  if (rank === 1) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #FFE066, #FFD700, #B8860B)", color: "#5a3e00", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>1</span>
  );
  if (rank === 2) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #f0f0f0, #C0C0C0, #888)", color: "#333", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>2</span>
  );
  if (rank === 3) return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #e8b07a, #CD7F32, #8B5A1A)", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>3</span>
  );
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, color: "#B8B0A8", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{rank}</span>;
}

export default function Results() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roundsOpen, setRoundsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("irv"); // "irv" | "top2"

  function loadResults() {
    fetch(`/api/results/${pollId}`, { credentials: "same-origin" })
      .then((r) => {
        if (r.status === 401) {
          navigate("/sign-in", { replace: true });
          return null;
        }
        return r.ok ? r.json() : Promise.reject("Failed to load results");
      })
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

  const { poll, options, totalBallots, voters = [], winner, winners: tiedWinners, isTie, firstChoiceCounts, topTwoCounts = {}, rounds } = data;
  const sortedVoters = [...voters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-2xl">
      <div className="border border-pastel-border bg-pastel-card px-16 py-14">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>
        <h1 className="font-display text-5xl font-bold text-pastel-ink leading-none mb-1">{poll.month}</h1>
        <p className="text-xs tracking-[0.4em] uppercase text-pastel-muted mb-6">Results</p>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 mb-10 border border-pastel-border bg-[#f4f0ec] p-1 w-fit">
          <button
            onClick={() => setViewMode("irv")}
            className={`text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-semibold transition-colors ${viewMode === "irv" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
          >
            Ranked choice
          </button>
          <button
            onClick={() => setViewMode("top2")}
            className={`text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-semibold transition-colors ${viewMode === "top2" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
          >
            Top 2 picks
          </button>
        </div>

        {/* Winner */}
        {poll.status === "CLOSED" && viewMode === "irv" && (
          <div className="mb-10 border-l-4 border-pastel-gold pl-5 py-1">
            {winner ? (
              <>
                <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
                <p className="font-display text-3xl font-bold text-pastel-ink">{winner.label}</p>
              </>
            ) : isTie && tiedWinners?.length > 0 ? (
              <>
                <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Co-winners</p>
                {tiedWinners.map((w) => (
                  <p key={w.id} className="font-display text-3xl font-bold text-pastel-ink">{w.label}</p>
                ))}
              </>
            ) : (
              <p className="font-display text-xl italic text-pastel-muted">No winner determined.</p>
            )}
          </div>
        )}

        {poll.status === "CLOSED" && viewMode === "top2" && (() => {
          const maxCount = Math.max(0, ...options.map((o) => topTwoCounts[o.id] || 0));
          const top2Winners = options.filter((o) => (topTwoCounts[o.id] || 0) === maxCount && maxCount > 0);
          return (
            <div className="mb-10 border-l-4 border-pastel-gold pl-5 py-1">
              {top2Winners.length === 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
                  <p className="font-display text-3xl font-bold text-pastel-ink">{top2Winners[0].label}</p>
                </>
              ) : top2Winners.length > 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Co-winners</p>
                  {top2Winners.map((w) => (
                    <p key={w.id} className="font-display text-3xl font-bold text-pastel-ink">{w.label}</p>
                  ))}
                </>
              ) : (
                <p className="font-display text-xl italic text-pastel-muted">No winner determined.</p>
              )}
            </div>
          );
        })()}

        {poll.status !== "CLOSED" && (
          <div className="mb-10 py-4 border-t border-pastel-border">
            <p className="text-sm text-pastel-mid italic">Results are published once voting closes.</p>
          </div>
        )}

        {/* Vote summary label */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-pastel-muted mb-3">
          <span>{viewMode === "irv" ? "First-choice votes" : "Top-2 pick appearances"}</span>
          <span>{totalBallots} ballot{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {/* Bars */}
        {(() => {
          const counts = viewMode === "irv" ? firstChoiceCounts : topTwoCounts;
          const totalForPct = viewMode === "irv" ? totalBallots : options.reduce((s, o) => s + (topTwoCounts[o.id] || 0), 0);
          const sorted = options.slice().sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
          // dense rank: ties share the same rank
          let rank = 1;
          const ranks = {};
          for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && (counts[sorted[i].id] || 0) < (counts[sorted[i - 1].id] || 0)) {
              rank = i + 1;
            }
            ranks[sorted[i].id] = rank;
          }
          return (
            <div className="flex flex-col gap-1.5 mb-8">
              {sorted.map((option) => {
                const count = counts[option.id] || 0;
                const pct = totalForPct > 0 ? Math.round((count / totalForPct) * 100) : 0;
                const r = ranks[option.id];
                const isTop = r === 1;
                return (
                  <div key={option.id} className={`px-3 py-2.5 border flex items-center gap-3 ${isTop ? "border-pastel-gold bg-amber-50" : "border-pastel-border bg-[#f4f0ec]"}`}>
                    <Medal rank={r} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className={`font-display text-base font-semibold ${isTop ? "text-pastel-ink" : "text-pastel-mid"}`}>
                          {option.label}
                        </span>
                        <span className="text-pastel-muted text-[11px] tabular-nums ml-4 shrink-0">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1 bg-pastel-border w-full rounded-full overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all duration-700 ${isTop ? "bg-pastel-gold" : "bg-pastel-muted"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Top-2 method explanation */}
        {viewMode === "top2" && (
          <p className="text-[11px] text-pastel-muted mb-8 leading-relaxed">
            Each voter's first and second choices each count as one vote. The book with the most appearances in top-2 picks wins.
          </p>
        )}

        {/* Step-by-step IRV elimination */}
        {viewMode === "irv" && rounds.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setRoundsOpen((v) => !v)}
              className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-pastel-mid hover:text-pastel-ink font-semibold mb-4 transition-colors"
            >
              <span>{roundsOpen ? "−" : "+"}</span>
              <span>How the winner was decided: Round-by-round ({rounds.length} round{rounds.length !== 1 ? "s" : ""})</span>
            </button>
            {!roundsOpen ? null : (
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-[17px] top-0 bottom-0 w-px bg-pastel-border" />
              <div className="flex flex-col gap-5">
                {rounds.map((r, i) => {
                  const sorted = Object.entries(r.counts).sort(([, a], [, b]) => b - a);
                  const roundTotal = sorted.reduce((s, [, c]) => s + c, 0);
                  const isLast = i === rounds.length - 1;
                  return (
                    <div key={r.round} className="flex gap-4">
                      {/* circle */}
                      <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold
                        ${isLast ? "border-pastel-gold bg-amber-50 text-pastel-gold" : "border-pastel-border bg-pastel-card text-pastel-mid"}`}>
                        {r.round}
                      </div>
                      {/* content */}
                      <div className="flex-1 border border-pastel-border bg-[#f4f0ec] px-4 py-3 -mt-0.5">
                        {sorted.map(([id, count]) => {
                          const opt = options.find((o) => o.id === id);
                          const isElim = r.eliminated?.some((e) => e.id === id);
                          const isTiedWin = isLast && isTie && r.winners?.some((w) => w.id === id);
                          const isWin = (isLast && winner?.id === id) || isTiedWin;
                          const pct = roundTotal > 0 ? Math.round((count / roundTotal) * 100) : 0;
                          return (
                            <div key={id} className="mb-1.5 last:mb-0">
                              <div className="flex items-baseline justify-between mb-0.5">
                                <span className={`text-xs font-semibold ${isElim ? "line-through text-pastel-rose" : isWin ? "text-pastel-gold" : "text-pastel-ink"}`}>
                                  {isElim && "✕ "}{isWin && "✓ "}{opt?.label ?? id}
                                </span>
                                <span className="text-[11px] text-pastel-mid tabular-nums ml-3 shrink-0">{count} ({pct}%)</span>
                              </div>
                              <div className="h-1 bg-pastel-border w-full rounded-full overflow-hidden">
                                <div
                                  className={`h-1 rounded-full ${isElim ? "bg-pastel-rose" : isWin ? "bg-pastel-gold" : "bg-pastel-muted"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {r.eliminated?.length > 0 && (
                          <p className="text-[11px] text-pastel-rose mt-2.5 font-semibold tracking-wide">
                            Eliminated → {r.eliminated.map((e) => e.label).join(", ")}
                          </p>
                        )}
                        {isLast && winner && (
                          <p className="text-[11px] text-pastel-gold mt-2.5 font-semibold tracking-wide">
                            Winner → {winner.label}
                          </p>
                        )}
                        {isLast && isTie && r.winners?.length > 0 && (
                          <p className="text-[11px] text-pastel-gold mt-2.5 font-semibold tracking-wide">
                            Co-winners → {r.winners.map((w) => w.label).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-8 text-[11px] tracking-[0.35em] uppercase border-t border-pastel-border pt-8">
          {poll.status !== "CLOSED" && (
            <Link to={`/polls/${pollId}`} className="text-pastel-mid hover:text-pastel-ink transition-colors font-semibold">
              ← Ballot
            </Link>
          )}
          <Link to="/polls" className="text-pastel-mid hover:text-pastel-ink transition-colors font-semibold">
            All polls
          </Link>
        </div>

      </div>

      {/* Voters sidebar */}
      <div className="absolute top-0 left-full ml-4 w-44 border border-pastel-border bg-pastel-card px-4 py-5">
        <p className="text-[9px] tracking-[0.45em] uppercase text-pastel-gold font-semibold mb-4">Voted</p>
        {sortedVoters.length === 0 ? (
          <p className="text-[11px] text-pastel-muted italic">No votes yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedVoters.map((v, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pastel-border flex items-center justify-center text-[9px] font-bold text-pastel-mid shrink-0">
                  {v.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-[11px] text-pastel-ink truncate">{v.name}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 pt-3 border-t border-pastel-border text-[9px] tracking-[0.3em] uppercase text-pastel-muted">
          {voters.length} vote{voters.length !== 1 ? "s" : ""} cast
        </p>
      </div>

      </div>
    </main>
  );
}
