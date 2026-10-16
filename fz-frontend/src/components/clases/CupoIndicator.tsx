
interface CupoIndicatorProps {
  cupoDisponible: number;
  cupoMaximo: number;
}

export function CupoIndicator({ cupoDisponible, cupoMaximo }: CupoIndicatorProps) {
  const ocupados = cupoMaximo - cupoDisponible;
  const percent = Math.round((ocupados / cupoMaximo) * 100);
  const barColor = percent < 50 ? 'bg-fitzone-green' : 'bg-fitzone-red';

  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-fitzone-coral mb-1">
        {cupoDisponible} / {cupoMaximo}
      </div>
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div
          className={`${barColor} h-2`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
