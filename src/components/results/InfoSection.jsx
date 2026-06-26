export default function InfoSection({
  rankingRows,
  showAllInfo,
  setShowAllInfo,
  showKdeOverlay,
  setShowKdeOverlay,
  outcomeOrderedOptions,
  infoVisibleOptions,
  positionDistributions,
  totalBallots,
  options,
  maxPositionFrequency,
  maxKdeDensity,
  kdeSeries,
  infoVisibleOptionIdSet,
  selectedInfoOptionId,
  setSelectedInfoOptionId,
  optionColorById,
}) {
  if (rankingRows.length === 0) {
    return (
      <div className="mb-8 border border-pastel-border bg-[#f4f0ec] px-3 sm:px-4 py-4">
        <p className="text-[11px] text-pastel-muted italic">No rankings available yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 border border-pastel-border bg-[#f4f0ec] px-3 sm:px-4 py-4">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[10px] tracking-[0.18em] uppercase text-pastel-muted">
            {showAllInfo ? `Showing all ${outcomeOrderedOptions.length} books` : "Focused view: winner, runner-up, top elimination"}
          </p>
          <button
            type="button"
            onClick={() => setShowAllInfo((prev) => !prev)}
            className="text-[10px] tracking-[0.2em] uppercase text-pastel-mid border border-pastel-border px-2.5 py-1.5 hover:border-pastel-gold hover:text-pastel-gold transition-colors w-fit"
          >
            {showAllInfo ? "Show Focus" : "Show All"}
          </button>
        </div>

        <div className="border border-pastel-border bg-pastel-card px-3 py-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-3 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-pastel-mid">KDE by book</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-pastel-muted">Smoothed density</p>
              <button
                type="button"
                onClick={() => setShowKdeOverlay((prev) => !prev)}
                className="text-[10px] tracking-[0.15em] uppercase text-pastel-mid border border-pastel-border px-2 py-1 hover:border-pastel-gold hover:text-pastel-gold transition-colors"
              >
                {showKdeOverlay ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {!showKdeOverlay ? (
            <p className="text-[11px] text-pastel-muted italic">KDE overlay hidden to reduce visual clutter. Click Show to display it.</p>
          ) : (() => {
            const chartWidth = 320;
            const chartHeight = 190;
            const left = 34;
            const right = 16;
            const top = 18;
            const bottom = 38;
            const innerWidth = chartWidth - left - right;
            const innerHeight = chartHeight - top - bottom;
            const xForPosition = (position) => {
              if (options.length === 1) return left + innerWidth / 2;
              return left + ((position - 1) / (options.length - 1)) * innerWidth;
            };
            const yForDensity = (density) => chartHeight - bottom - (density / maxKdeDensity) * innerHeight;

            return (
              <>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full border border-pastel-border bg-white rounded">
                  <line x1={left} y1={top} x2={left} y2={chartHeight - bottom} stroke="#8b8380" strokeWidth="1.3" />
                  <line x1={left} y1={chartHeight - bottom} x2={chartWidth - right} y2={chartHeight - bottom} stroke="#8b8380" strokeWidth="1.3" />
                  {[0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = chartHeight - bottom - ratio * innerHeight;
                    return <line key={`kde-hgrid-${ratio}`} x1={left} y1={y} x2={chartWidth - right} y2={y} stroke="#ede9e2" strokeWidth="0.6" strokeDasharray="2,2" />;
                  })}
                  {options.map((_, i) => {
                    const x = xForPosition(i + 1);
                    return (
                      <g key={`kde-x-${i}`}>
                        <line x1={x} y1={top} x2={x} y2={chartHeight - bottom} stroke="#ede9e2" strokeWidth="0.5" strokeDasharray="2,2" />
                        <text x={x} y={chartHeight - 15} fontSize="8" textAnchor="middle" fill="#666">{i + 1}</text>
                      </g>
                    );
                  })}
                  <text x={left - 8} y={chartHeight - bottom + 4} fontSize="9" textAnchor="end" fill="#666">0</text>
                  <text x={left - 8} y={top + 4} fontSize="9" textAnchor="end" fill="#666">{maxKdeDensity.toFixed(2)}</text>
                  {kdeSeries.filter((series) => infoVisibleOptionIdSet.has(series.option.id)).map((series) => {
                    if (series.totalPlacements === 0) return null;
                    const path = series.points
                      .map((point, i) => `${i === 0 ? "M" : "L"} ${xForPosition(point.xValue).toFixed(2)} ${yForDensity(point.density).toFixed(2)}`)
                      .join(" ");
                    const isSelected = selectedInfoOptionId === series.option.id;
                    const isDimmed = selectedInfoOptionId && !isSelected;

                    return (
                      <path
                        key={`kde-line-${series.option.id}`}
                        d={path}
                        fill="none"
                        stroke={series.color}
                        strokeWidth={isSelected ? "2.8" : "2"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={isDimmed ? "0.2" : "0.9"}
                      />
                    );
                  })}
                  <text x={(left + chartWidth - right) / 2} y={chartHeight - 2} fontSize="8" textAnchor="middle" fill="#666">Position</text>
                  <text x="9" y={(top + chartHeight - bottom) / 2} fontSize="9" textAnchor="middle" fill="#666" transform={`rotate(-90 9 ${(top + chartHeight - bottom) / 2})`}>Density</text>
                </svg>
                <div className="flex flex-wrap gap-x-2 gap-y-1.5 mt-3">
                  {kdeSeries.filter((series) => infoVisibleOptionIdSet.has(series.option.id)).map((series) => (
                    <button
                      key={`kde-legend-${series.option.id}`}
                      type="button"
                      onClick={() => setSelectedInfoOptionId((prev) => (prev === series.option.id ? null : series.option.id))}
                      className={`flex items-center gap-1.5 min-w-0 border px-1.5 py-0.5 transition-colors ${selectedInfoOptionId === series.option.id ? "border-pastel-gold bg-amber-50" : "border-pastel-border bg-white hover:border-pastel-gold"}`}
                    >
                      <span className="w-3 h-0.5 shrink-0" style={{ backgroundColor: series.color }} />
                      <span className="text-[9px] text-pastel-mid truncate max-w-[9rem]">{series.option.label}</span>
                    </button>
                  ))}
                  {selectedInfoOptionId && (
                    <button
                      type="button"
                      onClick={() => setSelectedInfoOptionId(null)}
                      className="text-[9px] text-pastel-mid underline hover:text-pastel-ink"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {infoVisibleOptions.map((option) => {
          const distribution = positionDistributions[option.id] || [];
          const totalPlacements = distribution.reduce((sum, count) => sum + count, 0);
          const isSelected = selectedInfoOptionId === option.id;
          const isDimmed = selectedInfoOptionId && !isSelected;
          const chartWidth = 280;
          const chartHeight = 150;
          const left = 30;
          const right = 12;
          const top = 14;
          const bottom = 42;
          const innerWidth = chartWidth - left - right;
          const innerHeight = chartHeight - top - bottom;
          const barGap = 3;
          const barWidth = Math.max(5, (innerWidth - barGap * (options.length - 1)) / Math.max(1, options.length));

          return (
            <div
              key={option.id}
              className={`border bg-pastel-card px-3 py-3 transition-opacity ${isSelected ? "border-pastel-gold" : "border-pastel-border"} ${isDimmed ? "opacity-35" : "opacity-100"}`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <p className="font-display text-base font-semibold text-pastel-ink truncate">{option.label}</p>
                <p className="text-[10px] text-pastel-muted tabular-nums shrink-0">{totalPlacements} placement{totalPlacements !== 1 ? "s" : ""}</p>
              </div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full border border-pastel-border bg-white rounded">
                <line x1={left} y1={top} x2={left} y2={chartHeight - bottom} stroke="#8b8380" strokeWidth="1.3" />
                <line x1={left} y1={chartHeight - bottom} x2={chartWidth - right} y2={chartHeight - bottom} stroke="#8b8380" strokeWidth="1.3" />
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartHeight - bottom - ratio * innerHeight;
                  return <line key={`grid-${option.id}-${ratio}`} x1={left} y1={y} x2={chartWidth - right} y2={y} stroke="#ede9e2" strokeWidth="0.6" strokeDasharray="2,2" />;
                })}
                <text x={left - 7} y={chartHeight - bottom + 4} fontSize="9" textAnchor="end" fill="#666">0</text>
                <text x={left - 7} y={top + 4} fontSize="9" textAnchor="end" fill="#666">{maxPositionFrequency}</text>
                {distribution.map((count, i) => {
                  const height = (count / maxPositionFrequency) * innerHeight;
                  const x = left + i * (barWidth + barGap);
                  const y = chartHeight - bottom - height;
                  const pct = totalBallots > 0 ? Math.round((count / totalBallots) * 100) : 0;

                  return (
                    <g key={`${option.id}-position-${i}`}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="2"
                        fill={count > 0 ? (isSelected ? (optionColorById[option.id] || "#a89968") : "#a89968") : "#e5e1d8"}
                      />
                      {count > 0 && <text x={x + barWidth / 2} y={Math.max(top + 8, y - 4)} fontSize="8" textAnchor="middle" fill="#8b8380">{count}</text>}
                      <text x={x + barWidth / 2} y={chartHeight - 27} fontSize="8" textAnchor="middle" fill="#666">{i + 1}</text>
                      <text x={x + barWidth / 2} y={chartHeight - 16} fontSize="7" textAnchor="middle" fill="#999">{pct}%</text>
                    </g>
                  );
                })}
                <text x={(left + chartWidth - right) / 2} y={chartHeight - 3} fontSize="8" textAnchor="middle" fill="#666">Position</text>
                <text x="8" y={(top + chartHeight - bottom) / 2} fontSize="9" textAnchor="middle" fill="#666" transform={`rotate(-90 8 ${(top + chartHeight - bottom) / 2})`}>Frequency</text>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
