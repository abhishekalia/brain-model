'use client';
import { useState } from 'react';
import { BrainRegion } from '@/types';

// Anatomical positions in the 380x268 SVG viewBox (side view, left hemisphere)
// Frontal = left, Occipital = right, Temporal = bottom
// Positions within 420x280 viewBox — side view, frontal=left, occipital=right
const REGION_SPOTS: Record<string, { cx: number; cy: number }> = {
  "Broca's Area":    { cx: 108, cy: 168 },  // inferior frontal, above Sylvian
  'Auditory Cortex': { cx: 188, cy: 210 },  // superior temporal gyrus
  'FFA':             { cx: 232, cy: 255 },  // inferior temporal (temporal lobe)
  'PPA':             { cx: 262, cy: 248 },  // parahippocampal (posterior temporal)
  'TPJ':             { cx: 278, cy: 158 },  // temporoparietal junction
  'Visual Cortex':   { cx: 318, cy: 168 },  // occipital lobe
  'Amygdala':        { cx: 155, cy: 200 },  // medial temporal
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
        viewBox="0 0 420 280"
        style={{ width: '90%', maxWidth: 480, height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="brain-fill" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#181818" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
        </defs>

        {/* ── Brain silhouette: side view, left hemisphere ──
            Frontal = LEFT, Occipital = RIGHT, Temporal = BOTTOM PROTRUSION */}
        <path
          d="
            M 72 218
            C 52 206, 38 184, 36 160
            C 34 136, 42 110, 58 88
            C 74 66, 98 50, 126 42
            C 154 34, 184 32, 212 36
            C 240 40, 268 50, 292 66
            C 316 82, 334 106, 340 132
            C 346 158, 338 184, 322 204
            C 306 224, 282 238, 255 246
            C 228 254, 198 256, 170 252
            C 143 248, 118 238, 98 226
            C 86 220, 78 218, 72 218 Z
          "
          fill="url(#brain-fill)"
          stroke="#2a2a2a"
          strokeWidth="1.5"
        />

        {/* Temporal lobe — protrudes downward from main brain body */}
        <path
          d="
            M 98 226
            C 88 232, 80 240, 78 252
            C 76 264, 84 274, 98 278
            C 120 282, 150 280, 178 276
            C 206 272, 232 264, 252 254
            C 258 251, 260 248, 255 246
            C 228 254, 198 256, 170 252
            C 143 248, 118 238, 98 226 Z
          "
          fill="#101010"
          stroke="#2a2a2a"
          strokeWidth="1.5"
        />

        {/* Sylvian fissure — the characteristic horizontal groove */}
        <path d="M 96 218 C 130 204 168 192 210 185 C 248 178 278 172 298 168"
          fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />

        {/* Superior gyri (top of brain) */}
        <path d="M 130 46 C 158 36 188 34 216 38" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 108 64 C 138 50 170 44 202 46" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 90 86 C 122 68 158 60 192 62" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 238 46 C 265 54 290 68 308 88" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 230 68 C 258 72 284 86 302 108" fill="none" stroke="#1e1e1e" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central sulcus (divides frontal/parietal) */}
        <path d="M 200 38 C 205 80 208 125 204 168" fill="none" stroke="#1c1c1c" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />

        {/* Temporal gyri */}
        <path d="M 102 238 C 132 248 165 254 198 254" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 120 228 C 148 236 180 240 212 238" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />

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
