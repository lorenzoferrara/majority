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
  const [viewMode, setViewMode] = useState("irv"); // "irv" | "topN" | "exponential"
  const [topN, setTopN] = useState(2);
  const [decayFactor, setDecayFactor] = useState(1.4);
  const [showExponentialInfo, setShowExponentialInfo] = useState(false);

  function formatMonth(monthStr) {
    if (monthStr.includes('Demo')) {
      const parts = monthStr.split(' – ');
      if (parts.length === 2) {
        const date = new Date(parts[1] + '-01');
        return `Demo – ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
      }
    }
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }

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

  const { poll, options, totalBallots, voters = [], winner, winners: tiedWinners, isTie, firstChoiceCounts, topTwoCounts = {}, rounds, allVoterRankings = [] } = data;
  const sortedVoters = [...voters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // Calculate top-N counts from all voter rankings
  const calculateTopNCounts = (n) => {
    const counts = {};
    for (const option of options) {
      counts[option.id] = 0;
    }
    
    // If n === 2 and we have precomputed topTwoCounts, use it directly
    if (n === 2 && Object.keys(topTwoCounts).length > 0) {
      return { ...topTwoCounts };
    }
    
    // Try allVoterRankings first (from API)
    if (allVoterRankings && allVoterRankings.length > 0) {
      for (const ranking of allVoterRankings) {
        if (ranking && Array.isArray(ranking)) {
          for (let i = 0; i < Math.min(n, ranking.length); i++) {
            const optionId = ranking[i];
            if (counts.hasOwnProperty(optionId)) {
              counts[optionId]++;
            }
          }
        }
      }
      // If we got any non-zero counts, return them
      if (Object.values(counts).some(c => c > 0)) {
        return counts;
      }
    }
    
    // Fall back to voter.ranking if available
    if (voters && voters.length > 0) {
      for (const voter of voters) {
        if (voter.ranking && Array.isArray(voter.ranking)) {
          for (let i = 0; i < Math.min(n, voter.ranking.length); i++) {
            const optionId = voter.ranking[i];
            if (counts.hasOwnProperty(optionId)) {
              counts[optionId]++;
            }
          }
        }
      }
    }
    
    return counts;
  };

  const topNCounts = calculateTopNCounts(topN);

  // Calculate exponential scores: 1, 1/2, 1/4, 1/8, etc.
  const calculateExponentialScores = (factor = decayFactor) => {
    const scores = {};
    for (const option of options) {
      scores[option.id] = 0;
    }
    
    // Try allVoterRankings first (from API)
    if (allVoterRankings && allVoterRankings.length > 0) {
      for (const ranking of allVoterRankings) {
        if (ranking && Array.isArray(ranking)) {
          for (let i = 0; i < ranking.length; i++) {
            const optionId = ranking[i];
            if (scores.hasOwnProperty(optionId)) {
              scores[optionId] += Math.pow(factor, -i);
            }
          }
        }
      }
      // If we got any non-zero scores, return them
      if (Object.values(scores).some(s => s > 0)) {
        return scores;
      }
    }
    
    // Fall back to voter.ranking if available
    if (voters && voters.length > 0) {
      for (const voter of voters) {
        if (voter.ranking && Array.isArray(voter.ranking)) {
          for (let i = 0; i < voter.ranking.length; i++) {
            const optionId = voter.ranking[i];
            if (scores.hasOwnProperty(optionId)) {
              scores[optionId] += Math.pow(factor, -i);
            }
          }
        }
      }
    }
    
    return scores;
  };

  const exponentialScores = calculateExponentialScores();

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-2xl">
      <div className="border border-pastel-border bg-pastel-card px-16 py-14">

        <Link
          to="/polls"
          aria-label="Back to all polls"
          className="inline-flex items-center justify-center w-10 h-10 border border-pastel-border bg-[#f4f0ec] text-pastel-ink hover:bg-pastel-gold hover:text-pastel-ink transition-colors mb-8"
        >
          <span aria-hidden="true" className="text-xl leading-none">←</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[11px] tracking-[0.5em] uppercase text-pastel-gold font-medium">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>
        <h1 className="font-display text-5xl font-bold text-pastel-ink leading-none mb-1">{formatMonth(poll.month)}</h1>
        <p className="text-xs tracking-[0.4em] uppercase text-pastel-muted mb-6">Results</p>

        {/* View mode toggle */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex items-center gap-1 border border-pastel-border bg-[#f4f0ec] p-1 w-fit">
            <button
              onClick={() => setViewMode("irv")}
              className={`text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-semibold transition-colors ${viewMode === "irv" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
            >
              Ranked choice
            </button>
            <button
              onClick={() => setViewMode("topN")}
              className={`text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-semibold transition-colors ${viewMode === "topN" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
            >
              Top picks
            </button>
            <button
              onClick={() => setViewMode("exponential")}
              className={`text-[10px] tracking-[0.3em] uppercase px-4 py-1.5 font-semibold transition-colors ${viewMode === "exponential" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
            >
              Exponential
            </button>
          </div>
          {viewMode === "topN" && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-pastel-muted font-medium">Top</label>
              <button
                onClick={() => setTopN(Math.max(1, topN - 1))}
                disabled={topN <= 1}
                className="text-[10px] font-semibold px-2 py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="text-[10px] font-semibold w-8 text-center">{topN}</span>
              <button
                onClick={() => setTopN(Math.min(options.length, topN + 1))}
                disabled={topN >= options.length}
                className="text-[10px] font-semibold px-2 py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          )}
          {viewMode === "exponential" && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-pastel-muted font-medium">Decay</label>
              <button
                onClick={() => setDecayFactor(Math.max(1.1, Math.round((decayFactor - 0.1) * 10) / 10))}
                disabled={decayFactor <= 1.1}
                className="text-[10px] font-semibold px-2 py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="text-[10px] font-semibold w-12 text-center">{decayFactor.toFixed(1)}</span>
              <button
                onClick={() => setDecayFactor(Math.round((decayFactor + 0.1) * 10) / 10)}
                disabled={decayFactor >= 5}
                className="text-[10px] font-semibold px-2 py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          )}
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

        {poll.status === "CLOSED" && viewMode === "topN" && (() => {
          const maxCount = Math.max(0, ...options.map((o) => topNCounts[o.id] || 0));
          const topNWinners = options.filter((o) => (topNCounts[o.id] || 0) === maxCount && maxCount > 0);
          return (
            <div className="mb-10 border-l-4 border-pastel-gold pl-5 py-1">
              {topNWinners.length === 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
                  <p className="font-display text-3xl font-bold text-pastel-ink">{topNWinners[0].label}</p>
                </>
              ) : topNWinners.length > 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Co-winners</p>
                  {topNWinners.map((w) => (
                    <p key={w.id} className="font-display text-3xl font-bold text-pastel-ink">{w.label}</p>
                  ))}
                </>
              ) : (
                <p className="font-display text-xl italic text-pastel-muted">No winner determined.</p>
              )}
            </div>
          );
        })()}

        {poll.status === "CLOSED" && viewMode === "exponential" && (() => {
          const maxScore = Math.max(0, ...options.map((o) => exponentialScores[o.id] || 0));
          const expWinners = options.filter((o) => Math.abs((exponentialScores[o.id] || 0) - maxScore) < 0.0001 && maxScore > 0);
          return (
            <div className="mb-10 border-l-4 border-pastel-gold pl-5 py-1">
              {expWinners.length === 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
                  <p className="font-display text-3xl font-bold text-pastel-ink">{expWinners[0].label}</p>
                </>
              ) : expWinners.length > 1 ? (
                <>
                  <p className="text-[11px] tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Co-winners</p>
                  {expWinners.map((w) => (
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
          <span>{viewMode === "irv" ? "Elimination round" : viewMode === "exponential" ? "Exponential score" : `Top-${topN} pick appearances`}</span>
          <span>{totalBallots} voter{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {/* Bars */}
        {(() => {
          const counts = viewMode === "irv" ? (rounds.length > 0 ? rounds[rounds.length - 1].counts : firstChoiceCounts) : viewMode === "exponential" ? exponentialScores : topNCounts;
          const totalForPct = viewMode === "irv" ? totalBallots : viewMode === "exponential" ? Object.values(exponentialScores).reduce((a, b) => a + b, 0) : options.reduce((s, o) => s + (topNCounts[o.id] || 0), 0);
          let sorted;
          if (viewMode === "irv" && rounds.length > 0) {
            // Custom order: winners first, then eliminated in reverse order of elimination
            const eliminatedOrder = [];
            for (const r of rounds) {
              if (r.eliminated) eliminatedOrder.push(...r.eliminated);
            }
            const reversedEliminated = eliminatedOrder.reverse();
            const winnerList = winner ? [winner] : tiedWinners || [];
            const customOrder = [...winnerList, ...reversedEliminated];
            sorted = options.slice().sort((a, b) => {
              const aIndex = customOrder.findIndex(o => o.id === a.id);
              const bIndex = customOrder.findIndex(o => o.id === b.id);
              return aIndex - bIndex;
            });
          } else {
            sorted = options.slice().sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
          }
          // dense rank: ties share the same rank
          const ranks = {};
          if (viewMode === "irv" && rounds.length > 0) {
            // For IRV, rank based on elimination order: winners rank 1, then eliminated by reverse order
            const winnerList = winner ? [winner] : tiedWinners || [];
            const winnerCount = winnerList.length;
            for (let i = 0; i < sorted.length; i++) {
              ranks[sorted[i].id] = i < winnerCount ? 1 : 2 + (i - winnerCount);
            }
          } else {
            let rank = 1;
            for (let i = 0; i < sorted.length; i++) {
              if (i > 0 && (counts[sorted[i].id] || 0) < (counts[sorted[i - 1].id] || 0)) {
                rank = i + 1;
              }
              ranks[sorted[i].id] = rank;
            }
          }
          return (
            <div className="flex flex-col gap-1.5 mb-8">
              {sorted.map((option) => {
                const count = counts[option.id] || 0;
                const pct = totalForPct > 0 ? Math.round((count / totalForPct) * 100) : 0;
                const r = ranks[option.id];
                const isTop = r === 1;
                // For IRV, show elimination round instead of votes
                let displayText = viewMode === "exponential" ? `${count.toFixed(2)}` : `${count} (${pct}%)`;
                let barPct = pct;
                if (viewMode === "irv" && rounds.length > 0) {
                  const elimRoundIndex = rounds.findIndex(r => r.eliminated?.some(e => e.id === option.id));
                  const roundNum = elimRoundIndex === -1 ? rounds.length : elimRoundIndex + 1;
                  displayText = roundNum === rounds.length ? "Winner" : `Eliminated Round ${roundNum}`;
                  barPct = (roundNum / rounds.length) * 100;
                }
                return (
                  <div key={option.id} className={`px-3 py-2.5 border flex items-center gap-3 ${isTop ? "border-pastel-gold bg-amber-50" : "border-pastel-border bg-[#f4f0ec]"}`}>
                    <Medal rank={r} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className={`font-display text-base font-semibold ${isTop ? "text-pastel-ink" : "text-pastel-mid"}`}>
                          {option.label}
                        </span>
                        <span className="text-pastel-muted text-[11px] tabular-nums ml-4 shrink-0">{displayText}</span>
                      </div>
                      <div className="h-1 bg-pastel-border w-full rounded-full overflow-hidden">
                        <div
                          className={`h-1 rounded-full transition-all duration-700 ${isTop ? "bg-pastel-gold" : "bg-pastel-muted"}`}
                          style={{ width: `${barPct}%` }}
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
        {viewMode === "topN" && (
          <p className="text-[11px] text-pastel-muted mb-8 leading-relaxed">
            Each voter's top {topN} choice{topN > 1 ? 's each' : ''} count{topN > 1 ? '' : 's'} as one vote. The book with the most appearances in top-{topN} picks wins.
          </p>
        )}

        {/* Exponential method explanation */}
        {viewMode === "exponential" && (
          <div className="mb-8 relative">
            <div className="flex items-start gap-2">
              <p className="text-[11px] text-pastel-muted leading-relaxed flex-1">
                Each voter's choices are scored exponentially with a decay factor of {decayFactor.toFixed(1)}: 1st place gets 1 point, 2nd gets {(1/decayFactor).toFixed(2)} points, 3rd gets {Math.pow(decayFactor, -2).toFixed(2)} points, and so on. The book with the highest total score wins.
              </p>
              <button
                onClick={() => setShowExponentialInfo(!showExponentialInfo)}
                className="text-pastel-muted hover:text-pastel-ink flex-shrink-0 mt-0.5 transition-colors"
                title="View score decay visualization"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-pastel-muted text-[10px] font-semibold">i</span>
              </button>
            </div>
            {showExponentialInfo && (
              <div className="mt-4 p-4 bg-pastel-card border border-pastel-border rounded">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pastel-mid">Score Decay by Position</p>
                  <button
                    onClick={() => setShowExponentialInfo(false)}
                    className="text-pastel-muted hover:text-pastel-ink text-xs"
                  >
                    ✕
                  </button>
                </div>
                <svg viewBox="0 0 280 140" className="w-full max-w-sm border border-pastel-border bg-white rounded">
                  {/* Grid lines */}
                  <line x1="30" y1="110" x2="270" y2="110" stroke="#e5e1d8" strokeWidth="1" />
                  {/* Y axis */}
                  <line x1="30" y1="20" x2="30" y2="110" stroke="#8b8380" strokeWidth="1.5" />
                  {/* X axis */}
                  <line x1="30" y1="110" x2="270" y2="110" stroke="#8b8380" strokeWidth="1.5" />
                  
                  {/* Grid background */}
                  {[...Array(5)].map((_, i) => {
                    const x = 30 + (i + 1) * 48;
                    return <line key={`vgrid-${i}`} x1={x} y1="20" x2={x} y2="110" stroke="#ede9e2" strokeWidth="0.5" strokeDasharray="2,2" />;
                  })}
                  {[...Array(4)].map((_, i) => {
                    const y = 110 - (i + 1) * 22.5;
                    return <line key={`hgrid-${i}`} x1="30" y1={y} x2="270" y2={y} stroke="#ede9e2" strokeWidth="0.5" strokeDasharray="2,2" />;
                  })}
                  
                  {/* Y axis labels */}
                  <text x="25" y="115" fontSize="10" textAnchor="end" fill="#666">0</text>
                  <text x="25" y="27" fontSize="10" textAnchor="end" fill="#666">1</text>
                  
                  {/* Points and line */}
                  {[...Array(6)].map((_, i) => {
                    const score = Math.pow(decayFactor, -i);
                    const x = 30 + (i + 1) * 40;
                    const y = 110 - score * 90;
                    return (
                      <g key={`point-${i}`}>
                        {i < 5 && <line x1={x} y1={y} x2={30 + (i + 2) * 40} y2={110 - Math.pow(decayFactor, -(i + 1)) * 90} stroke="#a89968" strokeWidth="2" />}
                        <circle cx={x} cy={y} r="3" fill="#a89968" />
                        <text x={x} y="125" fontSize="9" textAnchor="middle" fill="#666">{i + 1}</text>
                        <text x={x} y="103" fontSize="8" textAnchor="middle" fill="#999">{score.toFixed(2)}</text>
                      </g>
                    );
                  })}
                  
                  {/* Axis labels */}
                  <text x="150" y="138" fontSize="10" textAnchor="middle" fill="#666">Position</text>
                  <text x="8" y="65" fontSize="10" textAnchor="middle" fill="#666" transform="rotate(-90 8 65)">Score</text>
                </svg>
              </div>
            )}
          </div>
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
            Back to polls
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
