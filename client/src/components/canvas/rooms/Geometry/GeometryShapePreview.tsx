import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  topicId: string;
  /** Normalized 0–1 values per param */
  norms: number[];
  accent: string;
  isSelected: boolean;
};

const MAX = 0.092;

export default function GeometryShapePreview({ topicId, norms, accent, isSelected }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [n0 = 0.5, n1 = 0.5, n2 = 0.5] = norms;

  useFrame((_, delta) => {
    if (groupRef.current && isSelected) {
      groupRef.current.rotation.y += delta * 0.72;
    }
  });

  const geo = useMemo(() => {
    const a = MAX * (0.3 + n0 * 0.7);
    const b = MAX * (0.3 + n1 * 0.7);
    const c = MAX * (0.3 + n2 * 0.7);

    switch (topicId) {
      case 'sphere':
        return new THREE.SphereGeometry(a, 20, 14);
      case 'cylinder':
        return new THREE.CylinderGeometry(a, a, b * 2.2, 24, 1);
      case 'circle':
        return new THREE.CylinderGeometry(a, a, 0.020, 32, 1);
      case 'rectangle': {
        return new THREE.BoxGeometry(a * 2, b * 2, 0.018);
      }
      case 'triangle': {
        const shape = new THREE.Shape();
        shape.moveTo(-a, -b);
        shape.lineTo(a, -b);
        shape.lineTo(0, b);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.020, bevelEnabled: false });
      }
      case 'pythagorean': {
        const shape = new THREE.Shape();
        shape.moveTo(-a, -b);
        shape.lineTo(a, -b);
        shape.lineTo(a, b);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.020, bevelEnabled: false });
      }
      case 'trapezoid': {
        const shape = new THREE.Shape();
        shape.moveTo(-b, -c);
        shape.lineTo(b, -c);
        shape.lineTo(a, c);
        shape.lineTo(-a, c);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.020, bevelEnabled: false });
      }
      case 'coordinate': {
        return new THREE.SphereGeometry(0.016, 8, 6);
      }
      default:
        return new THREE.SphereGeometry(MAX, 12, 8);
    }
  }, [topicId, n0, n1, n2]);

  useEffect(() => {
    return () => { geo.dispose(); };
  }, [geo]);

  return (
    <group ref={groupRef} rotation={[0.28, 0, 0]}>
      <mesh geometry={geo} renderOrder={56}>
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.30}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
      <mesh geometry={geo} renderOrder={57}>
        <meshBasicMaterial color={accent} wireframe depthTest={false} />
      </mesh>
    </group>
  );
}
