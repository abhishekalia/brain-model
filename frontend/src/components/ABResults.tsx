'use client';
import { AnalyzeResponse } from '@/types';

interface ABResultsProps {
  resultA: AnalyzeResponse;
  resultB: AnalyzeResponse;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-white text-xs font-bold w-8 text-right">{score}</span>
    </div>
  );
}

export default function ABResults({ resultA, resultB }: ABResultsProps) {
  const winnerA = resultA.engagement_score >= resultB.engagement_score;
  const diff = Math.abs(resultA.engagement_score - resultB.engagement_score);

  return (
    <div className="space-y-4">
      {/* Winner banner */}
      <div className={`rounded-2xl p-5 border ${winnerA ? 'bg-blue-900/20 border-blue-700' : 'bg-purple-900/20 border-purple-700'}`}>
        <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Winner</div>
        <div className="text-2xl font-bold text-white">
          Version {winnerA ? 'A' : 'B'} wins
          {diff > 0 && <span className="text-sm font-normal text-gray-400 ml-2">by {diff} points</span>}
        </div>
        <p className="text-gray-400 text-sm mt-2">{winnerA ? resultA.summary : resultB.summary}</p>
      </div>

      {/* Side by side scores */}
      <div className="grid grid-cols-2 gap-3">
        {/* Engagement scores */}
        <div className="bg-gray-900 rounded-xl p-4 border border-blue-800/40">
          <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Version A</div>
          <div className="text-4xl font-bold text-white">{resultA.engagement_score}</div>
          <div className="text-gray-500 text-xs">Brain Engagement</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-purple-800/40">
          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Version B</div>
          <div className="text-4xl font-bold text-white">{resultB.engagement_score}</div>
          <div className="text-gray-500 text-xs">Brain Engagement</div>
        </div>
      </div>

      {/* Network comparison */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-4">Network Comparison</h3>
        <div className="space-y-3">
          {resultA.networks.map((netA) => {
            const netB = resultB.networks.find((n) => n.name === netA.name);
            if (!netB) return null;
            return (
              <div key={netA.name}>
                <div className="text-gray-400 text-xs mb-1.5">{netA.name}</div>
                <div className="space-y-1">
                  <ScoreBar score={netA.score} color="#3b82f6" />
                  <ScoreBar score={netB.score} color="#a855f7" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Version A
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-purple-500" /> Version B
          </div>
        </div>
      </div>
    </div>
  );
}
