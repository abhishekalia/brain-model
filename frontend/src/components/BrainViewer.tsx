'use client';
import { useState } from 'react';
import { BrainRegion } from '@/types';

// Positions as % from center of the emoji container (left%, top%)
const HOTSPOT_POSITIONS: Record<string, { left: string; top: string }> = {
  'FFA':            { left: '62%', top: '58%' },
  'PPA':            { left: '38%', top: '62%' },
  "Broca's Area":   { left: '28%', top: '44%' },
  'TPJ':            { left: '70%', top: '38%' },
  'Auditory Cortex':{ left: '74%', top: '52%' },
  'Visual Cortex':  { left: '50%', top: '78%' },
  'Amygdala':       { left: '54%', top: '52%' },
};

function getColor(score: number) {
  if (score >= 75) return '#C4453A';
  if (score >= 50) return '#D4894A';
  if (score >= 25) return '#5B8DB8';
  return '#B0A9A0';
}

function getSize(score: number) {
  return 10 + (score / 100) * 8;
}

interface HotspotProps {
  region: BrainRegion;
  position: { left: string; top: string };
}

function Hotspot({ region, position }: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const color = getColor(region.score);
  const size = getSize(region.score);
  const active = region.score >= 50;

  return (
    <div
      className="absolute"
      style={{ left: position.left, top: position.top, transform: 'translate(-50%, -50%)', zIndex: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring for active regions */}
      {active && (
        <span
          className="absolute rounded-full animate-ping"
          style={{
            width: size * 2.2,
            height: size * 2.2,
            backgroundColor: color,
            opacity: 0.3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Dot */}
      <div
        className="relative rounded-full cursor-pointer transition-transform duration-150"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 ${active ? 8 : 4}px ${color}`,
          transform: hovered ? 'scale(1.6)' : 'scale(1)',
        }}
      />

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-20 bg-white border border-border rounded-xl shadow-lg p-3 w-52 text-left pointer-events-none"
          style={{ bottom: '130%', left: '50%', transform: 'translateX(-50%)' }}
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
    <div className="relative w-full h-full min-h-[400px] bg-[#F7F4F0] flex items-center justify-center overflow-hidden">
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-full border border-border shadow-sm">
          {label}
        </div>
      )}

      {/* Brain emoji with 3D CSS rotation */}
      <div className="relative" style={{ width: 260, height: 260 }}>
        <div
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            fontSize: 200,
            lineHeight: 1,
            animation: 'brainFloat 6s ease-in-out infinite, brainSpin 12s linear infinite',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))',
          }}
        >
          🧠
        </div>

        {/* Hotspots */}
        {regions.map((region) => {
          const pos = HOTSPOT_POSITIONS[region.name];
          if (!pos) return null;
          return <Hotspot key={region.name} region={region} position={pos} />;
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-text-secondary bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B8DB8]" /><span>Low</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D4894A]" /><span>Medium</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C4453A]" /><span>High</span></div>
      </div>

      <style>{`
        @keyframes brainFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes brainSpin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
