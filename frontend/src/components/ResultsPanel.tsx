'use client';
import { AnalyzeResponse } from '@/types';

interface ResultsPanelProps {
  results: AnalyzeResponse | null;
}

function ScoreBar({ score }: { score: number }) {
  const getColor = (s: number) =>
    s >= 75 ? 'from-orange-500 to-red-500' :
    s >= 50 ? 'from-yellow-500 to-orange-400' :
    'from-blue-600 to-cyan-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${getColor(score)} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-white text-xs font-bold w-7 text-right">{score}</span>
    </div>
  );
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  if (!results) {
    return (
      <div className="bg-navy-light rounded-2xl p-6 border border-gray-800 flex items-center justify-center h-64">
        <p className="text-gray-500 text-center text-sm">Results will appear here after analysis</p>
      </div>
    );
  }

  const getScoreLabel = (s: number) => s >= 75 ? 'Strong' : s >= 50 ? 'Moderate' : 'Weak';
  const getScoreBadgeColor = (s: number) =>
    s >= 75 ? 'bg-red-900/30 text-red-400 border-red-800' :
    s >= 50 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
    'bg-blue-900/30 text-blue-400 border-blue-800';

  return (
    <div className="space-y-4">
      {/* Content summary */}
      <div className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">About this content</div>
        <p className="text-gray-300 text-sm leading-relaxed">{results.content_summary}</p>
      </div>

      {/* Engagement score */}
      <div className="bg-navy-light border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-sm">Brain Engagement Score</div>
          <div className="text-gray-500 text-xs mt-0.5">Overall neurological impact</div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-white">{results.engagement_score}</div>
          <div className="text-xs text-gray-500">/100</div>
        </div>
      </div>

      {/* What works / What doesn't */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-green-900/10 border border-green-900/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-400 text-sm font-semibold">What Works</span>
          </div>
          <ul className="space-y-2">
            {results.what_works.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                <span className="text-green-500 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-900/10 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-red-400 text-sm font-semibold">What Doesn't Work</span>
          </div>
          <ul className="space-y-2">
            {results.what_doesnt_work.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                <span className="text-red-500 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Brain regions with emotion tags */}
      <div className="bg-navy-light border border-gray-800 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-4">Brain Regions & Emotions Triggered</h3>
        <div className="space-y-4">
          {results.regions.map((region) => (
            <div key={region.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-xs font-medium">{region.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getScoreBadgeColor(region.score)}`}>
                    {region.emotion}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{getScoreLabel(region.score)}</span>
              </div>
              <ScoreBar score={region.score} />
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{region.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Networks - compact */}
      <div className="bg-navy-light border border-gray-800 rounded-2xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Brain Networks</h3>
        <div className="space-y-2.5">
          {results.networks.map((network) => (
            <div key={network.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{network.name}</span>
                <span className="text-white font-medium">{network.score}%</span>
              </div>
              <ScoreBar score={network.score} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
