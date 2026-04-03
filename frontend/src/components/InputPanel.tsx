'use client';
import { useState, useRef } from 'react';
import { analyzeVideoFile } from '@/lib/api';
import { AnalyzeResponse } from '@/types';

interface InputPanelProps {
  onAnalyze: (inputType: 'youtube' | 'text', content: string) => void;
  onVideoResult: (result: AnalyzeResponse) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export default function InputPanel({ onAnalyze, onVideoResult, isLoading, setIsLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'text' | 'video'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (activeTab === 'video') {
      if (!videoFile) return;
      setIsLoading(true);
      setVideoError(null);
      setVideoProgress('Uploading...');
      try {
        const result = await analyzeVideoFile(videoFile, (msg) => setVideoProgress(msg));
        onVideoResult(result);
        setVideoProgress(null);
      } catch (err) {
        setVideoError(err instanceof Error ? err.message : 'Video analysis failed');
        setVideoProgress(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    const content = activeTab === 'youtube' ? youtubeUrl : textContent;
    if (!content.trim()) return;
    onAnalyze(activeTab, content);
  };

  const tabs = [
    { id: 'youtube' as const, label: 'YouTube' },
    { id: 'text' as const, label: 'Text' },
    { id: 'video' as const, label: 'Upload Video' },
  ];

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'youtube' && (
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent/50 transition-colors"
        />
      )}

      {activeTab === 'text' && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your script, ad copy, or content here..."
          rows={5}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent/50 resize-none transition-colors"
        />
      )}

      {activeTab === 'video' && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-surface border border-border border-dashed rounded-xl px-4 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-accent/40 transition-colors"
          >
            <svg className="w-7 h-7 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            {videoFile ? (
              <p className="text-text-primary text-sm font-medium">{videoFile.name}</p>
            ) : (
              <>
                <p className="text-text-secondary text-sm">Click to upload video</p>
                <p className="text-text-secondary/50 text-xs">MP4, MOV, AVI — max 200MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".mp4,.mov,.avi,.mkv,.webm" onChange={(e) => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} className="hidden" />
          {videoFile && (
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-text-secondary">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
              <span className="text-xs text-accent font-medium">TRIBE v2 fMRI</span>
            </div>
          )}
          {videoError && <p className="mt-2 text-red-400 text-xs">{videoError}</p>}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || (activeTab === 'video' && !videoFile)}
        className="w-full bg-accent hover:bg-accent/90 disabled:bg-surface disabled:text-text-secondary disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
        style={{ boxShadow: isLoading ? 'none' : '0 0 20px rgba(255,101,0,0.3)' }}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {videoProgress || 'Analyzing...'}
          </span>
        ) : 'Analyze'}
      </button>
    </div>
  );
}
