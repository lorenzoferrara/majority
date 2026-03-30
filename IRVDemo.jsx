import { useState, useCallback } from "react";

// ── IRV Algorithm (self-contained, mirrors lib/irv.ts) ───────────────────────
function runIRV(ballots, options) {
  if (!options.length) return { winner: null, rounds: [], isTie: false };
  const active = new Set(options);
  const rounds = [];
  const liveBallots = ballots.map((b) => b.preferences.filter((id) => options.includes(id)));
  let roundNumber = 0;

  while (active.size > 0) {
    roundNumber++;
    const counts = {};
    for (const id of active) counts[id] = 0;
    let totalActive = 0;

    for (const prefs of liveBallots) {
      const top = prefs.find((id) => active.has(id));
      if (top !== undefined) { counts[top]++; totalActive++; }
    }

    const majority = totalActive / 2;
    const winner = Object.entries(counts).find(([, v]) => v > majority)?.[0];
    if (winner) {
      rounds.push({ round: roundNumber, counts, totalActive, eliminated: [], winner });
      return { winner, rounds, isTie: false };
    }

    const minVotes = Math.min(...Object.values(counts));
    const toEliminate = Object.entries(counts).filter(([, v]) => v === minVotes).map(([id]) => id);

    if (toEliminate.length === active.size) {
      rounds.push({ round: roundNumber, counts, totalActive, eliminated: toEliminate });
      return { winner: null, rounds, isTie: true };
    }

    for (const id of toEliminate) active.delete(id);
    rounds.push({ round: roundNumber, counts, totalActive, eliminated: toEliminate });

    if (active.size === 1) {
      const last = [...active][0];
      rounds[rounds.length - 1].winner = last;
      return { winner: last, rounds, isTie: false };
    }
  }
  return { winner: null, rounds, isTie: false };
}

// ── Preset scenarios ─────────────────────────────────────────────────────────
const SCENARIOS = {
  "Classic Runoff": {
    options: [
      { id: "A", label: "Oppenheimer", emoji: "⚛️" },
      { id: "B", label: "Poor Things", emoji: "🌿" },
      { id: "C", label: "Barbie", emoji: "👛" },
      { id: "D", label: "Past Lives", emoji: "🕊️" },
    ],
    ballots: [
      ...Array(28).fill({ preferences: ["A", "B", "D"] }),
      ...Array(25).fill({ preferences: ["B", "A", "C"] }),
      ...Array(22).fill({ preferences: ["C", "B", "A"] }),
      ...Array(15).fill({ preferences: ["D", "B", "A"] }),
      ...Array(10).fill({ preferences: ["D", "C", "B"] }),
    ],
  },
  "Instant Winner": {
    options: [
      { id: "A", label: "Inception", emoji: "🌀" },
      { id: "B", label: "Tenet", emoji: "🔄" },
      { id: "C", label: "Interstellar", emoji: "🚀" },
    ],
    ballots: [
      ...Array(55).fill({ preferences: ["A", "B"] }),
      ...Array(25).fill({ preferences: ["B", "A"] }),
      ...Array(20).fill({ preferences: ["C", "A"] }),
    ],
  },
  "Dead Heat Tie": {
    options: [
      { id: "A", label: "Film A", emoji: "🎬" },
      { id: "B", label: "Film B", emoji: "🎥" },
    ],
    ballots: [
      ...Array(10).fill({ preferences: ["A", "B"] }),
      ...Array(10).fill({ preferences: ["B", "A"] }),
    ],
  },
  "Multi-Round Battle": {
    options: [
      { id: "A", label: "The Bear", emoji: "🐻" },
      { id: "B", label: "Succession", emoji: "👔" },
      { id: "C", label: "Beef", emoji: "🥩" },
      { id: "D", label: "White Lotus", emoji: "🪷" },
      { id: "E", label: "Barry", emoji: "🎭" },
    ],
    ballots: [
      ...Array(22).fill({ preferences: ["A", "B", "C"] }),
      ...Array(18).fill({ preferences: ["B", "A", "D"] }),
      ...Array(17).fill({ preferences: ["C", "E", "B"] }),
      ...Array(16).fill({ preferences: ["D", "B", "A"] }),
      ...Array(14).fill({ preferences: ["E", "C", "B"] }),
      ...Array(13).fill({ preferences: ["D", "E", "C"] }),
    ],
  },
};

