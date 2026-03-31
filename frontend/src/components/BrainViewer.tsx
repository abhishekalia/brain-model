'use client';
import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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
    if (s >= 75) return '#ff3333';
    if (s >= 50) return '#ffaa00';
    if (s >= 25) return '#44aaff';
    return '#1a3a5c';
  };

  const color = score > 0 ? getColor(score) : '#1a3a5c';
  const intensity = score > 0 ? (score / 100) * 2 + 0.5 : 0.2;
  const size = score > 0 ? 0.035 + (score / 100) * 0.025 : 0.025;

  useFrame((_, delta) => {
    if (ringRef.current && score > 50) {
      ringRef.current.scale.x += delta * 0.8;
      ringRef.current.scale.y += delta * 0.8;
      ringRef.current.scale.z += delta * 0.8;
      const opacity = (ringRef.current.material as THREE.MeshBasicMaterial).opacity;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity - delta * 0.6);
      if ((ringRef.current.material as THREE.MeshBasicMaterial).opacity <= 0) {
        ringRef.current.scale.set(1, 1, 1);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6;
      }
    }
  });

  return (
    <group position={position}>
      {/* Main hotspot sphere */}
      <mesh
        onPointerEnter={() => onHover(name)}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[isHovered ? size * 1.4 : size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? intensity * 2 : intensity}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={score > 0 ? 0.95 : 0.4}
        />
      </mesh>

      {/* Pulse ring for high activation */}
      {score >= 50 && (
        <mesh ref={ringRef}>
          <ringGeometry args={[size * 1.2, size * 1.6, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Tooltip */}
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
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Apply realistic brain material to all meshes
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c68b7a'),
        roughness: 0.75,
        metalness: 0.05,
        envMapIntensity: 0.4,
      });
    }
  });

  const getRegionScore = (name: string) => {
    const region = regions.find((r) => r.name === name);
    return region ? region.score : 0;
  };

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
  const hasActivation = regions.length > 0;

  return (
    <div className="relative bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden" style={{ height: '500px' }}>
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/80 px-2 py-1 rounded">
          {label}
        </div>
      )}
      <Canvas camera={{ position: [0, 0.5, 3.5], fov: 45 }}>
        <color attach="background" args={['#050810']} />
        <ambientLight intensity={0.3} />
        <hemisphereLight args={['#ffd4b8', '#1a1a3e', 0.6]} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-3, -1, -2]} intensity={0.5} color="#4488ff" />
        <pointLight position={[0, -3, 1]} intensity={0.3} color="#ff8844" />
        <Suspense fallback={null}>
          <Environment preset="night" />
          <BrainModel regions={regions} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} />
        {hasActivation && (
          <EffectComposer>
            <Bloom luminanceThreshold={0.3} luminanceSmoothing={0.9} intensity={0.8} />
          </EffectComposer>
        )}
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span>High</span>
        </div>
      </div>

      {!hasActivation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-600 text-sm">Analyze content to see brain activation</p>
        </div>
      )}
    </div>
  );
}
