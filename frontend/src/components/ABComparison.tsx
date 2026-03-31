'use client';
import { useState } from 'react';
import { AnalyzeResponse } from '@/types';
import { analyzeContent } from '@/lib/api';

interface ABComparisonProps {
  onResults: (a: AnalyzeResponse, b: AnalyzeResponse) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export default function ABComparison({ onResults, isLoading, setIsLoading }: ABComparisonProps) {
  const [contentA, setContentA] = useState('');
  const [contentB, setContentB] = useState('');
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!contentA.trim() || !contentB.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const [a, b] = await Promise.all([
        analyzeContent({ input_type: 'text', content: contentA }),
        analyzeContent({ input_type: 'text', content: contentB }),
      ]);
      onResults(a, b);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">A/B Compare</p>
      <p className="text-text-secondary text-sm mb-5">Paste two versions of your content to find the winner</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: '#4A7FA5' }}>Version A</label>
          <textarea
            value={contentA}
            onChange={(e) => setContentA(e.target.value)}
            placeholder="Paste your first script, headline, or ad copy..."
            rows={4}
            className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 resize-none text-sm transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: '#7A5FA5' }}>Version B</label>
          <textarea
            value={contentB}
            onChange={(e) => setContentB(e.target.value)}
            placeholder="Paste your second version here..."
            rows={4}
            className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 resize-none text-sm transition-colors"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

      <button
        onClick={handleCompare}
        disabled={isLoading || !contentA.trim() || !contentB.trim()}
        className="mt-4 w-full bg-text-primary hover:bg-text-primary/80 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all text-sm"
      >
        {isLoading ? 'Analyzing both versions...' : 'Compare Brain Activation'}
      </button>
    </div>
  );
}
