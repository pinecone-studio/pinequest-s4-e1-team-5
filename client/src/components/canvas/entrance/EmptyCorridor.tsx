import { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
const EmptyCorridor = ({
  camera
}) => {
  const corridorWidth = 25;
  const corridorHeight = 3.5;
  const [segmentBase, setSegmentBase] = useState(0);
  const floorTexture = useTexture('/textures/entrance/floor_paper1.png');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(6.6, 20);
  useFrame(() => {
    if (!camera) return;
    const segmentLength = 40;
    const newBase = Math.floor(camera.position.z / segmentLength) * segmentLength;
    if (newBase !== segmentBase) {
      setSegmentBase(newBase);
    }
  });
  const segments = useMemo(() => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      result.push(segmentBase + i * 40);
    }
    return result;
  }, [segmentBase]);
  return <group>
            {segments.map(zStart => <CorridorSegmentEmpty key={zStart} zStart={zStart} corridorWidth={corridorWidth} corridorHeight={corridorHeight} floorTexture={floorTexture} />)}
        </group>;
};
const CorridorSegmentEmpty = ({
  zStart,
  corridorWidth,
  corridorHeight,
  floorTexture
}) => {
  const length = 40;
  const zCenter = zStart - length / 2;
  return <group>
            {}
            {}
            <mesh position={[0, -2, zCenter]} rotation={[-Math.PI / 2, 0, 0]} >
                <planeGeometry args={[corridorWidth, length]} />
                <meshBasicMaterial map={floorTexture} transparent={false} alphaTest={0.1} roughness={1} metalness={0} color="#7CFC00" />
            </mesh>

            {}
            {}
        </group>;
};
export default EmptyCorridor;
