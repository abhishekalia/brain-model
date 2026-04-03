'use client';
import { Recommendation } from '@/types';

const priorityColors = {
  High:   { dot: '#ef4444', badge: 'text-red-400 border-red-400/30 bg-red-400/10' },
  Medium: { dot: '#FF6500', badge: 'text-accent border-accent/30 bg-accent-dim' },
  Low:    { dot: '#3b82f6', badge: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
};

export default function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations.length) return null;

  const sorted = [...recommendations].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Recommendations</p>
        <span className="text-xs text-text-secondary">{recommendations.length} actions</span>
      </div>
      <div className="space-y-3">
        {sorted.map((rec, i) => {
          const c = priorityColors[rec.priority];
          return (
            <div key={i} className="bg-surface-2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: c.dot }} />
                  <p className="text-text-primary text-sm font-semibold leading-snug">{rec.action}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 border ${c.badge}`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed mb-2 ml-3.5">{rec.reason}</p>
              <div className="ml-3.5 bg-surface border border-border rounded-lg px-3 py-2">
                <p className="text-xs text-text-secondary/50 uppercase tracking-wider font-medium mb-0.5">Try this</p>
                <p className="text-text-primary text-xs leading-relaxed">{rec.example}</p>
              </div>
              <div className="ml-3.5 mt-2">
                <span className="text-xs text-text-secondary/40">Targets: {rec.region}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
