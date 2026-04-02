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
      setVideoProgress('Uploading video...');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-5">Analyze Content</p>

      <div className="flex gap-1 mb-5 bg-cream-dark rounded-xl p-1">
        {(['youtube', 'text', 'video'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'youtube' ? 'YouTube URL' : tab === 'text' ? 'Paste Text' : 'Upload Video'}
          </button>
        ))}
      </div>

      {activeTab === 'youtube' && (
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 text-sm transition-colors"
        />
      )}

      {activeTab === 'text' && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your script, ad copy, or content here..."
          rows={6}
          className="w-full bg-cream-dark border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 text-sm resize-none transition-colors"
        />
      )}

      {activeTab === 'video' && (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-cream-dark border-2 border-dashed border-border rounded-xl px-4 py-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/40 transition-colors"
          >
            <svg className="w-8 h-8 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            {videoFile ? (
              <p className="text-text-primary text-sm font-medium">{videoFile.name}</p>
            ) : (
              <>
                <p className="text-text-secondary text-sm">Click to upload your ad or video</p>
                <p className="text-text-secondary/50 text-xs">MP4, MOV, AVI — max 500MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.avi,.mkv,.webm"
            onChange={handleFileChange}
            className="hidden"
          />
          {videoFile && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {(videoFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <span className="text-xs text-indigo-500 font-medium">Powered by TRIBE v2 fMRI</span>
            </div>
          )}
          {videoError && (
            <p className="mt-2 text-red-600 text-xs">{videoError}</p>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || (activeTab === 'video' && !videoFile)}
        className="mt-4 w-full bg-text-primary hover:bg-text-primary/80 disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all text-sm"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {activeTab === 'video' ? 'Running TRIBE v2 Analysis...' : 'Analyzing...'}
          </span>
        ) : activeTab === 'video' && isLoading && videoProgress ? videoProgress : 'Analyze Brain Triggers'}
      </button>
    </div>
  );
}
