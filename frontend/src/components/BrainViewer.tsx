'use client';
import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BrainRegion } from '@/types';

// Approximate 3D positions within the brain model's coordinate space.
// These will be tuned to the actual model scale after first render.
const REGION_BLOBS: Record<string, {
  position: [number, number, number];
  scale: [number, number, number];
}> = {
  "Broca's Area":    { position: [-0.55, 0.05, 0.55],  scale: [0.28, 0.20, 0.22] },
  'Auditory Cortex': { position: [-0.10, 0.05, 0.62],  scale: [0.32, 0.18, 0.22] },
  'FFA':             { position: [ 0.20, -0.30, 0.42], scale: [0.24, 0.18, 0.20] },
  'PPA':             { position: [ 0.35, -0.25, 0.25], scale: [0.22, 0.16, 0.20] },
  'TPJ':             { position: [ 0.30,  0.20, 0.35], scale: [0.28, 0.20, 0.22] },
  'Visual Cortex':   { position: [ 0.55,  0.10, -0.10],scale: [0.30, 0.24, 0.28] },
  'Amygdala':        { position: [-0.15, -0.20, 0.48], scale: [0.18, 0.14, 0.16] },
};

function getIntensity(score: number) {
  if (score >= 75) return 1.0;
  if (score >= 50) return 0.65;
  if (score >= 25) return 0.35;
  return 0;
}

function RegionBlob({ region }: { region: BrainRegion }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const blob = REGION_BLOBS[region.name];
  if (!blob) return null;

  const intensity = getIntensity(region.score);
  if (intensity === 0) return null;

  const emissiveColor = new THREE.Color(
    intensity >= 1.0 ? '#FFB300' : intensity >= 0.65 ? '#FF6500' : '#CC3300'
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      // Pulse the emissive intensity
      mat.emissiveIntensity = intensity * (0.8 + 0.2 * Math.sin(Date.now() * 0.002));
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={blob.position}
        scale={blob.scale}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={intensity * 0.9}
          transparent
          opacity={0.72}
          roughness={0.3}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Outer soft glow halo */}
      <mesh position={blob.position} scale={[blob.scale[0] * 1.6, blob.scale[1] * 1.6, blob.scale[2] * 1.6]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={intensity * 0.3}
          transparent
          opacity={0.18}
          roughness={1}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {hovered && (
        <Html position={blob.position} distanceFactor={3} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: 10,
            padding: '10px 14px',
            width: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            transform: 'translateX(-50%)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{region.name}</span>
              <span style={{ color: '#FF6500', fontSize: 11, fontWeight: 700 }}>{region.score}</span>
            </div>
            <p style={{ color: '#666', fontSize: 10, margin: '0 0 4px' }}>{region.marketing_label}</p>
            {region.description && (
              <p style={{ color: '#999', fontSize: 10, margin: 0, lineHeight: 1.4 }}>
                {region.description.slice(0, 90)}...
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

function BrainModel({ regions }: { regions: BrainRegion[] }) {
  const { scene } = useGLTF('/brain_point_cloud.glb');
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Apply gray material to all brain meshes
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#8a9ba8'),
          roughness: 0.65,
          metalness: 0.05,
          transparent: false,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current && !hovered) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <primitive object={scene} />
      {regions.map((region) => (
        <RegionBlob key={region.name} region={region} />
      ))}
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div style={{ color: '#555', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
        Loading brain model...
      </div>
    </Html>
  );
}

export default function BrainViewer({ regions, label }: { regions: BrainRegion[]; label?: string }) {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-bg">
      {label && (
        <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-text-secondary uppercase tracking-widest bg-surface border border-border px-3 py-1.5 rounded-full">
          {label}
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 0.5, 3.5], fov: 38 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#000000']} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 3]} intensity={1.8} color="#ffffff" castShadow />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#c8d8e8" />
        <pointLight position={[0, -3, 2]} intensity={0.4} color="#ff6500" />

        <Suspense fallback={<LoadingFallback />}>
          <BrainModel regions={regions} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Legend — only show when there are results */}
      {regions.some(r => r.score > 0) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-text-secondary bg-surface/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#CC3300]" /><span>Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FF6500]" /><span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FFB300]" /><span>High</span>
          </div>
        </div>
      )}
    </div>
  );
}
