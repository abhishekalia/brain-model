'use client';
import { Recommendation } from '@/types';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const priorityConfig = {
  High: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  Medium: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  Low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
};

export default function Recommendations({ recommendations }: RecommendationsProps) {
  if (!recommendations.length) return null;

  const sorted = [...recommendations].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Recommendations</p>
        <span className="text-xs text-text-secondary">{recommendations.length} actions</span>
      </div>

      <div className="space-y-3">
        {sorted.map((rec, i) => {
          const config = priorityConfig[rec.priority];
          return (
            <div key={i} className={`${config.bg} ${config.border} border rounded-xl p-4`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${config.dot}`} />
                  <p className="text-text-primary text-sm font-semibold leading-snug">{rec.action}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${config.badge}`}>
                  {rec.priority}
                </span>
              </div>

              <p className="text-text-secondary text-xs leading-relaxed mb-2 ml-3.5">{rec.reason}</p>

              <div className="ml-3.5 bg-white/60 rounded-lg px-3 py-2 border border-white">
                <p className="text-xs text-text-secondary/70 uppercase tracking-wider font-medium mb-0.5">Try this</p>
                <p className="text-text-primary text-xs leading-relaxed">{rec.example}</p>
              </div>

              <div className="ml-3.5 mt-2">
                <span className="text-xs text-text-secondary/50">Targets: {rec.region}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
