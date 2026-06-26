import Medal from "./Medal";

export default function LeaderboardSection({
  viewMode,
  rounds,
  firstChoiceCounts,
  exponentialScores,
  topNCounts,
  totalBallots,
  options,
  winner,
  tiedWinners,
}) {
  const counts = viewMode === "irv"
    ? (rounds.length > 0 ? rounds[rounds.length - 1].counts : firstChoiceCounts)
    : viewMode === "exponential"
      ? exponentialScores
      : topNCounts;

  const totalForPct = viewMode === "irv"
    ? totalBallots
    : viewMode === "exponential"
      ? Object.values(exponentialScores).reduce((a, b) => a + b, 0)
      : options.reduce((s, o) => s + (topNCounts[o.id] || 0), 0);

  let sorted;
  if (viewMode === "irv" && rounds.length > 0) {
    const eliminatedOrder = [];
    for (const r of rounds) {
      if (r.eliminated) eliminatedOrder.push(...r.eliminated);
    }
    const reversedEliminated = eliminatedOrder.reverse();
    const winnerList = winner ? [winner] : tiedWinners || [];
    const customOrder = [...winnerList, ...reversedEliminated];
    sorted = options.slice().sort((a, b) => {
      const aIndex = customOrder.findIndex((o) => o.id === a.id);
      const bIndex = customOrder.findIndex((o) => o.id === b.id);
      return aIndex - bIndex;
    });
  } else {
    sorted = options.slice().sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }

  const ranks = {};
  if (viewMode === "irv" && rounds.length > 0) {
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
        const rank = ranks[option.id];
        const isTop = rank === 1;
        let displayText = viewMode === "exponential" ? `${count.toFixed(2)}` : `${count} (${pct}%)`;
        let barPct = pct;

        if (viewMode === "irv" && rounds.length > 0) {
          const elimRoundIndex = rounds.findIndex((round) => round.eliminated?.some((e) => e.id === option.id));
          const roundNum = elimRoundIndex === -1 ? rounds.length : elimRoundIndex + 1;
          const isActualWinner = elimRoundIndex !== -1
            ? rounds[elimRoundIndex]?.winner?.id === option.id
            : !!rounds.find((round) => round.winner?.id === option.id);
          displayText = isActualWinner ? "Winner" : roundNum === rounds.length ? "Runner-up" : `Eliminated Round ${roundNum}`;
          barPct = (roundNum / rounds.length) * 100;
        }

        return (
          <div key={option.id} className={`px-3 py-2.5 border flex items-center gap-3 ${isTop ? "border-pastel-gold bg-amber-50" : "border-pastel-border bg-[#f4f0ec]"}`}>
            <Medal rank={rank} />
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
}
