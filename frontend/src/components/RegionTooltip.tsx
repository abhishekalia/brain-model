interface RegionTooltipProps {
  name: string;
  score: number;
  marketingLabel: string;
  description: string;
}

export default function RegionTooltip({ name, score, marketingLabel, description }: RegionTooltipProps) {
  const getScoreColor = (s: number) => s >= 75 ? '#C4453A' : s >= 50 ? '#E8A87C' : '#A8C5DA';

  return (
    <div className="bg-white border border-[#E8E3DC] rounded-xl p-3 shadow-lg text-sm pointer-events-none w-52">
      <div className="font-semibold text-[#1C1C1C] text-xs">{name}</div>
      <div className="text-[#8B5E3C] text-xs mb-2">{marketingLabel}</div>
      <div className="text-[#6B6560] text-xs leading-relaxed mb-2 line-clamp-3">{description}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#F0EDE8] rounded-full h-1.5">
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }} />
        </div>
        <span className="text-[#1C1C1C] font-bold text-xs">{score}</span>
      </div>
    </div>
  );
}
