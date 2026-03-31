'use client';
import { AnalyzeResponse } from '@/types';
import Recommendations from './Recommendations';

interface ResultsPanelProps {
  results: AnalyzeResponse | null;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#C4453A' : score >= 50 ? '#E8A87C' : '#A8C5DA';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-cream-dark rounded-full h-1">
        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-text-primary text-xs font-medium w-6 text-right">{score}</span>
    </div>
  );
}

export default function ResultsPanel({ results }: ResultsPanelProps) {
  if (!results) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-text-secondary text-sm text-center">Analyze content to see<br />brain activation results</p>
      </div>
    );
  }

  const getStrength = (s: number) => s >= 75 ? 'Strong' : s >= 50 ? 'Moderate' : 'Low';
  const getEmotionStyle = (s: number) => s >= 75
    ? 'bg-red-50 text-red-700 border-red-200'
    : s >= 50
    ? 'bg-orange-50 text-orange-700 border-orange-200'
    : 'bg-blue-50 text-blue-600 border-blue-200';

  return (
    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
      {/* Content summary */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">About This Content</p>
        <p className="text-text-primary text-sm leading-relaxed">{results.content_summary}</p>
      </div>

      {/* Score */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-text-primary font-semibold text-sm">Brain Engagement Score</p>
          <p className="text-text-secondary text-xs mt-0.5">Overall neurological impact</p>
        </div>
        <div className="text-right">
          <span className="text-5xl font-bold text-text-primary">{results.engagement_score}</span>
          <span className="text-text-secondary text-xs ml-1">/100</span>
        </div>
      </div>

      {/* What works / doesn't */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-4 h-4 rounded-full bg-[#2A5C45]/15 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-[#2A5C45]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[#2A5C45] text-xs font-semibold">What Works</span>
          </div>
          <ul className="space-y-2">
            {results.what_works.map((item, i) => (
              <li key={i} className="text-xs text-text-secondary leading-relaxed flex gap-1.5">
                <span className="text-[#2A5C45] shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-4 h-4 rounded-full bg-[#8B2E2E]/15 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-[#8B2E2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-[#8B2E2E] text-xs font-semibold">Needs Work</span>
          </div>
          <ul className="space-y-2">
            {results.what_doesnt_work.map((item, i) => (
              <li key={i} className="text-xs text-text-secondary leading-relaxed flex gap-1.5">
                <span className="text-[#8B2E2E] shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Brain regions */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Brain Regions</p>
        <div className="space-y-5">
          {results.regions.map((region) => (
            <div key={region.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-primary text-xs font-semibold">{region.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getEmotionStyle(region.score)}`}>
                    {region.emotion}
                  </span>
                </div>
                <span className="text-text-secondary text-xs">{getStrength(region.score)}</span>
              </div>
              <ScoreBar score={region.score} />
              <p className="text-text-secondary text-xs mt-1.5 leading-relaxed">{region.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Networks */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Brain Networks</p>
        <div className="space-y-3">
          {results.networks.map((network) => (
            <div key={network.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary font-medium">{network.name}</span>
                <span className="text-text-primary font-semibold">{network.score}%</span>
              </div>
              <ScoreBar score={network.score} />
            </div>
          ))}
        </div>
      </div>

      <Recommendations recommendations={results.recommendations} />
    </div>
  );
}
