'use client';

/** Stylised drafting table: tilted top + two legs. Low-poly, sage-tinted. */
export default function DraftingTable() {
  const tableTopColor = '#F9F6F0'; // cream
  const legColor = '#3A4E4A';      // sage-dark

  return (
    <group>
      {/* Table top — slight tilt to suggest drafting angle */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2.05, 0, 0]} receiveShadow>
        <boxGeometry args={[4.5, 3, 0.08]} />
        <meshStandardMaterial color={tableTopColor} roughness={0.85} />
      </mesh>

      {/* Edge band */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2.05, 0, 0]}>
        <boxGeometry args={[4.5, 3.02, 0.02]} />
        <meshStandardMaterial color="#51615E" roughness={0.7} />
      </mesh>

      {/* Front legs */}
      <mesh position={[-2, -1.4, 1.2]} castShadow>
        <boxGeometry args={[0.06, 2.6, 0.06]} />
        <meshStandardMaterial color={legColor} roughness={0.6} />
      </mesh>
      <mesh position={[2, -1.4, 1.2]} castShadow>
        <boxGeometry args={[0.06, 2.6, 0.06]} />
        <meshStandardMaterial color={legColor} roughness={0.6} />
      </mesh>

      {/* Cross brace */}
      <mesh position={[0, -1.4, 1.2]}>
        <boxGeometry args={[4.0, 0.04, 0.04]} />
        <meshStandardMaterial color={legColor} roughness={0.6} />
      </mesh>
    </group>
  );
}
