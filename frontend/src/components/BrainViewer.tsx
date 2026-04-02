'use client';
import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BrainRegion } from '@/types';
import { BRAIN_REGIONS } from '@/lib/brainRegions';
import RegionTooltip from './RegionTooltip';

interface HotspotProps {
  position: [number, number, number];
  score: number;
  name: string;
  regionData: BrainRegion | undefined;
  onHover: (name: string | null) => void;
  isHovered: boolean;
}

function Hotspot({ position, score, name, regionData, onHover, isHovered }: HotspotProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  const getColor = (s: number) => {
    if (s >= 75) return '#C4453A';
    if (s >= 50) return '#D4894A';
    if (s >= 25) return '#5B8DB8';
    return '#B0A9A0';
  };

  const color = score > 0 ? getColor(score) : '#B0A9A0';
  const size = score > 0 ? 0.030 + (score / 100) * 0.020 : 0.020;

  useFrame((_, delta) => {
    if (ringRef.current && score >= 50) {
      ringRef.current.scale.x += delta * 1.0;
      ringRef.current.scale.y += delta * 1.0;
      ringRef.current.scale.z += delta * 1.0;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 0.7);
      if (mat.opacity <= 0) {
        ringRef.current.scale.set(1, 1, 1);
        mat.opacity = 0.45;
      }
    }
  });

  return (
    <group position={position}>
      <mesh onPointerEnter={() => onHover(name)} onPointerLeave={() => onHover(null)}>
        <sphereGeometry args={[isHovered ? size * 1.6 : size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 1.2 : 0.6}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={score > 0 ? 0.95 : 0.3}
        />
      </mesh>

      {score >= 50 && (
        <mesh ref={ringRef}>
          <ringGeometry args={[size * 1.4, size * 1.9, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isHovered && regionData && (
        <Html distanceFactor={5} style={{ pointerEvents: 'none', zIndex: 100 }}>
          <RegionTooltip
            name={regionData.name}
            score={regionData.score}
            marketingLabel={regionData.marketing_label}
            description={regionData.description}
          />
        </Html>
      )}
    </group>
  );
}

function EmojiPlane() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '340px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧠', 256, 270);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <mesh>
      <planeGeometry args={[2.6, 2.6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function BrainModel({ regions }: { regions: BrainRegion[] }) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredRegion) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  const getRegionScore = (name: string) => regions.find((r) => r.name === name)?.score ?? 0;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <EmojiPlane />
      {BRAIN_REGIONS.map((region) => (
        <Hotspot
          key={region.name}
          position={region.position}
          score={getRegionScore(region.name)}
          name={region.name}
          regionData={regions.find((r) => r.name === region.name)}
          onHover={setHoveredRegion}
          isHovered={hoveredRegion === region.name}
        />
      ))}
    </group>
  );
}

export default function BrainViewer({ regions, label }: { regions: BrainRegion[]; label?: string }) {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#F7F4F0]">
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-full border border-border shadow-sm">
          {label}
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 1, 4], fov: 42 }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#F7F4F0']} />

        {/* Ambient — keep low so shadows are visible */}
        <ambientLight intensity={0.35} />

        {/* Key light — strong, top-left-front, casts shadows */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={2.2}
          color="#FFF8F0"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
        />

        {/* Rim light — from behind, creates edge glow */}
        <directionalLight position={[-3, 2, -5]} intensity={1.0} color="#E8F0FF" />

        {/* Fill light — soft from below */}
        <pointLight position={[0, -4, 2]} intensity={0.4} color="#FFE8D6" />

        {/* Shadow catcher plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial transparent opacity={0.08} />
        </mesh>

        <Suspense fallback={null}>
          <BrainModel regions={regions} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={7}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-text-secondary bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm whitespace-nowrap">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B8DB8]" /><span>Low</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D4894A]" /><span>Medium</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C4453A]" /><span>High</span></div>
      </div>
    </div>
  );
}