// ── Color palette for candidates ─────────────────────────────────────────────
const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316"];

export default function App() {
  const [scenarioKey, setScenarioKey] = useState("Classic Runoff");
  const [currentRound, setCurrentRound] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const scenario = SCENARIOS[scenarioKey];
  const result = hasRun ? runIRV(scenario.ballots, scenario.options.map((o) => o.id)) : null;
  const colorMap = Object.fromEntries(scenario.options.map((o, i) => [o.id, COLORS[i % COLORS.length]]));
  const labelMap = Object.fromEntries(scenario.options.map((o) => [o.id, o]));

  const rounds = result?.rounds ?? [];
  const displayRound = rounds[currentRound];

  const maxCount = displayRound
    ? Math.max(...Object.values(displayRound.counts), 1)
    : 1;

  function handleScenarioChange(key) {
    setScenarioKey(key);
    setHasRun(false);
    setCurrentRound(0);
  }

  function handleRun() {
    setHasRun(true);
    setCurrentRound(0);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#f0ece8",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#a89fd0", textTransform: "uppercase", marginBottom: 8 }}>
          Instant-Runoff Voting
        </div>
        <h1 style={{
          fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
          fontWeight: 700,
          margin: 0,
          background: "linear-gradient(90deg, #ffd700, #ffe87c)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🏆 Monthly Oscar Voting
        </h1>
        <p style={{ color: "#8b82b8", marginTop: 8, fontSize: 14 }}>
          Live algorithm visualizer — watch IRV redistribute votes round by round
        </p>
      </div>

      {/* Scenario picker */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {Object.keys(SCENARIOS).map((key) => (
          <button
            key={key}
            onClick={() => handleScenarioChange(key)}
            style={{
              padding: "7px 16px",
              borderRadius: 9999,
              border: scenarioKey === key ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.15)",
              background: scenarioKey === key ? "rgba(255, 215, 0, 0.15)" : "rgba(255,255,255,0.05)",
              color: scenarioKey === key ? "#ffd700" : "#a89fd0",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: scenarioKey === key ? 700 : 400,
              transition: "all 0.2s",
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Ballot summary */}
      <div style={{
        maxWidth: 720,
        margin: "0 auto 24px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: 20,
      }}>
        <div style={{ fontSize: 13, color: "#a89fd0", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Candidates — {scenario.ballots.length} ballots
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {scenario.options.map((opt) => (
            <div key={opt.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "6px 14px",
              border: `1px solid ${colorMap[opt.id]}44`,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: colorMap[opt.id], flexShrink: 0,
              }} />
              <span style={{ fontSize: 16 }}>{opt.emoji}</span>
              <span style={{ fontSize: 14, color: "#e8e0f0" }}>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Run button */}
      {!hasRun && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={handleRun}
            style={{
              padding: "14px 40px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: 14,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(99,102,241,0.5)",
              letterSpacing: "0.05em",
            }}
          >
            ▶ Run Election
          </button>
        </div>
      )}

      {/* Results */}
      {hasRun && result && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Winner banner */}
          {result.winner && (
            <div style={{
              textAlign: "center",
              padding: "20px 24px",
              background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))",
              border: "2px solid rgba(255,215,0,0.5)",
              borderRadius: 18,
              marginBottom: 28,
            }}>
              <div style={{ fontSize: 36 }}>{labelMap[result.winner].emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffd700", marginTop: 6 }}>
                {labelMap[result.winner].label}
              </div>
              <div style={{ fontSize: 13, color: "#a89fd0", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Winner — after {rounds.length} round{rounds.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
          {result.isTie && (
            <div style={{
              textAlign: "center", padding: "20px", background: "rgba(255,255,255,0.05)",
              border: "2px solid rgba(255,255,255,0.2)", borderRadius: 18, marginBottom: 28,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e8e0f0" }}>⚖️ Dead Heat — Tie</div>
            </div>
          )}

          {/* Round navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#a89fd0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Round {currentRound + 1} of {rounds.length}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setCurrentRound((r) => Math.max(0, r - 1))}
                disabled={currentRound === 0}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: currentRound === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: currentRound === 0 ? "#5a526e" : "#e8e0f0",
                  cursor: currentRound === 0 ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >← Prev</button>
              <button
                onClick={() => setCurrentRound((r) => Math.min(rounds.length - 1, r + 1))}
                disabled={currentRound === rounds.length - 1}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: currentRound === rounds.length - 1 ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.3)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  color: currentRound === rounds.length - 1 ? "#5a526e" : "#e8e0f0",
                  cursor: currentRound === rounds.length - 1 ? "not-allowed" : "pointer",
                  fontSize: 13,
                }}
              >Next →</button>
            </div>
          </div>

          {/* Round detail */}
          {displayRound && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, color: "#a89fd0", marginBottom: 16 }}>
                {displayRound.totalActive} active ballots
                {displayRound.winner && ` · ${labelMap[displayRound.winner].label} reaches majority!`}
                {displayRound.eliminated.length > 0 && !displayRound.winner &&
                  ` · Eliminating: ${displayRound.eliminated.map((id) => labelMap[id].label).join(", ")}`}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(displayRound.counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([id, count]) => {
                    const pct = displayRound.totalActive ? (count / displayRound.totalActive) * 100 : 0;
                    const isElim = displayRound.eliminated.includes(id);
                    const isWinner = displayRound.winner === id;
                    const opt = labelMap[id];
                    const color = colorMap[id];

                    return (
                      <div key={id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                            <span style={{
                              fontSize: 14,
                              color: isElim ? "#5a526e" : "#e8e0f0",
                              textDecoration: isElim ? "line-through" : "none",
                              fontWeight: isWinner ? 700 : 400,
                            }}>
                              {opt.label}
                            </span>
                            {isElim && <span style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "2px 7px", borderRadius: 999 }}>eliminated</span>}
                            {isWinner && <span style={{ fontSize: 11, color: "#ffd700", background: "rgba(255,215,0,0.15)", padding: "2px 7px", borderRadius: 999 }}>🏆 winner</span>}
                          </div>
                          <span style={{ fontSize: 13, color: "#a89fd0" }}>
                            {count} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: isElim ? "#3d374f" : isWinner ? "linear-gradient(90deg, #ffd700, #ffe87c)" : color,
                            borderRadius: 4,
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                        {/* 50% threshold line indicator */}
                        <div style={{ position: "relative", height: 0 }}>
                          <div style={{
                            position: "absolute", left: "50%", top: -8,
                            width: 1, height: 8, background: "rgba(255,255,255,0.2)",
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 50% threshold note */}
              <div style={{ marginTop: 14, fontSize: 12, color: "#5a526e" }}>
                Majority threshold: {Math.floor(displayRound.totalActive / 2) + 1} votes ({((Math.floor(displayRound.totalActive / 2) + 1) / displayRound.totalActive * 100).toFixed(0)}%+)
              </div>
            </div>
          )}

          {/* Round pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {rounds.map((r, i) => (
              <button
                key={i}
                onClick={() => setCurrentRound(i)}
                style={{
                  padding: "5px 13px",
                  borderRadius: 999,
                  border: currentRound === i ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)",
                  background: currentRound === i ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
                  color: currentRound === i ? "#a5b4fc" : "#5a526e",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                R{r.round} {r.winner ? "🏆" : r.eliminated.length ? "✂️" : ""}
              </button>
            ))}
          </div>

          {/* Reset */}
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button
              onClick={() => { setHasRun(false); setCurrentRound(0); }}
              style={{
                padding: "8px 20px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                color: "#a89fd0",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              ↺ Reset
            </button>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "#3d374f" }}>
        IRV algorithm · mirrors <code style={{ color: "#5a526e" }}>lib/irv.ts</code> exactly
      </div>
    </div>
  );
}
