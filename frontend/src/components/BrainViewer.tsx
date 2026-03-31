'use client';
import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
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
    if (s >= 50) return '#E8A87C';
    if (s >= 25) return '#A8C5DA';
    return '#C8BFB5';
  };

  const color = score > 0 ? getColor(score) : '#C8BFB5';
  const size = score > 0 ? 0.032 + (score / 100) * 0.022 : 0.022;

  useFrame((_, delta) => {
    if (ringRef.current && score >= 50) {
      ringRef.current.scale.x += delta * 1.2;
      ringRef.current.scale.y += delta * 1.2;
      ringRef.current.scale.z += delta * 1.2;
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 0.8);
      if (mat.opacity <= 0) {
        ringRef.current.scale.set(1, 1, 1);
        mat.opacity = 0.5;
      }
    }
  });

  return (
    <group position={position}>
      <mesh onPointerEnter={() => onHover(name)} onPointerLeave={() => onHover(null)}>
        <sphereGeometry args={[isHovered ? size * 1.5 : size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.4}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={score > 0 ? 0.95 : 0.35}
        />
      </mesh>

      {score >= 50 && (
        <mesh ref={ringRef}>
          <ringGeometry args={[size * 1.3, size * 1.7, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isHovered && regionData && (
        <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
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

function BrainModel({ regions }: { regions: BrainRegion[] }) {
  const { scene } = useGLTF('/brain.glb');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredRegion) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#D4A090'),
        roughness: 0.8,
        metalness: 0.0,
        envMapIntensity: 0.3,
      });
    }
  });

  const getRegionScore = (name: string) => regions.find((r) => r.name === name)?.score ?? 0;

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.5} />
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
    <div className="relative bg-white border border-border rounded-2xl shadow-sm overflow-hidden" style={{ height: '480px' }}>
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
          {label}
        </div>
      )}
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 45 }}>
        <color attach="background" args={['#FFFFFF']} />
        <ambientLight intensity={1.2} />
        <hemisphereLight args={['#FFF5EE', '#E8DDD5', 1.0]} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#FFF8F0" />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#E8F0FF" />
        <pointLight position={[0, -3, 2]} intensity={0.3} color="#FFE8D6" />
        <Suspense fallback={null}>
          <BrainModel regions={regions} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-text-secondary bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#A8C5DA]" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#E8A87C]" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#C4453A]" />
          <span>High</span>
        </div>
      </div>

      {regions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-text-secondary/50 text-sm">Rotate to explore · Analyze to activate</p>
        </div>
      )}
    </div>
  );
}
