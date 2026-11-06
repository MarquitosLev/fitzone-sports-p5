
interface CupoIndicatorProps {
  cupoDisponible?: number | null;
  cupoMaximo?: number | null;
}

export function CupoIndicator({ cupoDisponible, cupoMaximo }: CupoIndicatorProps) {
  const max = Math.max(0, Number(cupoMaximo) || 0);
  const disp = Math.max(0, Number(cupoDisponible) || 0);

  // If cupoMaximo is <= 0, percent is 0 (prevents division by zero and NaN)
  const percent = max > 0
    ? Math.min(100, Math.max(0, Math.round(((max - disp) / max) * 100)))
    : 0;

  const barColor = percent < 50 ? 'bg-fitzone-green' : 'bg-fitzone-red';

  return (
    <div className="mt-2.5" data-testid="cupo-indicator">
      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
        <span className="text-slate-500">Cupos</span>
        <span
          className={percent >= 80 ? 'text-[#E5484D] font-bold' : 'text-slate-700 font-bold'}
          data-testid="cupo-indicator-text"
        >
          {disp} / {max}
        </span>
      </div>
      <div
        className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
        data-testid="cupo-indicator-track"
      >
        <div
          data-testid="cupo-indicator-bar"
          data-bar-color={percent < 50 ? 'green' : 'red'}
          className={`${barColor} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

