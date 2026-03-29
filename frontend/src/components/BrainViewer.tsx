'use client';
import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BrainRegion } from '@/types';
import { BRAIN_REGIONS } from '@/lib/brainRegions';
import RegionTooltip from './RegionTooltip';

interface BrainModelProps {
  regions: BrainRegion[];
}

function BrainModel({ regions }: BrainModelProps) {
  const { scene } = useGLTF('/brain.glb');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredRegion) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const getRegionScore = (name: string) => {
    const region = regions.find((r) => r.name === name);
    return region ? region.score : 0;
  };

  const getHotspotColor = (score: number) => {
    if (score >= 80) return '#ff4444';
    if (score >= 60) return '#ffaa00';
    if (score >= 40) return '#44aaff';
    return '#224466';
  };

  const hoveredRegionData = hoveredRegion
    ? regions.find((r) => r.name === hoveredRegion)
    : null;
  const hoveredRegionDef = hoveredRegion
    ? BRAIN_REGIONS.find((r) => r.name === hoveredRegion)
    : null;

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.5} />

      {BRAIN_REGIONS.map((region) => {
        const score = getRegionScore(region.name);
        const color = getHotspotColor(score);
        const isHovered = hoveredRegion === region.name;

        return (
          <group key={region.name} position={region.position}>
            <mesh
              onPointerEnter={() => setHoveredRegion(region.name)}
              onPointerLeave={() => setHoveredRegion(null)}
            >
              <sphereGeometry args={[isHovered ? 0.06 : 0.04, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isHovered ? 1.5 : 0.8}
                transparent
                opacity={0.9}
              />
            </mesh>

            {isHovered && hoveredRegionData && (
              <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
                <RegionTooltip
                  name={hoveredRegionData.name}
                  score={hoveredRegionData.score}
                  marketingLabel={hoveredRegionData.marketing_label}
                  description={hoveredRegionData.description}
                />
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

interface BrainViewerProps {
  regions: BrainRegion[];
}

export default function BrainViewer({ regions }: BrainViewerProps) {
  return (
    <div className="bg-navy-light rounded-2xl border border-gray-800 overflow-hidden" style={{ height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Suspense fallback={null}>
          <BrainModel regions={regions} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
      </Canvas>
    </div>
  );
}
