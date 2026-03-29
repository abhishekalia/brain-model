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
    <div className="bg-navy-light rounded-2xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white">Analyze Content</h2>

      <div className="flex gap-2 mb-4">
        {(['youtube', 'text'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
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
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      ) : (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your script, ad copy, or content here..."
          rows={6}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {isLoading ? 'Analyzing...' : 'Analyze Brain Triggers'}
      </button>
    </div>
  );
}
