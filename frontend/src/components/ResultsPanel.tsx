'use client';
import { AnalyzeResponse, BrainRegion, Recommendation } from '@/types';

const COLOR = '#7C3AED';

function scoreLabel(score: number) {
  if (score >= 75) return { text: 'Strongly activated', dot: '#FFB300' };
  if (score >= 50) return { text: 'Moderately activated', dot: '#FF6500' };
  return { text: 'Mildly activated', dot: '#CC3300' };
}

// Map brain region names to plain-English "what caused this" labels
const CAUSE_HINTS: Record<string, string> = {
  "Amygdala": "emotional content or surprise moments in the video",
  "Auditory Cortex": "the audio — music, voice tone, or sound design",
  "Broca's Area": "spoken language, narration, or verbal storytelling",
  "FFA": "faces shown on screen",
  "PPA": "scenes, environments, or visual backgrounds",
  "TPJ": "social cues — characters interacting or a sense of perspective-taking",
  "Visual Cortex": "strong visual movement, colour contrast, or scene changes",
};

function RegionCard({ region, rec }: { region: BrainRegion; rec?: Recommendation }) {
  const { text: activation, dot } = scoreLabel(region.score);

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: '#0C0C0C', borderColor: '#1F1F1F' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
          <span className="text-text-primary text-sm font-semibold">{region.name}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(124,58,237,0.12)', color: COLOR, border: `1px solid ${COLOR}33` }}>
          {region.emotion}
        </span>
      </div>

      {/* 4 rows */}
      <div className="space-y-2 text-xs">
        <Row label="Triggered" value={activation} />
        <Row label="Emotion" value={region.marketing_label || region.emotion} />
        <Row
          label="Cause"
          value={CAUSE_HINTS[region.name] ?? region.description?.split('.')[0] ?? '—'}
        />
        <Row
          label="Improve"
          value={rec?.action ?? defaultImprove(region.name)}
          highlight
        />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 w-14 text-text-secondary">{label}</span>
      <span style={{ color: highlight ? '#E0D7FF' : '#9999B8' }} className="leading-snug">{value}</span>
    </div>
  );
}

function defaultImprove(name: string): string {
  const map: Record<string, string> = {
    "Amygdala": "Add a surprising hook or emotional moment in the first 3 seconds.",
    "Auditory Cortex": "Use background music or a confident voiceover to boost audio engagement.",
    "Broca's Area": "Make your narration clearer and more conversational.",
    "FFA": "Show more human faces — they drive connection and trust.",
    "PPA": "Use richer, more distinctive visual environments to anchor memory.",
    "TPJ": "Include moments that put the viewer in someone else's shoes.",
    "Visual Cortex": "Increase visual variety — more cuts, motion, or colour contrast.",
  };
  return map[name] ?? "Consider increasing the sensory richness of this content.";
}

export default function ResultsPanel({ results }: { results: AnalyzeResponse | null }) {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-text-secondary text-xs text-center">Upload a video and hit ANALYSE to see results</p>
      </div>
    );
  }

  // Only show regions that were actually activated
  const active = results.regions.filter(r => r.score >= 25).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {/* Score */}
      <div className="flex items-center justify-between rounded-2xl border px-5 py-4"
        style={{ background: '#0C0C0C', borderColor: '#1F1F1F' }}>
        <div>
          <p className="text-text-primary text-sm font-semibold">Brain Engagement</p>
          <p className="text-text-secondary text-xs mt-0.5">Overall neurological impact</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-display" style={{ color: COLOR }}>{results.engagement_score}</span>
          <span className="text-text-secondary text-xs">/100</span>
        </div>
      </div>

      {/* Region cards */}
      {active.length === 0 ? (
        <p className="text-text-secondary text-xs text-center py-4">No significant brain activation detected.</p>
      ) : (
        active.map(region => (
          <RegionCard
            key={region.name}
            region={region}
            rec={results.recommendations.find(r => r.region === region.name)}
          />
        ))
      )}
    </div>
  );
}
