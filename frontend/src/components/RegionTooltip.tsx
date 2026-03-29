interface RegionTooltipProps {
  name: string;
  score: number;
  marketingLabel: string;
  description: string;
}

export default function RegionTooltip({ name, score, marketingLabel, description }: RegionTooltipProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-sm pointer-events-none">
      <div className="font-bold text-white">{name}</div>
      <div className="text-blue-400 text-xs mb-1">{marketingLabel}</div>
      <div className="text-gray-300 mb-2">{description}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-red-500"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-white font-bold">{score}</span>
      </div>
    </div>
  );
}
