'use client';
import { AnalyzeResponse } from '@/types';

interface ResultsPanelProps {
  results: AnalyzeResponse | null;
}

function ScoreBar({ label, score, description }: { label: string; score: number; description: string }) {
  const getColor = (s: number) => s >= 80 ? 'from-orange-500 to-red-500' : s >= 60 ? 'from-yellow-500 to-orange-500' : 'from-blue-500 to-cyan-500';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-white font-bold">{score}%</span>
      </div>
      <div className="bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${getColor(score)} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">{description}</p>
    </div>
  );
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  if (!results) {
    return (
      <div className="bg-navy-light rounded-2xl p-6 border border-gray-800 flex items-center justify-center h-64">
        <p className="text-gray-500 text-center">Results will appear here after analysis</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-light rounded-2xl p-6 border border-gray-800 space-y-6">
      <div className="text-center">
        <div className="text-5xl font-bold text-white">{results.engagement_score}</div>
        <div className="text-gray-400 text-sm mt-1">Brain Engagement Score</div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <p className="text-gray-300 text-sm leading-relaxed">{results.summary}</p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Brain Networks</h3>
        {results.networks.map((network) => (
          <ScoreBar key={network.name} label={network.name} score={network.score} description={network.description} />
        ))}
      </div>

      <div>
        <h3 className="text-white font-semibold mb-3">Brain Regions</h3>
        {results.regions.map((region) => (
          <ScoreBar key={region.name} label={`${region.name} — ${region.marketing_label}`} score={region.score} description={region.description} />
        ))}
      </div>
    </div>
  );
}
