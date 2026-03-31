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
    <div className="bg-navy-light rounded-2xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-1">A/B Compare</h2>
      <p className="text-gray-500 text-sm mb-5">Paste two versions of your content to find the winner</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 block">Version A</label>
          <textarea
            value={contentA}
            onChange={(e) => setContentA(e.target.value)}
            placeholder="Paste your first script, headline, or ad copy..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 block">Version B</label>
          <textarea
            value={contentB}
            onChange={(e) => setContentB(e.target.value)}
            placeholder="Paste your second version here..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none text-sm"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <button
        onClick={handleCompare}
        disabled={isLoading || !contentA.trim() || !contentB.trim()}
        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
      >
        {isLoading ? 'Analyzing both versions...' : 'Compare Brain Activation →'}
      </button>
    </div>
  );
}
