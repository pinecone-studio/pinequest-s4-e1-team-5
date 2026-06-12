import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
const PARTICLE_COUNT = 60;
const MIN_RADIUS = 4;
const MAX_RADIUS = 12;
const VERTICAL_SPREAD = 25;
const BASE_OPACITY = 0.18;
const LOOP_BOTTOM = -15;
const LOOP_TOP = 15;
const LOOP_HEIGHT = LOOP_TOP - LOOP_BOTTOM;
const SYMBOLS = [{
  text: '{/}',
  size: 0.8,
  weight: 2
}, {
  text: '</>',
  size: 0.8,
  weight: 2
}, {
  text: '{ }',
  size: 0.7,
  weight: 1
}, {
  text: '{ • }',
  size: 0.7,
  weight: 1
}, {
  text: ';',
  size: 0.5,
  weight: 3
}, {
  text: '::',
  size: 0.4,
  weight: 2
}, {
  text: '=>',
  size: 0.5,
  weight: 2
}, {
  text: '//',
  size: 0.5,
  weight: 2
}, {
  text: '&&',
  size: 0.4,
  weight: 1
}, {
  text: '0',
  size: 0.3,
  weight: 4
}, {
  text: '1',
  size: 0.3,
  weight: 4
}, {
  text: '01',
  size: 0.35,
  weight: 3
}, {
  text: '0101',
  size: 0.4,
  weight: 2
}, {
  text: '00',
  size: 0.35,
  weight: 2
}, {
  text: '↑',
  size: 0.4,
  weight: 2
}, {
  text: '→',
  size: 0.4,
  weight: 1
}, {
  text: '←',
  size: 0.4,
  weight: 1
}, {
  text: '×',
  size: 0.3,
  weight: 2
}, {
  text: '•',
  size: 0.25,
  weight: 3
}, {
  text: '○',
  size: 0.3,
  weight: 2
}, {
  text: '▪▪\n▪',
  size: 0.25,
  weight: 2
}, {
  text: '▪ ▪\n ▪',
  size: 0.25,
  weight: 1
}, {
  text: '▪▪▪',
  size: 0.2,
  weight: 2
}];
const getRandomSymbol = () => {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const symbol of SYMBOLS) {
    random -= symbol.weight;
    if (random <= 0) return symbol;
  }
  return SYMBOLS[0];
};
const generateParticles = () => {
  const particles = [];
  const X_SPREAD = 50;
  const Z_MIN = -4;
  const Z_MAX = -8;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const symbol = getRandomSymbol();
    const x = (Math.random() - 0.5) * X_SPREAD;
    const y = (Math.random() - 0.5) * VERTICAL_SPREAD;
    const z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
    particles.push({
      id: i,
      symbol,
      position: new THREE.Vector3(x, y, z),
      initialX: x,
      z: z,
      initialY: y,
      rotation: Math.random() * Math.PI * 2,
      driftSpeed: 0.1 + Math.random() * 0.2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      parallaxFactor: 0.3 + Math.random() * 0.7,
      phaseOffset: Math.random() * Math.PI * 2,
      opacity: BASE_OPACITY * (0.5 + Math.random() * 0.5)
    });
  }
  return particles;
};
const FloatingCodeParticles = ({
  towerRotationRef,
  fallOffsetRef
}) => {
  const particles = useMemo(() => generateParticles(), []);
  const meshRefs = useRef([]);
  const smoothRotation = useRef(0);
  const particleYOffsets = useRef(particles.map(() => 0));
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const towerRotation = towerRotationRef?.current || 0;
    const fallVelocity = fallOffsetRef?.current || 0;
    smoothRotation.current = THREE.MathUtils.lerp(smoothRotation.current, towerRotation, 0.08);
    const WRAP_WIDTH = 50;
    const HALF_WIDTH = WRAP_WIDTH / 2;
    particles.forEach((particle, index) => {
      const mesh = meshRefs.current[index];
      if (!mesh) return;
      particleYOffsets.current[index] -= fallVelocity * delta * particle.parallaxFactor * 1.5;
      const floatY = Math.sin(time * particle.driftSpeed + particle.phaseOffset) * 0.3;
      let finalY = particle.initialY + particleYOffsets.current[index] + floatY;
      while (finalY < LOOP_BOTTOM) {
        particleYOffsets.current[index] += LOOP_HEIGHT;
        finalY += LOOP_HEIGHT;
      }
      while (finalY > LOOP_TOP) {
        particleYOffsets.current[index] -= LOOP_HEIGHT;
        finalY -= LOOP_HEIGHT;
      }
      mesh.position.y = finalY;
      const rotationOffset = smoothRotation.current * 5.0;
      let finalX = particle.initialX + rotationOffset * particle.parallaxFactor;
      finalX = ((finalX + HALF_WIDTH) % WRAP_WIDTH + WRAP_WIDTH) % WRAP_WIDTH - HALF_WIDTH;
      mesh.position.x = finalX;
      mesh.position.z = particle.z;
      mesh.rotation.z = particle.rotation + time * particle.rotationSpeed;
    });
  });
  return <group position={[0, 0, -10]}>
            {particles.map((particle, index) => <Text key={particle.id} ref={el => {
      meshRefs.current[index] = el;
    }} position={particle.position} fontSize={particle.symbol.size} color="#1a1a1a" anchorX="center" anchorY="middle" fillOpacity={particle.opacity} font="/fonts/CabinSketch-Bold.ttf">
                    {particle.symbol.text}
                </Text>)}
        </group>;
};
export default FloatingCodeParticles;
