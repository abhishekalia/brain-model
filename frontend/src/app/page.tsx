'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { analyzeVideoFile } from '@/lib/api';
import { AnalyzeResponse } from '@/types';
import ResultsPanel from '@/components/ResultsPanel';

const BrainViewer = dynamic(() => import('@/components/BrainViewer'), { ssr: false });

const COLOR = '#7C3AED';
const GLOW = '0 0 20px rgba(124,58,237,0.4)';

// ── File picker + brain + results (no analyze button) ─────────────────────────
function VideoPanel({
  side, file, onFile, results, isLoading, progress, error,
}: {
  side: 'A' | 'B';
  file: File | null;
  onFile: (f: File) => void;
  results: AnalyzeResponse | null;
  isLoading: boolean;
  progress: string | null;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Brain viewer */}
      <div className="relative" style={{ height: '55%' }}>
        <div
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display"
          style={{ backgroundColor: COLOR, boxShadow: GLOW }}
        >
          {side}
        </div>
        {isLoading && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
            <span className="font-display text-xs px-4 py-1.5 rounded-full border"
              style={{ color: COLOR, borderColor: `${COLOR}44`, background: 'rgba(124,58,237,0.1)', letterSpacing: '0.15em' }}>
              {progress ?? 'ANALYZING...'}
            </span>
          </div>
        )}
        <BrainViewer regions={results?.regions ?? []} />
      </div>

      {/* Upload + Results */}
      <div className="flex flex-col border-t" style={{ height: '45%', borderColor: `${COLOR}33` }}>
        {/* File picker row */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border"
            style={{ background: file ? 'rgba(124,58,237,0.12)' : '#0C0C0C', borderColor: file ? COLOR : '#1F1F1F' }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: file ? COLOR : '#6B6B8A' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="truncate font-display" style={{ color: file ? '#E0D7FF' : '#6B6B8A', fontSize: 11 }}>
              {file ? file.name : `DROP VIDEO ${side} HERE`}
            </span>
            {file && (
              <span className="text-xs ml-auto shrink-0" style={{ color: '#6B6B8A' }}>
                {(file.size / 1024 / 1024).toFixed(1)}MB
              </span>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".mp4,.mov,.avi,.mkv,.webm" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>

        {error && (
          <div className="mx-4 mt-2 shrink-0 p-2 rounded-lg text-xs text-red-400 border border-red-900/40 bg-red-900/10">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ResultsPanel results={results} />
        </div>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
function AppTool() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [resultsA, setResultsA] = useState<AnalyzeResponse | null>(null);
  const [resultsB, setResultsB] = useState<AnalyzeResponse | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [progressA, setProgressA] = useState<string | null>(null);
  const [progressB, setProgressB] = useState<string | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const isRunning = loadingA || loadingB;
  const canAnalyze = (fileA || fileB) && !isRunning;

  const handleAnalyzeBoth = async () => {
    if (!canAnalyze) return;

    // Run A first, then B (sequential to avoid Modal 429)
    if (fileA) {
      setLoadingA(true); setErrorA(null); setProgressA('Uploading...');
      try {
        const r = await analyzeVideoFile(fileA, (msg) => setProgressA(msg));
        setResultsA(r); setProgressA(null);
      } catch (err) {
        setErrorA(err instanceof Error ? err.message : 'Analysis failed');
        setProgressA(null);
      } finally { setLoadingA(false); }
    }

    if (fileB) {
      setLoadingB(true); setErrorB(null); setProgressB('Uploading...');
      try {
        const r = await analyzeVideoFile(fileB, (msg) => setProgressB(msg));
        setResultsB(r); setProgressB(null);
      } catch (err) {
        setErrorB(err instanceof Error ? err.message : 'Analysis failed');
        setProgressB(null);
      } finally { setLoadingB(false); }
    }
  };

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="shrink-0 px-6 py-3 border-b border-border flex items-center justify-between gap-4">
        <div className="font-display font-bold text-base tracking-widest shrink-0" style={{ color: '#E0D7FF' }}>
          BRAIN <span style={{ color: COLOR }}>TRIGGER</span>
        </div>

        <div className="font-display text-xs font-bold tracking-widest" style={{ color: COLOR, letterSpacing: '0.25em' }}>
          A/B NEURAL ANALYSIS
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="font-display text-xs font-bold tracking-widest" style={{ color: '#4B3B8A', letterSpacing: '0.2em' }}>
            POWERED BY TRIBE V2 fMRI
          </div>
          <button
            onClick={handleAnalyzeBoth}
            disabled={!canAnalyze}
            className="font-display font-bold text-xs px-6 py-2.5 rounded-xl tracking-widest transition-all"
            style={{
              background: canAnalyze ? COLOR : '#141414',
              color: canAnalyze ? '#fff' : '#6B6B8A',
              boxShadow: canAnalyze ? GLOW : 'none',
              letterSpacing: '0.15em',
              cursor: canAnalyze ? 'pointer' : 'not-allowed',
              minWidth: 160,
            }}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {loadingA ? 'ANALYZING A...' : 'ANALYZING B...'}
              </span>
            ) : 'ANALYZE BOTH'}
          </button>
        </div>
      </nav>

      {/* Panels */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 border-r" style={{ borderColor: `${COLOR}22` }}>
          <VideoPanel side="A" file={fileA} onFile={(f) => { setFileA(f); setResultsA(null); setErrorA(null); }}
            results={resultsA} isLoading={loadingA} progress={progressA} error={errorA} />
        </div>

        <div className="w-8 shrink-0 flex flex-col items-center justify-center bg-surface"
          style={{ borderLeft: '1px solid #1F1F1F', borderRight: '1px solid #1F1F1F' }}>
          <span className="font-display font-bold text-xs"
            style={{ writingMode: 'vertical-rl', color: '#3B3B5A', letterSpacing: '0.4em' }}>VS</span>
        </div>

        <div className="flex-1 min-w-0">
          <VideoPanel side="B" file={fileB} onFile={(f) => { setFileB(f); setResultsB(null); setErrorB(null); }}
            results={resultsB} isLoading={loadingB} progress={progressB} error={errorB} />
        </div>
      </div>
    </div>
  );
}

// ── Waitlist ──────────────────────────────────────────────────────────────────
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
          BRAIN <span style={{ color: COLOR }}>TRIGGER</span>
        </div>
        <span className="font-display text-xs px-3 py-1 rounded-full border"
          style={{ color: COLOR, borderColor: `${COLOR}44`, background: 'rgba(124,58,237,0.1)', letterSpacing: '0.15em' }}>
          COMING SOON
        </span>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: '#E0D7FF', letterSpacing: '0.05em' }}>
            KNOW WHICH EMOTIONS<br /><span style={{ color: COLOR }}>YOUR CONTENT TRIGGERS</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Upload two videos. Get real fMRI brain activation scores. See which one wins.
          </p>
          {status === 'success' ? (
            <div className="bg-surface border border-border rounded-2xl px-8 py-6 max-w-sm mx-auto">
              <p className="font-display text-text-primary font-semibold text-sm">YOU'RE ON THE LIST.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto w-full">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" required
                className="flex-1 bg-surface border border-border rounded-xl px-5 py-3.5 text-text-primary placeholder-text-secondary text-sm focus:outline-none" />
              <button type="submit" disabled={status === 'loading'}
                className="font-display text-white font-bold px-7 py-3.5 rounded-xl text-xs tracking-widest"
                style={{ background: COLOR, boxShadow: GLOW }}>
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
