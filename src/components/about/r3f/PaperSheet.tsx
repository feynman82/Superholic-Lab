'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/** A4-ish sheet of paper with a bar model drawn on it. Texture is rendered from canvas. */
export default function PaperSheet() {
  const texture = useMemo(() => makeBarModelTexture(), []);

  return (
    <mesh>
      <planeGeometry args={[1.4, 1.95]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Generate a canvas-based texture showing a bar model. */
function makeBarModelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // Cream paper background
  ctx.fillStyle = '#FBF8F1';
  ctx.fillRect(0, 0, 512, 720);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(81, 97, 94, 0.12)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 720);
    ctx.stroke();
  }
  for (let y = 0; y <= 720; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Bar model: whole bar
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(59, 130, 246, 0.10)';
  ctx.fillRect(60, 180, 392, 80);
  ctx.strokeRect(60, 180, 392, 80);

  // Label "300"
  ctx.fillStyle = '#3B82F6';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('300', 256, 230);

  // Two parts (rose + mint)
  ctx.strokeStyle = '#B76E79';
  ctx.fillStyle = 'rgba(183, 110, 121, 0.12)';
  ctx.fillRect(60, 320, 156, 70);
  ctx.strokeRect(60, 320, 156, 70);

  ctx.strokeStyle = '#059669';
  ctx.fillStyle = 'rgba(5, 150, 105, 0.10)';
  ctx.fillRect(232, 320, 220, 70);
  ctx.strokeRect(232, 320, 220, 70);

  // Hand-written annotation
  ctx.fillStyle = '#2C3E3A';
  ctx.font = 'italic 22px serif';
  ctx.textAlign = 'left';
  ctx.fillText('ratio 2 : 3', 80, 480);

  // "why is it B?" question
  ctx.fillStyle = '#B76E79';
  ctx.font = 'italic 20px serif';
  ctx.fillText('why is the answer B?', 80, 580);

  // Underline
  ctx.strokeStyle = '#B76E79';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 595);
  ctx.lineTo(360, 595);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
