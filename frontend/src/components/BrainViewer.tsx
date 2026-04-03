'use client';
import { useState } from 'react';
import { BrainRegion } from '@/types';

// Anatomical positions in the 380x268 SVG viewBox (side view, left hemisphere)
// Frontal = left, Occipital = right, Temporal = bottom
const REGION_SPOTS: Record<string, { cx: number; cy: number }> = {
  "Broca's Area":    { cx: 105, cy: 172 },
  'Auditory Cortex': { cx: 182, cy: 215 },
  'FFA':             { cx: 228, cy: 220 },
  'PPA':             { cx: 258, cy: 208 },
  'TPJ':             { cx: 268, cy: 148 },
  'Visual Cortex':   { cx: 302, cy: 160 },
  'Amygdala':        { cx: 155, cy: 196 },
};

function getGlowColor(score: number) {
  if (score >= 75) return { color: '#FF6500', opacity: 1, r: 16 };
  if (score >= 50) return { color: '#FF6500', opacity: 0.7, r: 13 };
  if (score >= 25) return { color: '#FF6500', opacity: 0.35, r: 10 };
  return { color: '#333333', opacity: 0.5, r: 7 };
}

interface RegionSpotProps {
  region: BrainRegion;
  hasResults: boolean;
}

function RegionSpot({ region, hasResults }: RegionSpotProps) {
  const [hovered, setHovered] = useState(false);
  const spot = REGION_SPOTS[region.name];
  if (!spot) return null;

  const { color, opacity, r } = hasResults
    ? getGlowColor(region.score)
    : { color: '#2a2a2a', opacity: 1, r: 7 };

  const isActive = hasResults && region.score >= 25;

  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer glow ring for active regions */}
      {isActive && (
        <>
          <circle
            cx={spot.cx} cy={spot.cy} r={r + 10}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={opacity * 0.2}
            className="glow-pulse"
          />
          <circle
            cx={spot.cx} cy={spot.cy} r={r + 5}
            fill={color}
            opacity={opacity * 0.15}
            className="glow-pulse"
          />
        </>
      )}

      {/* Core dot */}
      <circle
        cx={spot.cx} cy={spot.cy}
        r={hovered ? r + 3 : r}
        fill={isActive ? color : '#1e1e1e'}
        stroke={isActive ? color : '#333'}
        strokeWidth={isActive ? 0 : 1}
        opacity={isActive ? opacity : 0.6}
        style={{ transition: 'all 0.2s ease', filter: isActive ? `drop-shadow(0 0 ${r}px ${color})` : 'none' }}
        className={isActive ? 'region-enter' : ''}
      />

      {/* Score label inside dot for active regions */}
      {isActive && (
        <text
          x={spot.cx} y={spot.cy + 1}
          textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={r > 12 ? 8 : 7}
          fontWeight="600" style={{ pointerEvents: 'none' }}
        >
          {region.score}
        </text>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <foreignObject
          x={spot.cx - 105} y={spot.cy - 105}
          width="210" height="100"
          style={{ overflow: 'visible', pointerEvents: 'none', zIndex: 100 }}
        >
          <div
            style={{
              background: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: 10,
              padding: '10px 12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{region.name}</span>
              {hasResults && (
                <span style={{ color: '#FF6500', fontSize: 11, fontWeight: 700 }}>{region.score}/100</span>
              )}
            </div>
            <p style={{ color: '#555', fontSize: 10, margin: 0 }}>{region.marketing_label}</p>
            {hasResults && region.description && (
              <p style={{ color: '#888', fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>
                {region.description.slice(0, 80)}...
              </p>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default function BrainViewer({ regions, label }: { regions: BrainRegion[]; label?: string }) {
  const hasResults = regions.length > 0 && regions.some(r => r.score > 0);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-bg flex flex-col items-center justify-center">
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-surface border border-border px-3 py-1.5 rounded-full">
          {label}
        </div>
      )}

      <svg
        viewBox="0 0 380 268"
        style={{ width: '85%', maxWidth: 420, height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="brain-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Brain silhouette — side view left hemisphere */}
        {/* Main cortex outline */}
        <path
          d="
            M 148 252
            C 122 252, 96 242, 78 224
            C 60 206, 52 182, 56 158
            C 40 148, 28 128, 30 106
            C 32 84, 50 64, 72 52
            C 96 38, 126 32, 158 32
            C 190 32, 224 38, 252 54
            C 280 70, 300 94, 308 120
            C 318 148, 314 174, 300 194
            C 286 214, 264 228, 240 236
            C 216 244, 190 246, 166 246
            C 160 250, 154 252, 148 252 Z
          "
          fill="#0C0C0C"
          stroke="#252525"
          strokeWidth="1.5"
        />

        {/* Temporal lobe bulge */}
        <path
          d="
            M 78 224
            C 65 215, 55 200, 52 182
            C 49 162, 54 142, 64 128
            C 72 140, 76 158, 78 178
            C 80 198, 80 212, 78 224 Z
          "
          fill="#0E0E0E"
          stroke="#222"
          strokeWidth="1"
        />

        {/* Subtle sulci lines (brain texture) */}
        <path d="M 112 68 C 130 58, 158 54, 186 58" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 82 92 C 100 80, 128 72, 158 70" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 66 122 C 88 108, 118 100, 152 98" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 200 52 C 228 54, 255 64, 275 80" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 195 78 C 220 76, 248 84, 270 98" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 188 108 C 212 104, 242 110, 268 124" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 150 180 C 175 190, 205 198, 238 196" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 132 212 C 155 218, 185 222, 215 220" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />

        {/* Region spots */}
        {regions.map((region) => (
          <RegionSpot key={region.name} region={region} hasResults={hasResults} />
        ))}

        {/* Empty state — dim unscored spots */}
        {!hasResults && Object.entries(REGION_SPOTS).map(([name, spot]) => (
          <circle key={name} cx={spot.cx} cy={spot.cy} r={6} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1" />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#333' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FF6500', opacity: 0.5 }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FF6500' }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
