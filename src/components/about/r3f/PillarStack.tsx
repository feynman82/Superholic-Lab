'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const PILLARS = [
  { num: '01', name: 'DIAGNOSE',  accent: '#3B82F6' },
  { num: '02', name: 'ANALYSE',   accent: '#B76E79' },
  { num: '03', name: 'PRACTISE',  accent: '#059669' },
  { num: '04', name: 'REINFORCE', accent: '#D4A24A' },
];

export default function PillarStack() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 6.5], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} color="#fff" />
      <directionalLight position={[-3, 2, 2]} intensity={0.3} color="#51615E" />

      {PILLARS.map((p, i) => (
        <PillarBlock
          key={p.num}
          position={[(i - 1.5) * 1.5, 0, 0]}
          delay={i * 0.4}
          {...p}
        />
      ))}
    </Canvas>
  );
}

interface PillarProps {
  position: [number, number, number];
  num: string;
  name: string;
  accent: string;
  delay: number;
}

function PillarBlock({ position, num, name, accent, delay }: PillarProps) {
  const meshRef = useRef<THREE.Group>(null);
  const startTime = useRef(performance.now() / 1000 + delay);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() - startTime.current;
    if (t < 0) {
      meshRef.current.scale.setScalar(0);
      return;
    }
    // Scale-in over 0.8s with ease-out
    const scale = Math.min(1, 1 - Math.pow(1 - Math.min(t / 0.8, 1), 3));
    meshRef.current.scale.setScalar(scale);
    // Rotate around Y — 0.30 rad/s (2x prior speed) so the labelled
    // front face is in view more often instead of the blank sides.
    meshRef.current.rotation.y = t * 0.30;
  });

  return (
    <group ref={meshRef} position={position}>
      <RoundedBox args={[1.1, 2.2, 1.1]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#F9F6F0" roughness={0.9} />
      </RoundedBox>

      {/* Front face: number + name */}
      <Text
        position={[0, 0.5, 0.56]}
        fontSize={0.28}
        color={accent}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        {num}
      </Text>
      <Text
        position={[0, -0.6, 0.56]}
        fontSize={0.18}
        color="#2C3E3A"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
      >
        {name}
      </Text>

      {/* Top accent strip */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.0, 0.04, 1.0]} />
        <meshStandardMaterial color={accent} />
      </mesh>
    </group>
  );
}
