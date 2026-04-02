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
  const size = 10 + (region.score / 100) * 8;
  const active = region.score >= 50;

  return (
    <div
      className="absolute"
      style={{ left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)', zIndex: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {active && (
        <span
          className="absolute rounded-full animate-ping"
          style={{
            width: size * 2.4, height: size * 2.4,
            backgroundColor: color, opacity: 0.35,
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }}
        />
      )}
      <div
        className="relative rounded-full cursor-pointer transition-transform duration-150"
        style={{
          width: size, height: size,
          backgroundColor: color,
          boxShadow: `0 0 ${active ? 10 : 4}px ${color}`,
          transform: hovered ? 'scale(1.7)' : 'scale(1)',
        }}
      />
      {hovered && (
        <div
          className="absolute z-30 bg-white border border-border rounded-xl shadow-lg p-3 w-52 text-left pointer-events-none"
          style={{ bottom: '140%', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-text-primary">{region.name}</span>
            <span className="text-xs font-bold" style={{ color }}>{region.score}</span>
          </div>
          <p className="text-[10px] text-text-secondary font-medium mb-1">{region.marketing_label}</p>
          {region.description && (
            <p className="text-[10px] text-text-secondary leading-snug line-clamp-3">{region.description}</p>
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
      <div style={{ perspective: '700px', perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            width: 320,
            height: 320,
            position: 'relative',
            animation: 'brain3d 8s ease-in-out infinite',
            transformStyle: 'preserve-3d',
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
