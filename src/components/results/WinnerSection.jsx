export default function WinnerSection({
  pollStatus,
  viewMode,
  winner,
  tiedWinners,
  isTie,
  options,
  topNCounts,
  topN,
  exponentialScores,
}) {
  if (pollStatus !== "CLOSED") {
    return (
      <div className="mb-10 py-4 border-t border-pastel-border">
        <p className="text-sm text-pastel-mid italic">Results are published once voting closes.</p>
      </div>
    );
  }

  if (viewMode === "irv") {
    return (
      <div className="mb-10 border-l-4 border-pastel-gold pl-4 sm:pl-5 py-1">
        {winner ? (
          <>
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Winner</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-pastel-ink">{winner.label}</p>
          </>
        ) : isTie && tiedWinners?.length > 0 ? (
          <>
            <p className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-pastel-gold font-semibold mb-1">Co-winners</p>
            {tiedWinners.map((w) => (
              <p key={w.id} className="font-display text-2xl sm:text-3xl font-bold text-pastel-ink">{w.label}</p>
            ))}
          </>
        ) : (
          <p className="font-display text-xl italic text-pastel-muted">No winner determined.</p>
        )}
      </div>
    );
  }

  if (viewMode === "topN") {
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
  }

  if (viewMode === "exponential") {
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
  }

  return null;
}
