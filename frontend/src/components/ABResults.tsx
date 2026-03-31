'use client';
import { AnalyzeResponse } from '@/types';

interface ABResultsProps {
  resultA: AnalyzeResponse;
  resultB: AnalyzeResponse;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-cream-dark rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-text-primary text-xs font-bold w-8 text-right">{score}</span>
    </div>
  );
}

export default function ABResults({ resultA, resultB }: ABResultsProps) {
  const winnerA = resultA.engagement_score >= resultB.engagement_score;
  const diff = Math.abs(resultA.engagement_score - resultB.engagement_score);

  return (
    <div className="space-y-3">
      {/* Winner banner */}
      <div className={`bg-white rounded-2xl p-5 border shadow-sm ${winnerA ? 'border-[#4A7FA5]/40' : 'border-[#7A5FA5]/40'}`}>
        <div className="text-xs uppercase tracking-widest font-semibold text-text-secondary mb-1">Winner</div>
        <div className="text-2xl font-bold text-text-primary">
          Version {winnerA ? 'A' : 'B'} wins
          {diff > 0 && <span className="text-sm font-normal text-text-secondary ml-2">by {diff} points</span>}
        </div>
        <p className="text-text-secondary text-sm mt-2">{winnerA ? resultA.summary : resultB.summary}</p>
      </div>

      {/* Side by side scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: 'rgba(74,127,165,0.3)' }}>
          <div className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#4A7FA5' }}>Version A</div>
          <div className="text-4xl font-bold text-text-primary">{resultA.engagement_score}</div>
          <div className="text-text-secondary text-xs">Brain Engagement</div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm" style={{ borderColor: 'rgba(122,95,165,0.3)' }}>
          <div className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#7A5FA5' }}>Version B</div>
          <div className="text-4xl font-bold text-text-primary">{resultB.engagement_score}</div>
          <div className="text-text-secondary text-xs">Brain Engagement</div>
        </div>
      </div>

      {/* Network comparison */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Network Comparison</p>
        <div className="space-y-3">
          {resultA.networks.map((netA) => {
            const netB = resultB.networks.find((n) => n.name === netA.name);
            if (!netB) return null;
            return (
              <div key={netA.name}>
                <div className="text-text-secondary text-xs mb-1.5 font-medium">{netA.name}</div>
                <div className="space-y-1">
                  <ScoreBar score={netA.score} color="#4A7FA5" />
                  <ScoreBar score={netB.score} color="#7A5FA5" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A7FA5' }} /> Version A
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7A5FA5' }} /> Version B
          </div>
        </div>
      </div>
    </div>
  );
}
