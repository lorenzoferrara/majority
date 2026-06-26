import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSSE } from "../hooks/useSSE";
import ViewModeToggle from "../components/results/ViewModeToggle";
import WinnerSection from "../components/results/WinnerSection";
import InfoSection from "../components/results/InfoSection";
import LeaderboardSection from "../components/results/LeaderboardSection";
import IRVRoundsSection from "../components/results/IRVRoundsSection";

export default function Results() {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("irv"); // "irv" | "topN" | "exponential" | "info"
  const [topN, setTopN] = useState(2);
  const [decayFactor, setDecayFactor] = useState(1.8);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [showKdeOverlay, setShowKdeOverlay] = useState(true);
  const [selectedInfoOptionId, setSelectedInfoOptionId] = useState(null);

  function isDateMonth(str) {
    return /^\d{4}-\d{2}$/.test(str) || str.includes('Demo');
  }

  function formatMonth(monthStr) {
    if (!isDateMonth(monthStr)) {
      return monthStr;
    }
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

  function formatPollTitle(pollData) {
    const base = formatMonth(pollData.month);
    if ((pollData.monthCount ?? 1) > 1) {
      return `${base} (${pollData.monthOrdinal ?? 1})`;
    }
    return base;
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

  // Effect 1: Initial load on mount or pollId change
  useEffect(() => { 
    loadResults(); 
  }, [pollId]);

  // Effect 2: Resilience Polling (N-seconds heartbeat)
  useEffect(() => {
    const heartbeat = setInterval(() => {
      loadResults();
    }, 5000); // 5 seconds

    return () => clearInterval(heartbeat);
  }, [pollId]);

  useEffect(() => {
    setShowAllInfo(false);
    setShowKdeOverlay(true);
    setSelectedInfoOptionId(null);
  }, [pollId]);

  // Effect 3: Real-time updates via SSE
  useSSE({ "ballot-submitted": loadResults });

  if (loading) {
    return (
      <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12">
        <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-16 py-6 sm:py-14">
          <p className="text-xs tracking-[0.3em] uppercase text-pastel-muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12">
        <div className="w-full max-w-2xl border border-pastel-border bg-pastel-card px-4 sm:px-16 py-6 sm:py-14">
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
  const getRankingRows = () => {
    const apiRankingRows = allVoterRankings.filter((ranking) => Array.isArray(ranking));
    if (apiRankingRows.length > 0) {
      return apiRankingRows;
    }

    if (voters && voters.length > 0) {
      return voters.map((voter) => voter.ranking).filter((ranking) => Array.isArray(ranking));
    }

    return [];
  };
  const rankingRows = getRankingRows();

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
    if (rankingRows.length > 0) {
      for (const ranking of rankingRows) {
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
    if (rankingRows.length > 0) {
      for (const ranking of rankingRows) {
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

    return scores;
  };

  const exponentialScores = calculateExponentialScores();
  const positionDistributions = (() => {
    const distributions = {};
    for (const option of options) {
      distributions[option.id] = Array(options.length).fill(0);
    }

    for (const ranking of rankingRows) {
      for (let i = 0; i < Math.min(ranking.length, options.length); i++) {
        const optionId = ranking[i];
        if (distributions.hasOwnProperty(optionId)) {
          distributions[optionId][i]++;
        }
      }
    }

    return distributions;
  })();
  const maxPositionFrequency = Math.max(1, ...Object.values(positionDistributions).flat());
  const kdePalette = ["#a89968", "#8f7aa8", "#6f9a8d", "#c07a64", "#6f87b7", "#b07d9a", "#8a9a5b", "#b58a55"];
  const kdeBandwidth = Math.max(0.55, options.length / 8);
  const kdeSampleCount = Math.max(80, options.length * 18);
  const kdeSeries = options.map((option, optionIndex) => {
    const distribution = positionDistributions[option.id] || [];
    const totalPlacements = distribution.reduce((sum, count) => sum + count, 0);
    const points = [];

    for (let i = 0; i < kdeSampleCount; i++) {
      const xValue = options.length === 1
        ? 1
        : 1 + (i / (kdeSampleCount - 1)) * (options.length - 1);
      let density = 0;

      if (totalPlacements > 0) {
        for (let positionIndex = 0; positionIndex < distribution.length; positionIndex++) {
          const count = distribution[positionIndex];
          if (count === 0) continue;
          const z = (xValue - (positionIndex + 1)) / kdeBandwidth;
          density += count * Math.exp(-0.5 * z * z);
        }
        density = density / (totalPlacements * kdeBandwidth * Math.sqrt(2 * Math.PI));
      }

      points.push({ xValue, density });
    }

    return {
      option,
      color: kdePalette[optionIndex % kdePalette.length],
      points,
      totalPlacements,
    };
  });
  const maxKdeDensity = Math.max(0.001, ...kdeSeries.flatMap((series) => series.points.map((point) => point.density)));
  const optionColorById = Object.fromEntries(kdeSeries.map((series) => [series.option.id, series.color]));

  const outcomeOrderedOptions = (() => {
    if (rounds.length > 0) {
      const winnerList = winner ? [winner] : tiedWinners || [];
      const winnerIds = new Set(winnerList.map((w) => w.id));

      const eliminatedIds = [];
      for (const round of rounds) {
        for (const eliminatedOption of round.eliminated || []) {
          if (eliminatedOption?.id && !eliminatedIds.includes(eliminatedOption.id)) {
            eliminatedIds.push(eliminatedOption.id);
          }
        }
      }

      const eliminatedSet = new Set(eliminatedIds);
      const runnerUps = options.filter((option) => !winnerIds.has(option.id) && !eliminatedSet.has(option.id));
      const reversedEliminated = [...eliminatedIds]
        .reverse()
        .map((id) => options.find((option) => option.id === id))
        .filter(Boolean);

      const ordered = [...winnerList, ...runnerUps, ...reversedEliminated];
      const seen = new Set();
      const deduped = [];
      for (const option of ordered) {
        if (!option || seen.has(option.id)) continue;
        seen.add(option.id);
        deduped.push(option);
      }

      for (const option of options) {
        if (!seen.has(option.id)) {
          deduped.push(option);
          seen.add(option.id);
        }
      }

      return deduped;
    }

    return options.slice().sort((a, b) => (firstChoiceCounts[b.id] || 0) - (firstChoiceCounts[a.id] || 0));
  })();

  const defaultInfoOptionIds = (() => {
    const ids = [];
    const winnerList = winner ? [winner] : tiedWinners || [];
    for (const winningOption of winnerList) {
      if (winningOption?.id) ids.push(winningOption.id);
    }

    const runnerUp = outcomeOrderedOptions.find((option) => !ids.includes(option.id));
    if (runnerUp?.id) ids.push(runnerUp.id);

    const topEliminated = rounds
      .flatMap((round) => round.eliminated || [])
      .reverse()
      .find((option) => option?.id && !ids.includes(option.id));
    if (topEliminated?.id) ids.push(topEliminated.id);

    for (const option of outcomeOrderedOptions) {
      if (ids.length >= 3) break;
      if (!ids.includes(option.id)) ids.push(option.id);
    }

    return ids;
  })();

  const infoVisibleOptions = showAllInfo
    ? outcomeOrderedOptions
    : outcomeOrderedOptions.filter((option) => defaultInfoOptionIds.includes(option.id));
  const infoVisibleOptionIdSet = new Set(infoVisibleOptions.map((option) => option.id));

  return (
    <main className="min-h-screen bg-pastel-bg flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12">
      <div className="relative w-full max-w-2xl">
      <div className="border border-pastel-border bg-pastel-card px-4 sm:px-16 py-6 sm:py-14">

        <Link
          to="/polls"
          aria-label="Back to all polls"
          className="inline-flex items-center justify-center w-10 h-10 border border-pastel-border bg-[#f4f0ec] text-pastel-ink hover:bg-pastel-gold hover:text-pastel-ink transition-colors mb-6 sm:mb-8"
        >
          <span aria-hidden="true" className="text-xl leading-none">←</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 sm:mb-10">
          <div className="h-px flex-1 bg-pastel-border" />
          <span className="text-[10px] sm:text-[11px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-pastel-gold font-medium whitespace-nowrap">Book Club</span>
          <div className="h-px flex-1 bg-pastel-border" />
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-pastel-ink leading-none mb-1">{formatPollTitle(poll)}</h1>
        <p className="text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-muted mb-6">Results</p>

        <ViewModeToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
          topN={topN}
          setTopN={setTopN}
          optionsLength={options.length}
          decayFactor={decayFactor}
          setDecayFactor={setDecayFactor}
        />

        <WinnerSection
          pollStatus={poll.status}
          viewMode={viewMode}
          winner={winner}
          tiedWinners={tiedWinners}
          isTie={isTie}
          options={options}
          topNCounts={topNCounts}
          topN={topN}
          exponentialScores={exponentialScores}
        />

        {/* Vote summary label */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-pastel-muted mb-3">
          <span>{viewMode === "irv" ? "Elimination round" : viewMode === "exponential" ? "Exponential score" : viewMode === "info" ? "Vote frequency by position" : `Top-${topN} pick appearances`}</span>
          <span>{totalBallots} voter{totalBallots !== 1 ? "s" : ""}</span>
        </div>

        {viewMode === "info" ? (
          <InfoSection
            rankingRows={rankingRows}
            showAllInfo={showAllInfo}
            setShowAllInfo={setShowAllInfo}
            showKdeOverlay={showKdeOverlay}
            setShowKdeOverlay={setShowKdeOverlay}
            outcomeOrderedOptions={outcomeOrderedOptions}
            infoVisibleOptions={infoVisibleOptions}
            positionDistributions={positionDistributions}
            totalBallots={totalBallots}
            options={options}
            maxPositionFrequency={maxPositionFrequency}
            maxKdeDensity={maxKdeDensity}
            kdeSeries={kdeSeries}
            infoVisibleOptionIdSet={infoVisibleOptionIdSet}
            selectedInfoOptionId={selectedInfoOptionId}
            setSelectedInfoOptionId={setSelectedInfoOptionId}
            optionColorById={optionColorById}
          />
        ) : (
          <LeaderboardSection
            viewMode={viewMode}
            rounds={rounds}
            firstChoiceCounts={firstChoiceCounts}
            exponentialScores={exponentialScores}
            topNCounts={topNCounts}
            totalBallots={totalBallots}
            options={options}
            winner={winner}
            tiedWinners={tiedWinners}
          />
        )}

        {/* Top-2 method explanation */}
        {viewMode === "topN" && (
          <p className="text-[11px] text-pastel-muted mb-8 leading-relaxed">
            Each voter's top {topN} choice{topN > 1 ? 's each' : ''} count{topN > 1 ? '' : 's'} as one vote. The book with the most appearances in top-{topN} picks wins.
          </p>
        )}

        {/* Exponential method explanation */}
        {viewMode === "exponential" && (
          <div className="mb-8">
            <p className="text-[11px] text-pastel-muted leading-relaxed mb-4">
              Each voter's choices are scored exponentially with a decay factor of {decayFactor.toFixed(1)}: 1st place gets 1 point, 2nd gets {(1/decayFactor).toFixed(2)} points, 3rd gets {Math.pow(decayFactor, -2).toFixed(2)} points, and so on. The book with the highest total score wins.
            </p>
            <div className="p-4 bg-pastel-card border border-pastel-border rounded">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pastel-mid mb-3">Score Decay by Position</p>
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
          </div>
        )}

        {viewMode === "info" && (
          <p className="text-[11px] text-pastel-muted mb-8 leading-relaxed">
            Each chart shows where that book appeared across all ballots. The x axis is ranking position, and the y axis is how many voters placed the book there.
          </p>
        )}

        <IRVRoundsSection
          viewMode={viewMode}
          rounds={rounds}
          options={options}
          isTie={isTie}
          winner={winner}
        />

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-8 text-[9px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.35em] uppercase border-t border-pastel-border pt-6 sm:pt-8">
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

      {/* Voters sidebar - hidden on mobile, shown on desktop */}
      <div className="hidden lg:block absolute top-0 left-full ml-4 w-44 border border-pastel-border bg-pastel-card px-4 py-5">
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
