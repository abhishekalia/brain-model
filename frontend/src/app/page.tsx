'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { analyzeVideoFile } from '@/lib/api';
import { AnalyzeResponse } from '@/types';
import ResultsPanel from '@/components/ResultsPanel';

const BrainViewer = dynamic(() => import('@/components/BrainViewer'), { ssr: false });

function VideoPanel({ side }: { side: 'A' | 'B' }) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setProgress('Uploading...');
    try {
      const result = await analyzeVideoFile(file, (msg) => setProgress(msg));
      setResults(result);
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const color = '#7C3AED';
  const colorDim = 'rgba(124,58,237,0.15)';
  const glowShadow = '0 0 20px rgba(124,58,237,0.4)';

  return (
    <div className="flex flex-col h-full">

      {/* ── Brain viewer (top 55%) ────────────────────────────── */}
      <div className="relative" style={{ height: '55%' }}>
        {/* Side badge */}
        <div
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display"
          style={{ backgroundColor: color, boxShadow: glowShadow }}
        >
          {side}
        </div>
        <BrainViewer regions={results?.regions ?? []} />
      </div>

      {/* ── Upload + Results (bottom 45%) ─────────────────────── */}
      <div
        className="flex flex-col border-t"
        style={{ height: '45%', borderColor: `${color}33` }}
      >
        {/* Upload bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border"
            style={{
              background: file ? colorDim : '#0C0C0C',
              borderColor: file ? color : '#1F1F1F',
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: file ? color : '#6B6B8A' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm truncate font-display" style={{ color: file ? '#E0D7FF' : '#6B6B8A', fontSize: 11 }}>
              {file ? file.name : `DROP VIDEO ${side} HERE`}
            </span>
            {file && (
              <span className="text-xs ml-auto shrink-0" style={{ color: '#6B6B8A' }}>
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.avi,.mkv,.webm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setFile(f); setResults(null); setError(null); }
            }}
          />

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="shrink-0 font-display rounded-xl px-5 py-3 text-xs font-bold tracking-wider transition-all"
            style={{
              background: file && !isLoading ? color : '#141414',
              color: file && !isLoading ? '#fff' : '#6B6B8A',
              boxShadow: file && !isLoading ? glowShadow : 'none',
              letterSpacing: '0.1em',
              cursor: file && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {progress?.split(' ')[0] ?? 'RUNNING'}
              </span>
            ) : 'ANALYZE'}
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 shrink-0 p-2 rounded-lg text-xs text-red-400 border border-red-900/40 bg-red-900/10">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ResultsPanel results={results} />
        </div>
      </div>
    </div>
  );
}

function AppTool() {
  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden font-sans">
      {/* Nav */}
      <nav className="shrink-0 px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="font-display font-bold text-base tracking-widest" style={{ color: '#E0D7FF' }}>
          BRAIN <span style={{ color: '#7C3AED' }}>TRIGGER</span>
        </div>
        <div className="font-display text-xs font-bold tracking-widest" style={{ color: '#7C3AED', letterSpacing: '0.25em' }}>
          A/B NEURAL ANALYSIS
        </div>
        <div className="font-display text-xs font-bold tracking-widest" style={{ color: '#4B3B8A', letterSpacing: '0.2em' }}>
          POWERED BY TRIBE V2 fMRI
        </div>
      </nav>

      {/* Panels */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 border-r" style={{ borderColor: '#7C3AED22' }}>
          <VideoPanel side="A" />
        </div>

        {/* VS divider */}
        <div className="w-8 shrink-0 flex flex-col items-center justify-center bg-surface"
          style={{ borderLeft: '1px solid #1F1F1F', borderRight: '1px solid #1F1F1F' }}>
          <span className="font-display font-bold text-xs"
            style={{ writingMode: 'vertical-rl', color: '#3B3B5A', letterSpacing: '0.4em' }}>VS</span>
        </div>

        <div className="flex-1 min-w-0" style={{ borderLeft: '1px solid #1F1F1F' }}>
          <VideoPanel side="B" />
        </div>
      </div>
    </div>
  );
}

function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/waitlist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success'); setEmail('');
    } catch { setStatus('error'); }
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="font-display font-bold text-base tracking-widest" style={{ color: '#E0D7FF' }}>
          BRAIN <span style={{ color: '#7C3AED' }}>TRIGGER</span>
        </div>
        <span className="font-display text-xs px-3 py-1 rounded-full border"
          style={{ color: '#7C3AED', borderColor: '#7C3AED44', background: 'rgba(124,58,237,0.1)', letterSpacing: '0.15em' }}>
          COMING SOON
        </span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight"
            style={{ color: '#E0D7FF', letterSpacing: '0.05em' }}>
            KNOW WHICH EMOTIONS<br />
            <span style={{ color: '#7C3AED' }}>YOUR CONTENT TRIGGERS</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Upload two videos. Get real fMRI brain activation scores. See which one wins.
          </p>
          {status === 'success' ? (
            <div className="bg-surface border border-border rounded-2xl px-8 py-6 max-w-sm mx-auto">
              <p className="font-display text-text-primary font-semibold text-sm">YOU'RE ON THE LIST.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto w-full">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required
                className="flex-1 bg-surface border border-border rounded-xl px-5 py-3.5 text-text-primary placeholder-text-secondary text-sm focus:outline-none"
                style={{ focusBorderColor: '#7C3AED' } as React.CSSProperties} />
              <button type="submit" disabled={status === 'loading'}
                className="font-display text-white font-bold px-7 py-3.5 rounded-xl text-xs tracking-widest"
                style={{ background: '#7C3AED', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
                GET ACCESS
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();
  if (searchParams.get('preview') === 'true') return <AppTool />;
  return <WaitlistPage />;
}

export default function Home() {
  return <Suspense fallback={null}><HomeInner /></Suspense>;
}
