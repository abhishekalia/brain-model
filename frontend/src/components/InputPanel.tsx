'use client';
import { useState } from 'react';

interface InputPanelProps {
  onAnalyze: (inputType: 'youtube' | 'text', content: string) => void;
  isLoading: boolean;
}

export default function InputPanel({ onAnalyze, isLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'text'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');

  const handleSubmit = () => {
    const content = activeTab === 'youtube' ? youtubeUrl : textContent;
    if (!content.trim()) return;
    onAnalyze(activeTab, content);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-5">Analyze Content</p>

      <div className="flex gap-1 mb-5 bg-cream-dark rounded-xl p-1">
        {(['youtube', 'text'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'youtube' ? 'YouTube URL' : 'Paste Text'}
          </button>
        ))}
      </div>

      {activeTab === 'youtube' ? (
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 text-sm transition-colors"
        />
      ) : (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your script, ad copy, or content here..."
          rows={6}
          className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 text-sm resize-none transition-colors"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-4 w-full bg-text-primary hover:bg-text-primary/80 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all text-sm"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Analyzing...
          </span>
        ) : 'Analyze Brain Triggers'}
      </button>
    </div>
  );
}
