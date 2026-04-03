'use client';
import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { analyzeVideoFile } from '@/lib/api';
import { AnalyzeResponse } from '@/types';
import ResultsPanel from '@/components/ResultsPanel';

const BrainViewer = dynamic(() => import('@/components/BrainViewer'), { ssr: false });

// ─── Single video panel (brain + upload + results) ───────────────────────────
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

  const borderColor = side === 'A' ? 'border-accent/30' : 'border-blue-500/30';
  const accentColor = side === 'A' ? '#FF6500' : '#3b82f6';
  const labelBg = side === 'A' ? 'bg-accent text-white' : 'bg-blue-500 text-white';

  return (
    <div className="flex flex-col h-full">
      {/* Brain viewer — top half */}
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: accentColor }}
        >
          {side}
        </div>
        <BrainViewer regions={results?.regions ?? []} />
      </div>

      {/* Upload + Results — bottom half */}
      <div className={`border-t ${borderColor} flex flex-col`} style={{ height: '52%' }}>
        {/* Upload row */}
        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 cursor-pointer hover:border-accent/40 transition-colors flex items-center gap-3"
          >
            <svg className="w-4 h-4 text-text-secondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <span className="text-sm truncate" style={{ color: file ? '#fff' : '#555' }}>
              {file ? file.name : 'Upload video'}
            </span>
            {file && (
              <span className="text-xs text-text-secondary shrink-0 ml-auto">
                {(file.size / 1024 / 1024).toFixed(1)} MB
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
          <button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: file && !isLoading ? accentColor : undefined,
              color: 'white',
              background: file && !isLoading ? accentColor : '#1a1a1a',
              boxShadow: file && !isLoading ? `0 0 16px ${accentColor}55` : 'none',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {progress ? progress.split(' ')[0] : 'Running'}
              </span>
            ) : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Results scroll area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ResultsPanel results={results} />
        </div>
      </div>
    </div>
  );
}

// ─── Main A/B app ─────────────────────────────────────────────────────────────
function AppTool() {
  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="shrink-0 px-8 py-4 border-b border-border flex items-center justify-between">
        <div className="font-display font-bold text-lg text-text-primary">
          Brain <span className="text-accent">Trigger</span>
        </div>
        <div className="text-xs text-text-secondary/40 uppercase tracking-widest">
          A/B Neural Analysis
        </div>
        <div className="w-32" />
      </nav>

      {/* Two panels side by side */}
      <div className="flex flex-1 min-h-0">
        {/* Video A */}
        <div className="flex-1 min-w-0 border-r border-border">
          <VideoPanel side="A" />
        </div>

        {/* Divider label */}
        <div className="flex flex-col items-center justify-center w-10 shrink-0 border-r border-border bg-surface">
          <span className="text-text-secondary/20 text-xs font-mono tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.3em' }}>
            VS
          </span>
        </div>

        {/* Video B */}
        <div className="flex-1 min-w-0">
          <VideoPanel side="B" />
        </div>
      </div>
    </div>
  );
}

// ─── Waitlist page ────────────────────────────────────────────────────────────
function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="font-display font-bold text-lg text-text-primary">
          Brain <span className="text-accent">Trigger</span>
        </div>
        <span className="text-xs text-accent bg-accent-dim border border-accent/20 px-3 py-1 rounded-full font-medium">
          Coming Soon
        </span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block text-xs text-accent bg-accent-dim border border-accent/20 px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase font-medium">
            Neuroscience-Powered Marketing
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Know which emotions<br />
            <span className="text-accent">your content triggers</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Upload two videos. Get real fMRI brain activation scores for each. See which one wins — region by region.
          </p>

          {status === 'success' ? (
            <div className="bg-surface border border-border rounded-2xl px-8 py-6 max-w-sm mx-auto">
              <p className="text-text-primary font-semibold">You're on the list.</p>
              <p className="text-text-secondary text-sm mt-1">We'll reach out when early access opens.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 bg-surface border border-border rounded-xl px-5 py-3.5 text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl text-sm whitespace-nowrap"
                style={{ boxShadow: '0 0 20px rgba(255,101,0,0.3)' }}
              >
                {status === 'loading' ? 'Joining...' : 'Get Early Access'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="text-red-400 text-sm mt-3">Something went wrong. Please try again.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full">
          {[
            { title: 'Upload Two Videos', desc: 'Drop in both versions of your ad or content.' },
            { title: 'Real fMRI Scores', desc: 'TRIBE v2 maps actual brain region activation for each video.' },
            { title: 'Find the Winner', desc: 'See which version triggers stronger emotional response, region by region.' },
          ].map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 text-left">
              <div className="font-display text-text-primary font-semibold text-sm mb-2">{f.title}</div>
              <div className="text-text-secondary text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-text-secondary/30 text-xs py-8 border-t border-border">
        © 2026 Brain Trigger. All rights reserved.
      </footer>
    </main>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function HomeInner() {
  const searchParams = useSearchParams();
  if (searchParams.get('preview') === 'true') return <AppTool />;
  return <WaitlistPage />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
