import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';


const RUBIK_SCRIBBLE_URL = '/fonts/RubikScribble-Regular.ttf';
const CABIN_SKETCH_URL = '/fonts/CabinSketch-Regular.ttf';

let hasPlayedDrawAnimation = false;
const HeroText = ({
  position = [0, 0.3, 0]
}) => {
  const groupRef = useRef();
  const letterRefs = useRef([]);
  const taglineRefs = useRef([]);
  const {
    camera
  } = useThree();
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      const minWidth = 320;
      const maxWidth = 1200;
      const minScale = 0.65;
      const maxScale = 1.0;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
      const t = (clampedWidth - minWidth) / (maxWidth - minWidth);
      setScale(minScale + t * (maxScale - minScale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  const splitAmount = useRef(0);
  const targetSplit = useRef(0);
  const floatY = useRef(0);
  const worldPosVec = useRef(new THREE.Vector3());

  const letters = useMemo(() => [{
    char: 'T',
    baseX: -1.4,
    splitDir: -1.6,
    delay: 0,
    color: '#5F9EA0',
  }, {
    char: 'O',
    baseX: -0.6,
    splitDir: -0.6,
    delay: 0,
    color: '#5F9EA0',
  }, {
    char: 'M',
    baseX: 0.2,
    splitDir: 0.6,
    delay: 0,
    color: '#5F9EA0',
  }, {
    char: 'Y',
    baseX: 0.95,
    splitDir: 1.8,
    delay: 0,
    color: '#5F9EA0',
  },{
    char: 'O',
    baseX: 1.67,
    splitDir: 1.8,
    delay: 0,
    color: '#5F9EA0',
  }
], []);

  const taglineWords = useMemo(() => [{
    text: '<',
    baseX: -1.3,
    splitDir: -1.5,
    delay: 0,
    color:'#4682B4'
  }, {
    text: 'ШИНЖЛЭХ УХААНЫ',
    baseX: -0.4,
    splitDir: -0.8,
    delay: 0,
    color:'#4682B4'
  }, {
    text: 'ШИНЭ ЭРИН',
    baseX:1,
    splitDir: 0.8,
    delay: 0,
    color:'#4682B4'
  }, {
    text: '/>',
    baseX: 1.68,
    splitDir: 1.5,
    delay: 0,
    color:'#4682B4'
  }], []);


  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.getWorldPosition(worldPosVec.current);
    const distance = camera.position.z - worldPosVec.current.z;
    const SPLIT_START = 3;
    const SPLIT_PEAK = 0;
    const SPLIT_END = -2;
    const SPLIT_AMOUNT = 0.9;
    if (distance > SPLIT_PEAK && distance < SPLIT_START) {
      const t = (SPLIT_START - distance) / (SPLIT_START - SPLIT_PEAK);
      targetSplit.current = SPLIT_AMOUNT * easeOutQuad(t);
    } else if (distance <= SPLIT_PEAK && distance > SPLIT_END) {
      const t = (distance - SPLIT_END) / (SPLIT_PEAK - SPLIT_END);
      targetSplit.current = SPLIT_AMOUNT * easeOutQuad(t);
    } else {
      targetSplit.current = 0;
    }
    splitAmount.current = THREE.MathUtils.lerp(splitAmount.current, targetSplit.current, 0.08);
    letterRefs.current.forEach((ref, i) => {
      if (ref) {
        if (ref.material) ref.material.opacity = 1;
        ref.scale.setScalar(1);
        const letter = letters[i];
        ref.position.x = letter.baseX + letter.splitDir * splitAmount.current;
        ref.position.y = 0.2 + Math.sin(time * 0.7 + i * 0.5) * 0.015;
        ref.rotation.z = Math.sin(time * 0.5 + i) * 0.02 * (1 + splitAmount.current);
      }
    });
    taglineRefs.current.forEach((ref, i) => {
      if (ref) {
        if (ref.material) ref.material.opacity = 1;
        const word = taglineWords[i];
        ref.position.x = word.baseX + word.splitDir * splitAmount.current * 0.6;
        ref.position.y = -0.45 + Math.sin(time * 0.6 + i * 0.3) * 0.008;
      }
    });
    floatY.current = Math.sin(time * 0.5) * 0.02;
    groupRef.current.position.y = position[1] + floatY.current;
  });
  return <group ref={groupRef} position={position} scale={[scale, scale, 1]}>
            {}
            {letters.map((letter, i) => <Text key={`${letter.char}-${i}`} ref={el => letterRefs.current[i] = el} position={[letter.baseX, 0.2, 0]} fontSize={0.9} font={RUBIK_SCRIBBLE_URL} color={letter.color} outlineWidth={0.012} outlineColor="#1a1a1a" anchorX="center" anchorY="middle" letterSpacing={0}>
                    {letter.char}
                </Text>)}

            {}
            {taglineWords.map((word, i) => <Text key={word.text} ref={el => taglineRefs.current[i] = el} position={[word.baseX, -0.55, 0.3]} fontSize={0.16} font={CABIN_SKETCH_URL} color={word.color} anchorX="center" anchorY="middle" letterSpacing={0.04}>
                    {word.text}
                </Text>)}

            {}
            <SmallStar position={[-1.2, 0.55, 0]} scale={0.07} />
            <SmallStar position={[1.25, 0.45, 0]} scale={0.05} />
            <SmallStar position={[-1.0, -0.6, 0]} scale={0.04} />
            <SmallStar position={[1.1, -0.55, 0]} scale={0.035} />
        </group>;
};
const easeOutQuad = t => t * (2 - t);
const SmallStar = ({
  position,
  scale = 0.1
}) => {
  return <group position={position} scale={scale}>
            {[0, 1, 2, 3].map(i => <mesh key={i} rotation={[0, 0, i * Math.PI / 4]}>
                    <planeGeometry args={[1, 0.12]} />
                    <meshBasicMaterial color="#333" transparent opacity={0.6} side={2} />
                </mesh>)}
        </group>;
};
export default HeroText;
