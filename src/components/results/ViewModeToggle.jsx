export default function ViewModeToggle({
  viewMode,
  setViewMode,
  topN,
  setTopN,
  optionsLength,
  decayFactor,
  setDecayFactor,
}) {
  return (
    <div className="flex flex-wrap items-start sm:items-center gap-3 sm:gap-4 mb-10">
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-0.5 sm:gap-1 border border-pastel-border bg-[#f4f0ec] p-0.5 sm:p-1 w-full sm:w-fit">
        <button
          onClick={() => setViewMode("irv")}
          className={`text-[10px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.3em] uppercase px-2 sm:px-4 py-1 sm:py-1.5 font-semibold transition-colors whitespace-nowrap ${viewMode === "irv" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
        >
          OSCAR
        </button>
        <button
          onClick={() => setViewMode("topN")}
          className={`text-[10px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.3em] uppercase px-2 sm:px-4 py-1 sm:py-1.5 font-semibold transition-colors whitespace-nowrap ${viewMode === "topN" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
        >
          TOP N
        </button>
        <button
          onClick={() => setViewMode("exponential")}
          className={`text-[10px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.3em] uppercase px-2 sm:px-4 py-1 sm:py-1.5 font-semibold transition-colors whitespace-nowrap ${viewMode === "exponential" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
        >
          EXPONENTIAL
        </button>
        <button
          onClick={() => setViewMode("info")}
          className={`text-[10px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.3em] uppercase px-2 sm:px-4 py-1 sm:py-1.5 font-semibold transition-colors whitespace-nowrap ${viewMode === "info" ? "bg-pastel-card text-pastel-ink shadow-sm" : "text-pastel-muted hover:text-pastel-mid"}`}
        >
          INFO
        </button>
      </div>
      {viewMode === "topN" && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <label className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-pastel-muted font-medium">Top</label>
          <button
            onClick={() => setTopN(Math.max(1, topN - 1))}
            disabled={topN <= 1}
            className="text-[12px] sm:text-[10px] font-semibold px-2.5 sm:px-2 py-1.5 sm:py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[40px]"
          >
            −
          </button>
          <span className="text-[10px] sm:text-[10px] font-semibold w-8 text-center">{topN}</span>
          <button
            onClick={() => setTopN(Math.min(optionsLength, topN + 1))}
            disabled={topN >= optionsLength}
            className="text-[12px] sm:text-[10px] font-semibold px-2.5 sm:px-2 py-1.5 sm:py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[40px]"
          >
            +
          </button>
        </div>
      )}
      {viewMode === "exponential" && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <label className="text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-pastel-muted font-medium">Decay</label>
          <button
            onClick={() => setDecayFactor(Math.max(1.1, Math.round((decayFactor - 0.1) * 10) / 10))}
            disabled={decayFactor <= 1.1}
            className="text-[12px] sm:text-[10px] font-semibold px-2.5 sm:px-2 py-1.5 sm:py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[40px]"
          >
            −
          </button>
          <span className="text-[10px] sm:text-[10px] font-semibold w-8 text-center">{decayFactor.toFixed(1)}</span>
          <button
            onClick={() => setDecayFactor(Math.round((decayFactor + 0.1) * 10) / 10)}
            disabled={decayFactor >= 5}
            className="text-[12px] sm:text-[10px] font-semibold px-2.5 sm:px-2 py-1.5 sm:py-1 border border-pastel-border bg-pastel-card text-pastel-mid hover:text-pastel-ink hover:border-pastel-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[40px]"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
