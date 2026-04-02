'use client';
import { useState } from 'react';
import { BrainRegion } from '@/types';

// Positions as % of the 320x320 container
const HOTSPOT_POSITIONS: Record<string, { left: string; top: string }> = {
  'FFA':             { left: '66%', top: '55%' },
  'PPA':             { left: '34%', top: '60%' },
  "Broca's Area":    { left: '25%', top: '42%' },
  'TPJ':             { left: '72%', top: '36%' },
  'Auditory Cortex': { left: '76%', top: '52%' },
  'Visual Cortex':   { left: '50%', top: '80%' },
  'Amygdala':        { left: '53%', top: '50%' },
};

function getColor(score: number) {
  if (score >= 75) return '#C4453A';
  if (score >= 50) return '#D4894A';
  if (score >= 25) return '#5B8DB8';
  return '#B0A9A0';
}

function Hotspot({ region }: { region: BrainRegion }) {
  const [hovered, setHovered] = useState(false);
  const pos = HOTSPOT_POSITIONS[region.name];
  if (!pos) return null;
  const color = getColor(region.score);
  const size = 14 + (region.score / 100) * 10;
  const active = region.score >= 50;

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%,-50%)',
        zIndex: 999,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {active && (
        <span
          className="animate-ping"
          style={{
            position: 'absolute',
            width: size * 2.2, height: size * 2.2,
            borderRadius: '50%',
            backgroundColor: color, opacity: 0.4,
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }}
        />
      )}
      <div
        style={{
          width: size, height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: '2.5px solid white',
          boxShadow: `0 0 12px ${color}, 0 2px 6px rgba(0,0,0,0.3)`,
          transform: hovered ? 'scale(1.6)' : 'scale(1)',
          transition: 'transform 0.15s ease',
          position: 'relative',
        }}
      />
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '140%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'white',
            border: '1px solid #e5e0d8',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            padding: '10px 12px',
            width: 210,
            pointerEvents: 'none',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a' }}>{region.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{region.score}</span>
          </div>
          <p style={{ fontSize: 10, color: '#888', fontWeight: 500, marginBottom: 4 }}>{region.marketing_label}</p>
          {region.description && (
            <p style={{ fontSize: 10, color: '#666', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {region.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrainViewer({ regions, label }: { regions: BrainRegion[]; label?: string }) {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#F7F4F0] flex flex-col items-center justify-center overflow-visible">
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-full border border-border shadow-sm">
          {label}
        </div>
      )}

      {/* Perspective wrapper — required for true 3D CSS transforms */}
      <div style={{ perspective: '700px', perspectiveOrigin: '50% 50%', overflow: 'visible' }}>
        <div
          style={{
            width: 320,
            height: 320,
            position: 'relative',
            animation: 'brain3d 8s ease-in-out infinite',
            overflow: 'visible',
          }}
        >
          {/* Emoji */}
          <div
            className="w-full h-full flex items-center justify-center select-none"
            style={{
              fontSize: 220,
              lineHeight: 1,
              filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.15))',
            }}
          >
            🧠
          </div>

          {/* Hotspot dots */}
          {regions.map((region) => (
            <Hotspot key={region.name} region={region} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-text-secondary bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B8DB8]" /><span>Low</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D4894A]" /><span>Medium</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C4453A]" /><span>High</span></div>
      </div>

      <style>{`
        @keyframes brain3d {
          0%   { transform: translateY(0px)  rotateY(-18deg) rotateX(6deg);  }
          25%  { transform: translateY(-10px) rotateY(0deg)   rotateX(-4deg); }
          50%  { transform: translateY(0px)  rotateY(18deg)  rotateX(6deg);  }
          75%  { transform: translateY(-10px) rotateY(0deg)   rotateX(-4deg); }
          100% { transform: translateY(0px)  rotateY(-18deg) rotateX(6deg);  }
        }
      `}</style>
    </div>
  );
}
