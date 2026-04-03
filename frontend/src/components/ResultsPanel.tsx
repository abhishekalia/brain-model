'use client';
import { AnalyzeResponse } from '@/types';
import Recommendations from './Recommendations';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#FF6500' : score >= 50 ? 'rgba(255,101,0,0.6)' : '#2a2a2a';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-surface rounded-full h-1">
        <div
          className="h-1 rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            backgroundColor: color,
            boxShadow: score >= 50 ? `0 0 6px ${color}` : 'none',
          }}
        />
      </div>
      <span className="text-text-primary text-xs font-medium w-6 text-right">{score}</span>
    </div>
  );
}

export default function ResultsPanel({ results }: { results: AnalyzeResponse | null }) {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-text-secondary text-sm text-center">Analyze content to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto pr-1">
      {/* About + Score row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 col-span-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">About This Content</p>
          <p className="text-text-primary text-sm leading-relaxed">{results.content_summary}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between col-span-2">
          <div>
            <p className="text-text-primary font-semibold text-sm">Brain Engagement</p>
            <p className="text-text-secondary text-xs mt-0.5">Overall neurological impact</p>
          </div>
          <div className="text-right">
            <span className="text-5xl font-bold text-accent">{results.engagement_score}</span>
            <span className="text-text-secondary text-xs ml-1">/100</span>
          </div>
        </div>
      </div>

      {/* What works / needs work */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-400 text-xs font-semibold">What Works</span>
          </div>
          <ul className="space-y-2">
            {results.what_works.map((item, i) => (
              <li key={i} className="text-xs text-text-secondary leading-relaxed flex gap-1.5">
                <span className="text-green-500 shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-red-400 text-xs font-semibold">Needs Work</span>
          </div>
          <ul className="space-y-2">
            {results.what_doesnt_work.map((item, i) => (
              <li key={i} className="text-xs text-text-secondary leading-relaxed flex gap-1.5">
                <span className="text-red-500 shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Brain regions */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Brain Regions</p>
          {results.regions.some(r => r.source === 'tribe_v2') && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-dim text-accent border border-accent/20 font-medium">
              TRIBE v2 fMRI
            </span>
          )}
        </div>
        <div className="space-y-4">
          {results.regions.map((region) => (
            <div key={region.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary text-xs font-semibold">{region.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-text-secondary border border-border">{region.emotion}</span>
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: region.score >= 50 ? '#FF6500' : '#555' }}
                >
                  {region.score >= 75 ? 'High' : region.score >= 50 ? 'Medium' : 'Low'}
                </span>
              </div>
              <ScoreBar score={region.score} />
              <p className="text-text-secondary text-xs mt-1.5 leading-relaxed">{region.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <Recommendations recommendations={results.recommendations} />
    </div>
  );
}
