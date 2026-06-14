import { useMemo, useState, useRef, useEffect } from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { isTouchDevice } from '../../../utils/deviceDetect';
const tempPos = new THREE.Vector3();
const tempRot = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempCamDir = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempQuat = new THREE.Quaternion();
const CABIN_SKETCH_URL = '/fonts/CabinSketch-Regular.ttf';
const PictureContent = ({
  imagePath,
  imagePaintedPath,
  width,
  height,
  isPainted
}) => {
  const texture = useTexture(imagePath);
  const paintedTexture = useTexture(imagePaintedPath || imagePath);
  const materialRef = useRef();
  useEffect(() => {
    if (!materialRef.current || !imagePaintedPath) return;
    if (isPainted) {
      gsap.to(materialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    } else {
      gsap.to(materialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
  }, [isPainted, imagePaintedPath]);
  return <group position={[0, 0, 0.01]}> {}
            {imagePaintedPath && <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color="#e0e0e0" map={paintedTexture} transparent={true} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} />
                </mesh>}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                {imagePaintedPath ? <revealMaterial color="#e0e0e0" ref={materialRef} map={texture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={0.9} uProgress={0.0} /> : <meshBasicMaterial color="#e0e0e0" map={texture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={0.5} />}
            </mesh>
        </group>;
};
const InspectableFrame = ({
  frame,
  wallX,
  frameTexture,
  framePaintedTexture,
  CABIN_SKETCH_URL,
  setCameraOverride
}) => {
  const {
    camera,
    viewport
  } = useThree();
  const groupRef = useRef();
  const frameMaterialRef = useRef();
  const framePaintedRef = useRef();
  const compileFramesRef = useRef(0);
  const hideDelayRef = useRef();
  const originalPos = useMemo(() => new THREE.Vector3(frame.side === 'left' ? -wallX + (frame.offsetFromWall || 0) : wallX - (frame.offsetFromWall || 0), frame.y, frame.z), [frame, wallX]);
  const originalRot = useMemo(() => new THREE.Euler(0, frame.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0), [frame.side]);
  const [isHovered, setIsHovered] = useState(false);
  const [isInspected, setIsInspected] = useState(false);
  const isTouch = useMemo(() => isTouchDevice(), []);
  const isMobile = viewport.width < 5 || viewport.aspect < 0.8 || isTouch;
  useEffect(() => {
    return () => {
      if (isInspected) {
        if (setCameraOverride) setCameraOverride(false);
        window.dispatchEvent(new CustomEvent('inspectChange', {
          detail: false
        }));
      }
    };
  }, [isInspected, setCameraOverride]);
  useEffect(() => {
    if (isHovered && !isMobile) document.body.style.cursor = 'pointer';else document.body.style.cursor = 'auto';
  }, [isHovered, isMobile]);
  useEffect(() => {
    if (!frameMaterialRef.current) return;
    const shouldBePainted = isHovered || isInspected;
    if (shouldBePainted) {
      if (hideDelayRef.current) hideDelayRef.current.kill();
      if (framePaintedRef.current) framePaintedRef.current.visible = true;
      gsap.to(frameMaterialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    } else {
      gsap.to(frameMaterialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
      hideDelayRef.current = gsap.delayedCall(0.55, () => {
        if (framePaintedRef.current) framePaintedRef.current.visible = false;
      });
    }
    return () => {
      if (hideDelayRef.current) hideDelayRef.current.kill();
    };
  }, [isHovered, isInspected]);
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (compileFramesRef.current < 2) {
      compileFramesRef.current++;
      if (compileFramesRef.current === 2) {
        if (!isHovered && !isInspected && framePaintedRef.current) {
          framePaintedRef.current.visible = false;
        }
      }
    }
    if (isInspected) {
      camera.getWorldDirection(tempCamDir);
      const baseDistance = 1.3;
      const aspectOffset = Math.max(0, 1.8 - viewport.aspect) * 1.5;
      const distance = Math.min(2.8, Math.max(1.5, baseDistance + aspectOffset));
      tempPos.copy(camera.position).add(tempCamDir.multiplyScalar(distance));
      tempRot.copy(camera.quaternion);
      const tiltX = -state.pointer.y * 0.3;
      const tiltY = state.pointer.x * 0.3;
      tempEuler.set(tiltX, tiltY, 0);
      tempQuat.setFromEuler(tempEuler);
      tempRot.multiply(tempQuat);
      tempScale.set(1.2, 1.2, 1.2);
    } else {
      tempPos.copy(originalPos);
      tempRot.setFromEuler(originalRot);
      tempScale.set(1, 1, 1);
    }
    const factor = delta * 6;
    groupRef.current.position.lerp(tempPos, factor);
    groupRef.current.quaternion.slerp(tempRot, factor);
    groupRef.current.scale.lerp(tempScale, factor);
  });
  return <group ref={groupRef} position={originalPos} rotation={originalRot}>
            {}
            <mesh position={[0, 0, 0.05]} onClick={e => {
      e.stopPropagation();
      if (isMobile) return;
      setIsInspected(prev => {
        const next = !prev;
        if (setCameraOverride) setCameraOverride(next);
        window.dispatchEvent(new CustomEvent('inspectChange', {
          detail: next
        }));
        return next;
      });
      setIsHovered(false);
    }} onPointerEnter={e => {
      e.stopPropagation();
      if (!isInspected && !isMobile) setIsHovered(true);
    }} onPointerLeave={e => {
      e.stopPropagation();
      setIsHovered(false);
    }}>
                <planeGeometry args={[frame.width, frame.height]} />
                <meshBasicMaterial color="#e0e0e0" transparent opacity={0} depthWrite={false} />
            </mesh>

            {}
            {!isTouch && <mesh ref={framePaintedRef} position={[0, 0, -0.001]} scale={[0.98, 0.98, 1]}>
                    <planeGeometry args={[frame.width, frame.height]} />
                    <meshBasicMaterial color="#e0e0e0" map={framePaintedTexture} transparent={true} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} />
                </mesh>}

            {}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[frame.width, frame.height]} />
                <revealMaterial color="#e0e0e0" ref={frameMaterialRef} map={framePaintedTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={0.9} uProgress={0.0} />
            </mesh>

            {}
            {frame.image && <PictureContent imagePath={frame.image} imagePaintedPath={!isTouch ? frame.imagePainted : null} width={frame.imageWidth || frame.width * 0.7} height={frame.imageHeight || frame.height * 0.7} isPainted={isHovered || isInspected} />}

            {}
            {frame.signature && <Text position={[frame.signatureX !== undefined ? frame.signatureX : frame.width / 2 - 0.1, frame.signatureY !== undefined ? frame.signatureY : -frame.height / 2 + 0.15, 0.02]} fontSize={frame.signatureSize || 0.12} font={CABIN_SKETCH_URL} color={frame.signatureColor || "#333333"} anchorX="center" anchorY="middle">
                    {frame.signature}
                </Text>}
        </group>;
};
const CorridorDecorations = ({
  segmentLength,
  zOffset,
  corridorWidth = 4,
  corridorHeight = 3.5,
  zClip = 100000,
  setCameraOverride
}) => {
  const wallX = corridorWidth / 2 - 0.01;
  const floorY = -corridorHeight / 2;
  const ceilingY = corridorHeight / 2;
  const frameTexture = useTexture('/textures/corridor/ramkanazdjecieduza.webp');
  const framePaintedTexture = useTexture('/textures/corridor/ramkanazdjecieduza_painted.webp');
  const standingFrameTexture = useTexture('/textures/corridor/standing1.png');
  const treeTexture = useTexture('/textures/corridor/corridor_trees.png');
  const grateTexture = useTexture('/textures/corridor/kratkawentylacyjna.webp');
  const flowerTexture = useTexture('/textures/corridor/chemi1.png');
  const lampGrilleTexture = useTexture('/textures/corridor/kratanalampy.webp');
  const lampSideTexture = useTexture('/textures/corridor/bokilampy.webp');
  lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.RepeatWrapping;
  lampSideTexture.repeat.set(1, 1);
  const lights = useMemo(() => {
    const items = [];
    const LIGHT_SPACING = 15;
    const LIGHT_START_OFFSET = -5;
    const startZ = zOffset + LIGHT_START_OFFSET;
    const endZ = zOffset - segmentLength + 10;
    for (let z = startZ; z > endZ; z -= LIGHT_SPACING) {
      items.push({
        z
      });
    }
    return items;
  }, [segmentLength, zOffset]);
  const frames = useMemo(() => [{
    z: zOffset - 10,
    side: 'right',
    width: 2.5,
    height: 2.5 / 1.785,
    y: 0.3,
    id: 'frame-1',
    image: '/textures/corridor/science_pic1.png', 
    imageWidth: 1.1,
    imageHeight: 0.8,
    offsetFromWall: 0.1
  }, {
    z: zOffset - 25,
    side: 'left',
    width: 2.5,
    height: 2.5 / 1.785,
    y: 0.2,
    id: 'frame-2',
    image: '/textures/corridor/science_pic2.png',
    imageWidth: 1.7,
    imageHeight: 0.8,
    offsetFromWall: 0.1
  }, {
    z: zOffset - 40,
    side: 'right',
    width: 2.5,
    height: 2.5 / 1.785,
    y: 0.25,
    id: 'frame-3',
    signature: "Artificial Intelligence!\nWant your lab here?\nCreate your own!",
    signatureX: 0,
    signatureY: 0,
    signatureSize: 0.12,
    signatureColor: '#333333'
  }, {
    z: zOffset - 55,
    side: 'left',
    width: 2.5,
    height: 2.5 / 1.785,
    y: 0.35,
    id: 'frame-4',
    signature: "The important thing is to\n never stop questoning.\n-Albert Einstein",
    signatureX: 0,
    signatureY: 0,
    signatureSize: 0.12,
    signatureColor: '#333333'
  }], [zOffset]);
  const woodTexture = useTexture('/textures/corridor/texturadrewnadonozekbiurka.webp');
  const tableTopTexture = useTexture('/textures/corridor/gorastolika.webp');
  const cabinetFrontTexture = useTexture('/textures/corridor/szafkaprzod.webp');
  const cabinetRestTexture = useTexture('/textures/corridor/szafkaprzodgora.webp');
  const legTexture = useMemo(() => {
    const tex = woodTexture.clone();
    tex.rotation = Math.PI / 2;
    tex.center.set(0.5, 0.5);
    return tex;
  }, [woodTexture]);
  const tableConfig = useMemo(() => ({
    z: zOffset - 35,
    width: 2.0,
    depth: 0.8,
    height: 1.0,
    legRadius: 0.08,
    topThickness: 0.08,
    x: -wallX + 0.42
  }), [zOffset, wallX]);
  return <group>
            {}
            {lights.filter(light => light.z <= zClip).map((light, i) => {
      lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.ClampToEdgeWrapping;
      lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.ClampToEdgeWrapping;
      return <group key={`light-${i}`} position={[0, ceilingY, light.z]}>
                        {}
                        {}
                        <mesh position={[0, -0.03, 0]}>
                            <boxGeometry args={[2.0, 0.06, 0.5]} />

                            {}
                            <meshBasicMaterial attach="material-0" color="#e8e8e8" roughness={0.6} />
                            <meshBasicMaterial attach="material-1" color="#e8e8e8" roughness={0.6} />

                            {}
                            <meshBasicMaterial attach="material-2" color="#d0d0d0" roughness={0.8} />

                            {}
                            <meshBasicMaterial attach="material-3" map={lampGrilleTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} color="#e0e0e0" roughness={0.5} />

                            {}
                            <meshBasicMaterial color="#e0e0e0" attach="material-4" map={lampSideTexture} roughness={0.6} />
                            <meshBasicMaterial color="#e0e0e0" attach="material-5" map={lampSideTexture} roughness={0.6} />
                        </mesh>

                        {}
                        <mesh position={[0, -0.059, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[1.9, 0.4]} />
                            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} />
                        </mesh>

                        {}
                        {}
                    </group>;
    })}

            {}
            <group position={[tableConfig.x, floorY, tableConfig.z]} rotation={[0, Math.PI / 2, 0]}>
                {}
                {[[-tableConfig.width / 2 + 0.1, -tableConfig.depth / 2 + 0.1], [tableConfig.width / 2 - 0.1, -tableConfig.depth / 2 + 0.1], [-tableConfig.width / 2 + 0.1, tableConfig.depth / 2 - 0.1], [tableConfig.width / 2 - 0.1, tableConfig.depth / 2 - 0.1]].map((pos, i) => <mesh key={`leg-${i}`} position={[pos[0], tableConfig.height / 2, pos[1]]}>
                        <boxGeometry args={[tableConfig.legRadius * 2, tableConfig.height, tableConfig.legRadius * 2]} />
                        <meshBasicMaterial color="#C19A6B" map={legTexture} roughness={0.8} />
                    </mesh>)}

                {}
                <mesh position={[0, tableConfig.height + tableConfig.topThickness / 2, 0]}>
                    <boxGeometry args={[tableConfig.width, tableConfig.topThickness, tableConfig.depth]} />
                    <meshBasicMaterial color="#C19A6B" attach="material-0" map={woodTexture} /> {}
                    <meshBasicMaterial color="#C19A6B" attach="material-1" map={woodTexture} /> {}
                    <meshBasicMaterial color="#C19A6B" attach="material-2" map={tableTopTexture} roughness={0.5} /> {}
                    <meshBasicMaterial attach="material-3" color="#e0e0e0" />   {}
                    <meshBasicMaterial color="#C19A6B" attach="material-4" map={woodTexture} /> {}
                    <meshBasicMaterial color="#C19A6B" attach="material-5" map={woodTexture} /> {}
                </mesh>

                {}
                <mesh position={[-0.1, tableConfig.height + tableConfig.topThickness + 0.33, 0]} rotation={[0, -Math.PI / 4, 0]}>
                    <planeGeometry args={[0.8, 0.8 / 0.758]} />
                    <meshBasicMaterial color="#e0e0e0" map={flowerTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={1} />
                </mesh>
            </group>

            {}
            {frames.map(frame => <InspectableFrame key={frame.id} frame={frame} wallX={wallX} frameTexture={frameTexture} framePaintedTexture={framePaintedTexture} CABIN_SKETCH_URL={CABIN_SKETCH_URL} setCameraOverride={setCameraOverride} />)}

            {}
            {}
            <mesh position={[wallX - 0.26, floorY + 0.5, zOffset - 51]}>
                {}
                <boxGeometry args={[0.5, 1.0, 1.0 * 0.8]} />
                {}
                <meshBasicMaterial color="#C19A6B" attach="material-0" map={cabinetRestTexture} />
                <meshBasicMaterial color="#C19A6B" attach="material-1" map={cabinetFrontTexture} />
                <meshBasicMaterial color="#C19A6B" attach="material-2" map={cabinetRestTexture} />
                <meshBasicMaterial color="#C19A6B" attach="material-3" map={cabinetRestTexture} />
                <meshBasicMaterial color="#C19A6B" attach="material-4" map={cabinetRestTexture} />
                <meshBasicMaterial color="#C19A6B" attach="material-5" map={cabinetRestTexture} />
            </mesh>

            {}
            {}
            <mesh position={[wallX - 0.26, floorY + 1.1 + 0.2, zOffset - 51]} rotation={[0, -Math.PI / 2 + 0.2, 0]}>
                <planeGeometry args={[0.7, 0.7 / 0.777]} />
                <meshBasicMaterial color="#e0e0e0" map={standingFrameTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={1} />
            </mesh>


            {}
            {}
            <mesh position={[-wallX + 0.8, floorY + 1.5, zOffset - 58]} rotation={[0, Math.PI / 4, 0]}>
                <planeGeometry args={[1.8, 1.8 / 0.602]} />
                <meshBasicMaterial color="#e0e0e0" map={treeTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={0.8} />
            </mesh>

            {}
            {}
            {frames.map((frame, i) => {
      const isFrameLeft = frame.side === 'left';
      const grateSide = isFrameLeft ? 'right' : 'left';
      return <mesh key={`grate-${i}`} position={[grateSide === 'left' ? -wallX + 0.01 : wallX - 0.01, ceilingY - 0.6, frame.z]} rotation={[0, grateSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
                        <planeGeometry args={[0.8, 0.8 / 1.968]} />
                        <meshBasicMaterial color="#e0e0e0" map={grateTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} roughness={0.8} />
                    </mesh>;
    })}

        </group>;
};
export default CorridorDecorations;
