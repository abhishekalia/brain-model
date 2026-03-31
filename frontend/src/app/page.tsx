'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import InputPanel from '@/components/InputPanel';
import ResultsPanel from '@/components/ResultsPanel';
import ABComparison from '@/components/ABComparison';
import ABResults from '@/components/ABResults';
import { analyzeContent } from '@/lib/api';
import { AnalyzeResponse } from '@/types';

const BrainViewer = dynamic(() => import('@/components/BrainViewer'), { ssr: false });

function AppTool() {
  const [tab, setTab] = useState<'single' | 'ab'>('single');
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [abResults, setAbResults] = useState<{ a: AnalyzeResponse; b: AnalyzeResponse } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (inputType: 'youtube' | 'text', content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeContent({ input_type: inputType, content });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            Brain <span className="text-accent">Trigger</span>
          </h1>
          <p className="text-text-secondary text-xl mb-6">
            Know which emotions your content triggers — before you spend a dollar on ads
          </p>
          <div className="inline-flex bg-cream-dark border border-border rounded-xl p-1">
            <button
              onClick={() => setTab('single')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'single' ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Single Analysis
            </button>
            <button
              onClick={() => setTab('ab')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'ab' ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              A/B Compare
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center text-sm">
            {error}
          </div>
        )}

        {tab === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-1">
              <BrainViewer regions={results?.regions ?? []} />
            </div>
            <div className="lg:col-span-1">
              <ResultsPanel results={results} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ABComparison
                onResults={(a, b) => setAbResults({ a, b })}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
            <div className="lg:col-span-1">
              <BrainViewer regions={abResults?.a.regions ?? []} label="Version A" />
            </div>
            <div className="lg:col-span-1">
              {abResults ? (
                <ABResults resultA={abResults.a} resultB={abResults.b} />
              ) : (
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex items-center justify-center h-64">
                  <p className="text-text-secondary text-center text-sm">A/B results will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to join');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="text-text-primary font-bold text-lg tracking-tight">
          Brain <span className="text-accent">Trigger</span>
        </div>
        <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full font-medium">
          Coming Soon
        </span>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block text-xs text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase font-medium">
            Neuroscience-Powered Marketing
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
            Know which emotions<br />
            <span className="text-accent">your content triggers</span>
          </h1>

          <p className="text-text-secondary text-lg mb-3 leading-relaxed max-w-xl mx-auto">
            Brain Trigger analyzes your videos and ad copy to show exactly which brain regions activate — and what that means for clicks, conversions, and recall.
          </p>

          <p className="text-text-secondary/60 text-sm mb-10">
            Used by performance marketers and creators to A/B test content before launch.
          </p>

          {status === 'success' ? (
            <div className="bg-white border border-border rounded-2xl px-8 py-6 max-w-sm mx-auto shadow-sm">
              <p className="text-text-primary font-semibold text-base">You're on the list.</p>
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
                className="flex-1 bg-white border border-border rounded-xl px-5 py-3.5 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent/40 text-sm shadow-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-text-primary hover:bg-text-primary/80 disabled:bg-border text-white font-medium px-7 py-3.5 rounded-xl transition-all text-sm whitespace-nowrap"
              >
                {status === 'loading' ? 'Joining...' : 'Get Early Access'}
              </button>
            </form>
          )}

          {errorMsg && <p className="text-red-600 text-sm mt-3">{errorMsg}</p>}
          <p className="text-text-secondary/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full">
          {[
            { title: 'Predict Ad Performance', desc: 'See emotional triggers before launch — not after wasting budget.' },
            { title: 'Real Neuroscience', desc: 'Powered by TRIBE v2 research and Claude AI for accurate brain mapping.' },
            { title: 'A/B Test Content', desc: 'Compare two versions of your script or video to pick the stronger one.' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-border rounded-2xl p-6 text-left shadow-sm">
              <div className="text-text-primary font-semibold text-sm mb-2">{f.title}</div>
              <div className="text-text-secondary text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-text-secondary/40 text-xs py-8 border-t border-border">
        © 2026 Brain Trigger. All rights reserved.
      </footer>
    </main>
  );
}

function HomeInner() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  if (isPreview) return <AppTool />;
  return <WaitlistPage />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
