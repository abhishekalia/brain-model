'use client';
import { useState, Suspense } from 'react';
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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-4 flex items-center justify-between border-b border-border">
        <div className="text-text-primary font-bold text-lg tracking-tight">
          Brain <span className="text-accent">Trigger</span>
        </div>
        <div className="flex bg-surface border border-border rounded-xl p-0.5">
          {(['single', 'ab'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'single' ? 'Single' : 'A/B Compare'}
            </button>
          ))}
        </div>
        <div className="w-32" />
      </nav>

      {tab === 'single' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Brain */}
          <div className="w-1/2 border-r border-border flex flex-col">
            <div className="flex-1">
              <BrainViewer regions={results?.regions ?? []} />
            </div>
            <div className="px-8 pb-5 pt-3 border-t border-border">
              <p className="text-xs text-text-secondary/40 uppercase tracking-widest">Hover regions to explore</p>
            </div>
          </div>

          {/* RIGHT: Input + Results */}
          <div className="w-1/2 flex flex-col overflow-y-auto">
            <div className="p-8 border-b border-border">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-1">
                Brain <span className="text-accent">Trigger</span>
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Predict how your content activates the brain — before you spend on ads
              </p>
              <InputPanel
                onAnalyze={handleAnalyze}
                onVideoResult={(r) => setResults(r)}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="p-8">
              <ResultsPanel results={results} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Two brains */}
          <div className="w-1/2 border-r border-border grid grid-rows-2">
            <div className="border-b border-border">
              <BrainViewer regions={abResults?.a.regions ?? []} label="A" />
            </div>
            <div>
              <BrainViewer regions={abResults?.b.regions ?? []} label="B" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-1/2 flex flex-col overflow-y-auto">
            <div className="p-8 border-b border-border">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-1">
                A/B <span className="text-accent">Compare</span>
              </h1>
              <p className="text-text-secondary text-sm mb-6">Compare two pieces of content to find the winner</p>
              <ABComparison
                onResults={(a, b) => setAbResults({ a, b })}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
            <div className="p-8">
              {abResults ? (
                <ABResults resultA={abResults.a} resultB={abResults.b} />
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-text-secondary/40 text-sm">Results will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
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
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <nav className="px-8 py-5 flex items-center justify-between border-b border-border">
        <div className="text-text-primary font-bold text-lg tracking-tight">
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
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight tracking-tight">
            Know which emotions<br />
            <span className="text-accent">your content triggers</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Brain Trigger analyzes your videos and ad copy using real fMRI neuroscience — showing exactly which brain regions activate and what that means for conversions.
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
                className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-sm whitespace-nowrap"
                style={{ boxShadow: '0 0 20px rgba(255,101,0,0.3)' }}
              >
                {status === 'loading' ? 'Joining...' : 'Get Early Access'}
              </button>
            </form>
          )}
          {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full">
          {[
            { title: 'Predict Ad Performance', desc: 'See emotional triggers before launch — not after wasting budget.' },
            { title: 'Real Neuroscience', desc: 'Powered by TRIBE v2 fMRI model and Claude AI for accurate brain mapping.' },
            { title: 'A/B Test Content', desc: 'Compare two videos or scripts side-by-side to pick the stronger one.' },
          ].map((f) => (
            <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 text-left">
              <div className="text-text-primary font-semibold text-sm mb-2">{f.title}</div>
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
