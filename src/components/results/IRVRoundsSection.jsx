export default function IRVRoundsSection({ viewMode, rounds, options, isTie, winner }) {
  if (viewMode !== "irv" || rounds.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <p className="text-[11px] text-pastel-muted mb-4 font-semibold tracking-[0.2em] uppercase">How the winner was decided: Round-by-round ({rounds.length} round{rounds.length !== 1 ? "s" : ""})</p>
      <div className="relative">
        <div className="absolute left-[17px] top-0 bottom-0 w-px bg-pastel-border" />
        <div className="flex flex-col gap-5">
          {rounds.map((r, i) => {
            const sorted = Object.entries(r.counts).sort(([, a], [, b]) => b - a);
            const roundTotal = sorted.reduce((s, [, c]) => s + c, 0);
            const isLast = i === rounds.length - 1;
            return (
              <div key={r.round} className="flex gap-4">
                <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold
                  ${isLast ? "border-pastel-gold bg-amber-50 text-pastel-gold" : "border-pastel-border bg-pastel-card text-pastel-mid"}`}>
                  {r.round}
                </div>
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
    </div>
  );
}
