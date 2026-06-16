import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const FONT = '/fonts/CabinSketch-Bold.ttf';
const PINK = '#e040a0';
const PINK_DIM = '#7a1a50';

// ── Floating formula label ────────────────────────────────────────────────────
const FloatingLabel = memo(({ text, pos, fontSize, opacity, phase }: {
  text: string;
  pos: [number, number, number];
  fontSize: number;
  opacity: number;
  phase: number;
}) => {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = pos[1] + Math.sin(clock.getElapsedTime() * 0.4 + phase) * 0.3;
  });
  return (
    <group ref={ref} position={pos}>
      <Text fontSize={fontSize} color={PINK_DIM} font={FONT} anchorX="center" anchorY="middle"
        transparent fillOpacity={opacity} depthWrite={false}>
        {text}
      </Text>
    </group>
  );
});
FloatingLabel.displayName = 'FloatingLabel';

// ── Star particles ────────────────────────────────────────────────────────────
const Stars = memo(() => {
  const geo = useMemo(() => {
    const positions: number[] = [];
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < 320; i++) {
      positions.push(rng(-40, 40), rng(-20, 20), rng(-60, -5));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#ff80c0" size={0.07} transparent opacity={0.55} depthWrite={false} />
    </points>
  );
});
Stars.displayName = 'Stars';

// ── Grid floor ────────────────────────────────────────────────────────────────
const GridFloor = memo(() => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -18]}>
    <planeGeometry args={[80, 60, 40, 30]} />
    <meshBasicMaterial color="#8b1a5a" wireframe transparent opacity={0.12} depthWrite={false} />
  </mesh>
));
GridFloor.displayName = 'GridFloor';

// ── Main background ───────────────────────────────────────────────────────────
const LABELS = [
  { text: 'F = ma',        pos: [-14,  3, -28] as [number,number,number], size: 1.8, op: 0.35, ph: 0.0 },
  { text: 'E = mc²',       pos: [ 13,  5, -32] as [number,number,number], size: 2.0, op: 0.30, ph: 1.2 },
  { text: 'v = λf',        pos: [-10, -2, -24] as [number,number,number], size: 1.4, op: 0.28, ph: 2.5 },
  { text: 'U = IR',        pos: [ 12, -3, -26] as [number,number,number], size: 1.5, op: 0.32, ph: 3.8 },
  { text: 'Ek = ½mv²',    pos: [ -4,  6, -30] as [number,number,number], size: 1.3, op: 0.25, ph: 0.7 },
  { text: 'p = mv',        pos: [ 16,  1, -35] as [number,number,number], size: 1.6, op: 0.22, ph: 1.9 },
  { text: 'Ep = mgh',      pos: [-16, -1, -30] as [number,number,number], size: 1.3, op: 0.20, ph: 3.1 },
  { text: 'g ≈ 9.8 м/с²', pos: [  5, -5, -22] as [number,number,number], size: 1.1, op: 0.25, ph: 4.4 },
];

const PhysicsBackground = memo(() => (
  <group>
    {/* Dark space background — depthTest:false so it always shows behind everything */}
    <mesh position={[0, 0, -80]} renderOrder={-999}>
      <planeGeometry args={[200, 120]} />
      <meshBasicMaterial color="#04000e" depthTest={false} depthWrite={false} />
    </mesh>

    {/* Big "ФИЗИК" title behind the ring */}
    <Text
      position={[0, 8, -26]}
      fontSize={4}
      color={PINK_DIM}
      font={FONT}
      anchorX="center"
      anchorY="middle"
      transparent
      fillOpacity={0.18}
      depthWrite={false}
    >
    Physics
    </Text>

    <Stars />
    <GridFloor />

    {LABELS.map((l, i) => (
      <FloatingLabel key={i} text={l.text} pos={l.pos} fontSize={l.size} opacity={l.op} phase={l.ph} />
    ))}

  </group>
));
PhysicsBackground.displayName = 'PhysicsBackground';

export default PhysicsBackground;
