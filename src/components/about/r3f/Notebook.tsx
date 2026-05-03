'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/** Small notebook with a hand-written page texture. */
export default function Notebook() {
  const texture = useMemo(() => makeNotebookTexture(), []);

  return (
    <group>
      {/* Cover */}
      <mesh>
        <boxGeometry args={[0.95, 1.3, 0.04]} />
        <meshStandardMaterial color="#3A4E4A" roughness={0.7} />
      </mesh>

      {/* Open page */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.85, 1.2]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
    </group>
  );
}

function makeNotebookTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 450;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F9F6F0';
  ctx.fillRect(0, 0, 320, 450);

  // Faint horizontal lines
  ctx.strokeStyle = 'rgba(81, 97, 94, 0.18)';
  ctx.lineWidth = 0.5;
  for (let y = 40; y <= 450; y += 26) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(300, y);
    ctx.stroke();
  }

  // Margin line
  ctx.strokeStyle = 'rgba(183, 110, 121, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 20);
  ctx.lineTo(50, 440);
  ctx.stroke();

  // Hand-written notes
  ctx.fillStyle = '#2C3E3A';
  ctx.font = 'italic 18px serif';
  ctx.textAlign = 'left';
  ctx.fillText('she got 41 wrong', 60, 80);
  ctx.fillText('out of 60.', 60, 106);
  ctx.fillText('answer key:', 60, 158);
  ctx.fillText('B  C  A  D ...', 60, 184);
  ctx.fillStyle = '#B76E79';
  ctx.fillText('but why?', 60, 240);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
