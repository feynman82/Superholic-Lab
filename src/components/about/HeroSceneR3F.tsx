'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import DraftingTable from './r3f/DraftingTable';
import PaperSheet from './r3f/PaperSheet';
import Notebook from './r3f/Notebook';

export default function HeroSceneR3F() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.6]}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {/* Soft sage-tinted lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={0.7} color="#fdfaf3" />
        <directionalLight position={[-2, 2, 2]} intensity={0.25} color="#51615E" />

        <ParallaxRig>
          <BlueprintBackdrop />

          {/* Mid-ground: drafting table */}
          <group position={[0, -0.5, 0]}>
            <DraftingTable />
          </group>

          {/* Foreground: paper with bar-model */}
          <group position={[0, 0.05, 1.4]} rotation={[-Math.PI / 2.05, 0, 0.03]}>
            <PaperSheet />
          </group>

          {/* Notebook on table */}
          <group position={[1.3, 0.05, 0.8]} rotation={[-Math.PI / 2, 0, -0.15]}>
            <Notebook />
          </group>
        </ParallaxRig>
      </Suspense>
    </Canvas>
  );
}

/** Mouse-parallax rig: subtle camera offset. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      target.current = { x: nx, y: ny };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    setMouse((prev) => ({
      x: prev.x + (target.current.x - prev.x) * 0.04,
      y: prev.y + (target.current.y - prev.y) * 0.04,
    }));
    groupRef.current.rotation.y = mouse.x * 0.05;
    groupRef.current.rotation.x = -mouse.y * 0.025;
  });

  return <group ref={groupRef}>{children}</group>;
}

function BlueprintBackdrop() {
  return (
    <mesh position={[0, 1, -3]}>
      <planeGeometry args={[12, 8]} />
      <meshBasicMaterial color="#F4FBF9" transparent opacity={0.8} />
    </mesh>
  );
}
