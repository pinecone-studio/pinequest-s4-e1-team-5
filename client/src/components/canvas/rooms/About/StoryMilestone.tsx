import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
const _worldPos = new THREE.Vector3();
const FADE_IN_START = -50;
const FADE_IN_END = -25;
const FADE_OUT_START = -8;
const FADE_OUT_END = -2;
const StoryMilestone = ({
  position = [0, 0, -30],
  title = "TITLE",
  subtitle = "",
  type = "intro",
  children
}) => {
  const groupRef = useRef();
  const currentOpacity = useRef(0);
  const titleRef = useRef();
  const subtitleRef = useRef();
  const decorRef = useRef();
  const avatarRef = useRef();
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(_worldPos);
    const z = _worldPos.z;
    let targetOpacity = 0;
    if (z < FADE_IN_START) {
      targetOpacity = 0;
    } else if (z >= FADE_IN_START && z <= FADE_IN_END) {
      const t = (z - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
      targetOpacity = t;
    } else if (z > FADE_IN_END && z < FADE_OUT_START) {
      targetOpacity = 1;
    } else if (z >= FADE_OUT_START && z <= FADE_OUT_END) {
      const t = 1 - (z - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
      targetOpacity = t;
    } else {
      targetOpacity = 0;
    }
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, 1 - Math.pow(0.05, delta));
    const opacity = currentOpacity.current;
    if (titleRef.current) {
      titleRef.current.fillOpacity = opacity;
    }
    if (subtitleRef.current) {
      subtitleRef.current.fillOpacity = opacity;
    }
    if (decorRef.current) {
      decorRef.current.opacity = opacity * 0.3;
    }
    if (avatarRef.current) {
      avatarRef.current.opacity = opacity * 0.5;
    }
    const scale = 0.8 + opacity * 0.2;
    groupRef.current.scale.setScalar(scale);
  });
  const styles = useMemo(() => {
    switch (type) {
      case 'intro':
        return {
          titleSize: 1.8,
          titleColor: '#1a1a1a',
          subtitleSize: 0.4,
          subtitleColor: '#4a4a4a',
          decorColor: '#e0e0e0'
        };
      case 'awards':
        return {
          titleSize: 1.5,
          titleColor: '#2a2a2a',
          subtitleSize: 0.35,
          subtitleColor: '#666666',
          decorColor: '#ffd700'
        };
      case 'journey':
        return {
          titleSize: 1.5,
          titleColor: '#2a2a2a',
          subtitleSize: 0.35,
          subtitleColor: '#666666',
          decorColor: '#87CEEB'
        };
      case 'skills':
        return {
          titleSize: 1.5,
          titleColor: '#2a2a2a',
          subtitleSize: 0.35,
          subtitleColor: '#666666',
          decorColor: '#90EE90'
        };
      default:
        return {
          titleSize: 1.5,
          titleColor: '#2a2a2a',
          subtitleSize: 0.35,
          subtitleColor: '#666666',
          decorColor: '#e0e0e0'
        };
    }
  }, [type]);
  return <group ref={groupRef} position={position}>
            {}
            <mesh position={[0, 0, 0.5]}>
                <planeGeometry args={[8, 5]} />
                <meshBasicMaterial ref={decorRef} color={styles.decorColor} transparent opacity={0} side={THREE.DoubleSide} />
            </mesh>

            {}
            <Text ref={titleRef} position={[0, 0.5, 0]} fontSize={styles.titleSize} color={styles.titleColor} anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf" fillOpacity={0}>
                {title}
            </Text>

            {}
            {subtitle && <Text ref={subtitleRef} position={[0, -0.5, 0]} fontSize={styles.subtitleSize} color={styles.subtitleColor} anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf" fillOpacity={0}>
                    {subtitle}
                </Text>}

            {}
            {type === 'intro' && <mesh position={[0, -1.5, 0]}>
                    <circleGeometry args={[0.8, 32]} />
                    <meshBasicMaterial ref={avatarRef} color="#cccccc" transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>}

            {}
            {children}
        </group>;
};
export default StoryMilestone;
