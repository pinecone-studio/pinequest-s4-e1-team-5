import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';


const SegmentDoors = ({
  position = [0, 0, 0],
  corridorHeight = 3.5,
  corridorWidth = 7
}) => {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const leftHandleRef = useRef();
  const rightHandleRef = useRef();
  const isOpenRef = useRef(false);
 

  const {
    camera
  } = useThree();
 
  const frameTexture = useTexture('/textures/corridor/doors/frame_sketch.webp');
  const doorLeftTexture = useTexture('/textures/corridor/doors/doorrleft.webp');
  const doorRightTexture = useTexture('/textures/corridor/doors/dorright.webp');
  const handleLeftTexture = useTexture('/textures/corridor/doors/handle_left_sketch.webp');
  const handleRightTexture = useTexture('/textures/corridor/doors/handle_right_sketch.webp');
  const doorBackTexture = useTexture('/textures/corridor/doors/door_back.webp');
  const edgeTexture = useTexture('/textures/corridor/doors/pien.webp');
  const wallTexture = useTexture('/textures/corridor/wall_texture.webp');
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  const baseboardTexSrc = useTexture('/textures/corridor/texturadoprogow.webp');
  const NATURAL_TILE_W = 1582 / 94 * 0.15;
  const doorHeight = 2.4;
  const doorWidth = doorHeight * 0.391;
  const doorOpeningWidth = doorWidth * 2;
  const wallThickness = 0.12;
  const frameWidth = doorOpeningWidth + 0.16;
  const frameHeight = frameWidth * (1 / 0.818);
  const floorY = -corridorHeight / 2;
  const doorBottomY = floorY;
  const doorCenterY = doorBottomY + doorHeight / 2;
  const frameCenterY = doorBottomY + frameHeight / 2;
  const wallCenterY = floorY + corridorHeight / 2;
  const topWallHeight = corridorHeight - doorHeight;
  const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
  const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;
  const openDistance = 12;
  const closeDistance = 18;

  useFrame(() => {
    if (!leftDoorRef.current || !rightDoorRef.current) return;
    const distanceZ = Math.abs(camera.position.z - position[2]);
    const distanceX = Math.abs(camera.position.x - position[0]);
    if (distanceZ < openDistance && distanceX < 0.8 && !isOpenRef.current) {
      isOpenRef.current = true;
    
      
      if (leftHandleRef.current) {
        gsap.to(leftHandleRef.current.rotation, {
          z: 0.4,
          duration: 0.15,
          ease: 'power2.out'
        });
      }
      if (rightHandleRef.current) {
        gsap.to(rightHandleRef.current.rotation, {
          z: -0.4,
          duration: 0.15,
          ease: 'power2.out'
        });
      }
      gsap.to(leftDoorRef.current.rotation, {
        y: -Math.PI * 0.55,
        duration: 0.9,
        ease: 'power2.out',
        delay: 0.1
      });
      gsap.to(rightDoorRef.current.rotation, {
        y: Math.PI * 0.55,
        duration: 0.9,
        ease: 'power2.out',
        delay: 0.1
      });
    }
    if ((distanceZ > closeDistance || distanceX > 1.5) && isOpenRef.current) {
    
      gsap.to(leftDoorRef.current.rotation, {
        y: 0,
        duration: 0.7,
        ease: 'power2.in'
      });
      gsap.to(rightDoorRef.current.rotation, {
        y: 0,
        duration: 0.7,
        ease: 'power2.in'
      });
      if (leftHandleRef.current) {
        gsap.to(leftHandleRef.current.rotation, {
          z: 0,
          duration: 0.2,
          ease: 'power2.out',
          delay: 0.5
        });
      }
      if (rightHandleRef.current) {
        gsap.to(rightHandleRef.current.rotation, {
          z: 0,
          duration: 0.2,
          ease: 'power2.out',
          delay: 0.5
        });
      }
    }
  });
  const whileTrueTexture = useTexture('/textures/corridor/decorations/while_true_loop.webp');

  return <group position={[position[0], 0, position[2]]}>
            {}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" map={wallTexture} roughness={0.95} />
            </mesh>
            {}
            {}

            {}
            <mesh position={[doorOpeningWidth / 2 + sideWallWidth / 2, wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" map={wallTexture} roughness={0.95} />
            </mesh>
            {}
            {}

            {}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" map={wallTexture} roughness={0.95} />
            </mesh>
            {}
            <mesh position={[0, topWallCenterY, 0.07]}>
                <planeGeometry args={[1.4, 1.4 / 1.833]} />
                <meshBasicMaterial color="#e0e0e0" map={whileTrueTexture} transparent={true} roughness={0.9} alphaTest={0.1} />
            </mesh>

            {}
            {}
            <mesh position={[0, frameCenterY, 0.09]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#e0e0e0" map={frameTexture} transparent={true} alphaTest={0.1} roughness={0.9} depthWrite={false} />
            </mesh>

            {}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                {}
                <mesh position={[doorWidth / 2, 0, 0.06]}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {}
                <mesh position={[doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorLeftTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                </mesh>

                {}
                <mesh position={[doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorBackTexture} transparent={true} alphaTest={0.5} roughness={0.8} side={2} />
                </mesh>

                {}
                <group ref={leftHandleRef} position={[doorWidth / 2 + 0.357, -0.099, 0.10]}>
                    <mesh position={[-0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0" map={handleLeftTexture} transparent={true} alphaTest={0.5} depthWrite={false} />
                    </mesh>
                </group>
            </group>

            {}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                {}
                <mesh position={[-doorWidth / 2, 0, 0.06]}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {}
                <mesh position={[-doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorRightTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                </mesh>

                {}
                <mesh position={[-doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorBackTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                </mesh>

                {}
                <group ref={rightHandleRef} position={[-doorWidth / 2 - 0.357, -0.099, 0.10]}>
                    <mesh position={[0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0" map={handleRightTexture} transparent={true} alphaTest={0.5} depthWrite={false} />
                    </mesh>
                </group>
            </group>

            {}
            {}
            {}
            {(() => {
      const THRESHOLD_DEPTH = 0.15;
      const THRESHOLD_WIDTH = frameWidth + 0.1;
      const threshTex = baseboardTexSrc.clone();
      threshTex.needsUpdate = true;
      threshTex.wrapS = threshTex.wrapT = THREE.RepeatWrapping;
      threshTex.rotation = 0;
      threshTex.offset.set(0, 0);
      threshTex.repeat.set(THRESHOLD_WIDTH / NATURAL_TILE_W, 1);
      return <mesh position={[0, floorY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[THRESHOLD_WIDTH, THRESHOLD_DEPTH]} />
                        <meshBasicMaterial color="#e0e0e0" map={threshTex} roughness={0.9} metalness={0} side={THREE.DoubleSide} />
                    </mesh>;
    })()}
            {}
            {(() => {
              
      const bbTex = baseboardTexSrc.clone();
      bbTex.wrapS = bbTex.wrapT = THREE.RepeatWrapping;
      bbTex.rotation = 0;
      bbTex.offset.set(0, 0);
      bbTex.needsUpdate = true;
      bbTex.repeat.set(sideWallWidth / NATURAL_TILE_W, 1);
      return <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), floorY + 0.075, wallThickness / 2 + 0.01]}>
                        <planeGeometry args={[sideWallWidth, 0.15]} />
                        <meshBasicMaterial color="#e0e0e0" map={bbTex} roughness={0.8} side={THREE.DoubleSide} />
                    </mesh>;
    })()}

            {}
            

            {}
        </group>;
};
export default SegmentDoors;
