import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { playBackgroundMusic } from '../../../utils/audioManager';
import { useAchievements } from '../../../context/AchievementsContext';
import { isTouchDevice } from '../../../utils/deviceDetect';

const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';

const EntranceDoors = ({
  position = [0, 0, 22],
  onComplete,
  corridorHeight = 8,
  corridorWidth = 15
}) => {
  const leftDoorRef = useRef();
  const rightDoorRef = useRef();
  const leftHandleRef = useRef();
  const rightHandleRef = useRef();
  const rightDoorMaterialRef = useRef();
  const leftDoorMaterialRef = useRef();
  const leftHandleMaterialRef = useRef();
  const rightHandleMaterialRef = useRef();
  const leftHandlePaintedRef = useRef();
  const rightHandlePaintedRef = useRef();
  const groupRef = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const {
    camera
  } = useThree();
  const {
    unlockAchievement
  } = useAchievements();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isTouchDevice() || window.innerWidth < 1000);
  }, []);
  const isMobileDevice = typeof window !== 'undefined' && (isTouchDevice() || window.innerWidth < 1000);
  const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const frameTexture = useTexture('/textures/doors/frame_sketch.webp'); 
  const doorRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_right_painted.webp'); 
  const doorLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/door_left_painted.webp'); 
  const handleLeftPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_left_painted.webp');
  const handleRightPaintedTexture = useTexture(isMobileDevice ? dummyTex : '/textures/doors/handle_right_painted.webp');
  const doorBackTexture = useTexture(isMobileDevice ? '/textures/doors/door_back.webp' : '/textures/doors/door_back_left_sketch.webp'); //urd tal ni hereggyu
  const edgeTexture = useTexture(isMobileDevice ? '/textures/doors/pien_sketch.webp' : '/textures/doors/pien.webp');
  const bricksTexture = useTexture('/textures/entrance/wall_bricks_2.webp');
  const stonePathTexture = useTexture('/textures/entrance/stone-path.webp');
  const catFrontBodyTexture = useTexture('/textures/entrance/cat2.png'); 
  const windowSketchTexture = useTexture('/textures/entrance/window_sketch2.png');
  const treeTexture = useTexture('/textures/entrance/tree22.png'); 
  const mouseTexture = useTexture('/textures/entrance/mouse24.png'); 
  const potTexture = useTexture('/textures/entrance/duck_pot1.png'); 

  const handleHideDelayRef = useRef();
  
    
   
  
  const doorWidth = 0.94;
  const doorHeight = 2.4;
  const doorOpeningWidth = doorWidth * 2;
  const wallThickness = 0.07;
  const frameWidth = doorOpeningWidth + 0.16;
  const frameHeight = frameWidth * (877 / 718);
  const floorY = -1.75;
  const doorBottomY = floorY;
  const doorCenterY = doorBottomY + doorHeight / 2;
  const wallCenterY = floorY + corridorHeight / 2;
  const topWallHeight = corridorHeight - doorHeight;
  const topWallCenterY = doorBottomY + doorHeight + topWallHeight / 2;
  const sideWallWidth = (corridorWidth - doorOpeningWidth) / 2;


  const handleClick = e => {
    e.stopPropagation();
    if (isOpen || isAnimating) return;
    document.body.style.cursor = "auto";
    setIsOpen(true);
    setIsAnimating(true);
    unlockAchievement('corridor_enter');
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      }
    });
    if (leftHandleRef.current) {
      tl.to(leftHandleRef.current.rotation, {
        z: 0.4,
        duration: 0.15,
        ease: 'power2.out'
      }, 0);
    }
    if (rightHandleRef.current) {
      tl.to(rightHandleRef.current.rotation, {
        z: -0.4,
        duration: 0.15,
        ease: 'power2.out'
      }, 0);
    }
    tl.to(leftDoorRef.current.rotation, {
      y: -Math.PI * 0.55,
      duration: 0.9,
      ease: 'power2.out'
    }, 0.1);
    tl.to(rightDoorRef.current.rotation, {
      y: Math.PI * 0.55,
      duration: 0.9,
      ease: 'power2.out'
    }, 0.1);
    tl.to(camera.position, {
      z: 11,
      y: 0.2,
      duration: 1.8,
      ease: 'power2.inOut'
    }, 0.3);
  };

  const handlePointerEnter = () => {
    if (isOpen || isAnimating || isMobile) return;
    setIsHovered(true);
    document.body.style.cursor = "pointer";
    gsap.to(leftDoorRef.current.rotation, {
      y: -0.08,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: true
    });
    gsap.to(rightDoorRef.current.rotation, {
      y: 0.08,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: true
    });
    if (leftHandleRef.current) {
      gsap.to(leftHandleRef.current.rotation, {
        z: 0.1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (rightHandleRef.current) {
      gsap.to(rightHandleRef.current.rotation, {
        z: -0.1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true
      });
    }

    if (rightDoorMaterialRef.current) {
      gsap.to(rightDoorMaterialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (leftDoorMaterialRef.current) {
      gsap.to(leftDoorMaterialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (leftHandleMaterialRef.current) {
      gsap.to(leftHandleMaterialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (rightHandleMaterialRef.current) {
      gsap.to(rightHandleMaterialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (handleHideDelayRef.current) handleHideDelayRef.current.kill();
    if (leftHandlePaintedRef.current) leftHandlePaintedRef.current.visible = true;
    if (rightHandlePaintedRef.current) rightHandlePaintedRef.current.visible = true;
  };
  const handlePointerLeave = () => {
    if (isOpen || isAnimating || isMobile) return;
    setIsHovered(false);
    document.body.style.cursor = "auto";
    gsap.to(leftDoorRef.current.rotation, {
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: true
    });
    gsap.to(rightDoorRef.current.rotation, {
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: true
    });
    if (leftHandleRef.current) {
      gsap.to(leftHandleRef.current.rotation, {
        z: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (rightHandleRef.current) {
      gsap.to(rightHandleRef.current.rotation, {
        z: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (rightDoorMaterialRef.current) {
      gsap.to(rightDoorMaterialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (leftDoorMaterialRef.current) {
      gsap.to(leftDoorMaterialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (leftHandleMaterialRef.current) {
      gsap.to(leftHandleMaterialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (rightHandleMaterialRef.current) {
      gsap.to(rightHandleMaterialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    handleHideDelayRef.current = gsap.delayedCall(0.55, () => {
      if (leftHandlePaintedRef.current) leftHandlePaintedRef.current.visible = false;
      if (rightHandlePaintedRef.current) rightHandlePaintedRef.current.visible = false;
    });
  };



  const mousePivotRef = useRef();
  useFrame(({
    clock
  }) => {
    if (mousePivotRef.current) {
      mousePivotRef.current.rotation.x = Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }
  });

  const frameCenterY = doorBottomY + frameHeight / 2;
  const facadeYOffset = -1.65;
  const pathWidth = frameWidth + 0.4;
  const pathLength = 6.5;

  return <group ref={groupRef} position={[position[0], 0, position[2]]}>

            {}
            {}
            <mesh position={[0, floorY + 0.02, pathLength / 1.9]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[pathWidth, pathLength]} />
                 <meshBasicMaterial color="#B1A69B" map={stonePathTexture} transparent={true} alphaTest={0.5} />
            </mesh>


            {}
            <mesh position={[-(doorOpeningWidth / 2 + sideWallWidth / 2), wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95} />
            </mesh>

            {}
            <mesh position={[doorOpeningWidth / 2 + sideWallWidth / 2, wallCenterY, 0]}>
                <boxGeometry args={[sideWallWidth, corridorHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95}  />
            </mesh>

            {}
            <mesh position={[0, topWallCenterY, 0]}>
                <boxGeometry args={[doorOpeningWidth, topWallHeight, wallThickness]} />
                <meshBasicMaterial color="#e0e0e0" roughness={0.95} />
            </mesh>

            {}
            {}
            <mesh position={[0, wallCenterY + facadeYOffset + 1.65, 0.15]}>
                {}
                <planeGeometry args={[16., 8]} />
                <meshBasicMaterial color="#fdf4f0" map={bricksTexture} transparent={true} alphaTest={0.01} roughness={1.0} />
            </mesh>

            {}
            <mesh position={[0, frameCenterY, 0.12]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#D2B48C" map={frameTexture} transparent={true} alphaTest={0.1} roughness={0.9} depthWrite={false} />
            </mesh>

            {}
            <group ref={leftDoorRef} position={[-doorWidth, doorCenterY, 0]}>
                {}
                <mesh position={[doorWidth / 2, 0, 0.06]} onClick={handleClick} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {}
                {!isMobile && <mesh position={[doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0" map={doorLeftPaintedTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                    </mesh>}

                {}
                <mesh position={[doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#e0e0e0" ref={leftDoorMaterialRef} map={doorLeftPaintedTexture} transparent={true} alphaTest={0.5} roughness={0.8} depthWrite={false} uProgress={0.0} />
                </mesh>

                {}
                <mesh position={[doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorBackTexture} transparent={true} alphaTest={0.5} roughness={0.8} side={2} />
                </mesh>

                {}
                <group ref={leftHandleRef} position={[doorWidth / 2 + 0.357, -0.099, 0.10]}>
                    {}
                    {!isMobile && <mesh ref={leftHandlePaintedRef} position={[-0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#e0e0e0" map={handleLeftPaintedTexture} transparent={true} alphaTest={0.5} depthWrite={false} />
                        </mesh>}
                    {}
                    <mesh position={[-0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#e0e0e0" ref={leftHandleMaterialRef} map={handleLeftPaintedTexture} transparent={true} alphaTest={0.5} depthWrite={false} uProgress={0.0} />
                    </mesh>
                </group>
            </group>

            {}
            <group ref={rightDoorRef} position={[doorWidth, doorCenterY, 0]}>
                {}
                <mesh position={[-doorWidth / 2, 0, 0.06]} onClick={handleClick} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
                    <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
                    <meshBasicMaterial color="#e0e0e0" map={edgeTexture} roughness={0.9} />
                </mesh>

                {}
                {!isMobile && <mesh position={[-doorWidth / 2, 0, 0.088]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <meshBasicMaterial color="#e0e0e0" map={doorRightPaintedTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                    </mesh>}

                {}
                <mesh position={[-doorWidth / 2, 0, 0.09]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <revealMaterial color="#e0e0e0" ref={rightDoorMaterialRef} map={doorRightPaintedTexture} transparent={true} alphaTest={0.5} roughness={0.8} depthWrite={false} uProgress={0.0} />
                </mesh>

                {}
                <mesh position={[-doorWidth / 2, 0, 0.03]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={doorBackTexture} transparent={true} alphaTest={0.5} roughness={0.8} />
                </mesh>

                {}
                <group ref={rightHandleRef} position={[-doorWidth / 2 - 0.357, -0.099, 0.10]}>
                    {}
                    {!isMobile && <mesh ref={rightHandlePaintedRef} position={[0.357, 0.09, -0.001]} visible={false}>
                            <planeGeometry args={[doorWidth, doorHeight]} />
                            <meshBasicMaterial color="#e0e0e0" map={handleRightPaintedTexture} transparent={true} alphaTest={0.5} depthWrite={false} />
                        </mesh>}
                    {}
                    <mesh position={[0.357, 0.099, 0]}>
                        <planeGeometry args={[doorWidth, doorHeight]} />
                        <revealMaterial color="#e0e0e0" ref={rightHandleMaterialRef} map={handleRightPaintedTexture} transparent={true} alphaTest={0.5} depthWrite={false} uProgress={0.0} />
                    </mesh>
                </group>
            </group>

            {}
            {}
            {}

            {}
            <group position={[2.5, 0, 0.1]}>
                  
                {}
                
                <mesh position={[0, 0, 0.2]}>
                    <planeGeometry args={[1.5, 1.5]} />
                    <meshBasicMaterial color="#e0e0e0" map={windowSketchTexture} transparent={true} />
                </mesh>
            </group>

            {}
    

            {}
          

            {}
           

            {}
            


            {}
            <group position={[-2.9, floorY + 2.7, 1]}>
                {}
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[6, 8]} />
                    <meshBasicMaterial color="#e0e0e0" map={treeTexture} transparent={true} alphaTest={0.01} depthWrite={false} />
                </mesh>
                {}
                {}
                {}
                {}
                {}
                {}
                <group ref={mousePivotRef} position={[0.341, 0.02 - 0.456, 0]}>
                    {}
                    <mesh position={[0.7, -0.8, 1]}>
                        <planeGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial color="#A9A9A9" map={mouseTexture} transparent={true} alphaTest={0.01} depthWrite={false} />
                    </mesh>
                </group>
            </group>

            {}

             <group position={[2.4, floorY + 0.3, 0.4]}>
                {}
                <mesh>
                    <planeGeometry args={[2.7, 2]} />
                    <meshBasicMaterial color="#e0e0e0" map={potTexture} transparent={true} alphaTest={0.01} depthWrite={false} />
                </mesh>

                {}
                

                {}
              
            </group>

              <group position={[-1.5, floorY + 0.6, 0.8]}>
                {}
                <mesh>
                    <planeGeometry args={[2.2, 1.8]} />
                    <meshBasicMaterial color="#e0e0e0" map={catFrontBodyTexture} transparent={true} alphaTest={0.01} depthWrite={false} />
                </mesh>

                {}
               
                {}
              
            </group>

        </group>;
};
export default EntranceDoors;
