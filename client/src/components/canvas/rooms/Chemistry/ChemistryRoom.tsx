import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { CONTENT_DATA, PLATFORM_CONFIG, getLatestContent } from './contentData';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { TextureLoader } from 'three';
import { PositionalAudio } from '@react-three/drei';
import { useAudio } from '../../../../context/AudioManager';
import '../../shaders/RevealMaterial';
import { isTouchDevice } from '../../../../utils/deviceDetect';
import { usePaintMaterial } from './usePaintMaterial';
import ChemistryBackground from './ChemistryBackground';
const STUDIO_PAINT_CONFIG = {
  dirX: 0.0,
  dirY: -1.0,
  dirZ: 0.0,
  startDist: -10.0,
  endDist: 10.0,
  noiseAxes: 'xz'
};
export const AUDIO_SETTINGS = {
  volume: 1,
  distance: 2,
  rolloff: 1.0
};
const CAMERA_Y_OFFSET = -6;
const CAMERA_ZOOM_DISTANCE = 3;
const CAMERA_PAN_RIGHT = 1;
const TOWER_RADIUS = 2.2;
const MONITORS_PER_RING = 4;
const FALL_SPEED = 0.3;
const TOWER_HEIGHT = 12;
const VERTICAL_SPACING = 2.5;
const TOWER_Y_START = -5;
const TOWER_Z_START = -10;
const ChemistryRoom = ({
  showRoom,
  onReady,
  isExiting,
  isWarmup
}) => {
  const groupRef = useRef();
  const towerRef = useRef();
  const {
    camera,
    size
  } = useThree();
  const responsiveParams = useMemo(() => {
    const isMobile = size.width < 768;
    const isTablet = size.width < 1024 && size.width >= 768;
    return {
      zoomDistance: isMobile ? 2 : isTablet ? 3 : CAMERA_ZOOM_DISTANCE,
      panRight: isMobile ? 0 : isTablet ? 0.5 : Math.max(0.3, size.width / 1920 * CAMERA_PAN_RIGHT),
      panDown: isMobile ? 9.7 : 0,
      yOffset: isMobile ? 2.5 : isTablet ? -3 : CAMERA_Y_OFFSET,
      towerRadius: isMobile ? 1.5 : isTablet ? 1.8 : TOWER_RADIUS,
      isMobile
    };
  }, [size.width]);
  const originalCameraY = useRef(null);
  const originalCameraZ = useRef(null);
  const originalCameraX = useRef(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const dragDistance = useRef(0);
  const rotationVelocity = useRef(0);
  const autoRotationSpeed = useRef(0.12);
  const DRAG_SENSITIVITY = 0.008;
  const FRICTION = 0.98;
  const fallSpeed = useRef(FALL_SPEED);
  const BASE_FALL_SPEED = FALL_SPEED;
  const SCROLL_SENSITIVITY = 0.006;
  const SWIPE_SENSITIVITY = 0.005;
  const SPEED_DECAY = 0.985;
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const {
    openOverlay,
    overlayContent,
    isTeleporting
  } = useScene();
  const {
    showTutorial,
    unlockAchievement,
    hidePopup
  } = useAchievements();
  const {
    globalVolume,
    isMuted
  } = useAudio();
  const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;
  const audioRef = useRef();
  useEffect(() => {
    if (audioRef.current && audioRef.current.setVolume) {
      audioRef.current.setVolume(effectiveVolume);
    }
  }, [effectiveVolume]);
  useEffect(() => {
    if (isExiting || isTeleporting) {
      hidePopup();
    }
  }, [isExiting, isTeleporting, hidePopup]);
  const {
    onBeforeCompile: paintOnBeforeCompile,
    animatePaint,
    resetPaint,
    uniformsData: paintUniforms,
    updateRoomOrigin
  } = usePaintMaterial(STUDIO_PAINT_CONFIG);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wasTeleportedRef = useRef(false);
  useEffect(() => {
    if (isTeleporting) wasTeleportedRef.current = true;
  }, [isTeleporting]);
  useEffect(() => {
    if (showRoom && !isWarmup) {
      if (wasTeleportedRef.current || isTeleporting) {
        paintUniforms.uPaintProgress.value = 1.0;
        setIsTransitioning(false);
      } else {
        setIsTransitioning(true);
        resetPaint();
        animatePaint(0.2, 2.5);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 2700);
      }
    } else {
      paintUniforms.uPaintProgress.value = 1.0;
    }
  }, [showRoom, isWarmup, isTeleporting]);
  const latestContent = getLatestContent();
  const monitorOffsets = useRef([]);
  const monitorRefs = useRef([]);
  const particleTowerRotation = useRef(0);
  const particleFallOffset = useRef(0);
  const hasSignaledReady = useRef(false);
  const frameCount = useRef(0);
  const FRAMES_TO_WAIT = 5;
  useFrame(() => {
    updateRoomOrigin(groupRef);
    if (hasSignaledReady.current) return;
    frameCount.current++;
    if (frameCount.current >= FRAMES_TO_WAIT) {
      hasSignaledReady.current = true;
      onReady?.();
      if (!isWarmup) setTimeout(() => showTutorial('studio_interact'), 2000);
    }
  });
  const monitorData = useMemo(() => {
    const items = [];
    const shuffledContent = [...CONTENT_DATA].sort(() => 0.5 - Math.random());
    const totalMonitors = shuffledContent.length;
    const ringsNeeded = Math.ceil(totalMonitors / MONITORS_PER_RING);
    let contentIndex = 0;
    const currentRadius = responsiveParams.towerRadius;
    for (let ring = 0; ring < ringsNeeded && contentIndex < shuffledContent.length; ring++) {
      const angleStep = Math.PI * 2 / MONITORS_PER_RING;
      const angleOffset = ring % 2 === 0 ? 0 : angleStep / 2;
      for (let i = 0; i < MONITORS_PER_RING && contentIndex < shuffledContent.length; i++) {
        const contentItem = shuffledContent[contentIndex];
        const platform = PLATFORM_CONFIG[contentItem.platform];
        const angle = i * angleStep + angleOffset;
        const x = Math.cos(angle) * currentRadius;
        const z = Math.sin(angle) * currentRadius;
        const baseY = ring * VERTICAL_SPACING;
        const yJitter = (Math.sin(contentIndex * 1.7) + Math.cos(contentIndex * 2.3)) * 0.4;
        const finalY = baseY + yJitter;
        let width, height, depth;
        switch (platform.shape) {
          case 'tv':
            width = 1.6;
            height = 1.187;
            depth = 1.0;
            break;
          case 'monitor':
            width = 1.6;
            height = 1;
            depth = 0.15;
            break;
          case 'phone':
            width = 0.6;
            height = 1.139;
            depth = 0.1;
            break;
          default:
            width = 1.4;
            height = 1.0;
            depth = 0.6;
        }
        items.push({
          ...contentItem,
          index: contentIndex,
          x,
          baseY: finalY,
          z,
          width,
          height,
          depth,
          angle: angle,
          rot: -angle + Math.PI / 2,
          platformConfig: platform,
          isLatest: contentItem.id === latestContent.id
        });
        contentIndex++;
      }
    }
    monitorOffsets.current = items.map(() => 0);
    const minBaseY = items.length > 0 ? Math.min(...items.map(m => m.baseY)) : 0;
    const maxBaseY = items.length > 0 ? Math.max(...items.map(m => m.baseY)) : 0;
    const totalHeight = Math.max(VERTICAL_SPACING * 3, maxBaseY - minBaseY + VERTICAL_SPACING);
    return {
      items,
      totalHeight
    };
  }, [latestContent.id, responsiveParams.towerRadius]);
  const monitors = monitorData.items;
  const totalHeight = monitorData.totalHeight;
  const lastYRef = useRef(0);
  const handlePointerDown = e => {
    if (isAnimating) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    dragDistance.current = 0;
    rotationVelocity.current = 0;
    document.body.style.cursor = 'grabbing';
  };
  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'auto';
  }, []);
  const handlePointerMove = useCallback(e => {
    if (!isDraggingRef.current || !towerRef.current || isAnimating) return;
    const clientX = e.clientX || e.touches && e.touches[0]?.clientX;
    const clientY = e.clientY || e.touches && e.touches[0]?.clientY;
    if (!clientX || !clientY) return;
    const deltaX = clientX - lastXRef.current;
    const deltaY = clientY - lastYRef.current;
    lastXRef.current = clientX;
    lastYRef.current = clientY;
    dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);
    if (Math.abs(deltaX) > 1) {
      autoRotationSpeed.current = Math.sign(deltaX) * 0.12;
    }
    rotationVelocity.current = deltaX * DRAG_SENSITIVITY;
    towerRef.current.rotation.y += rotationVelocity.current;
    fallSpeed.current += deltaY * SWIPE_SENSITIVITY;
    unlockAchievement('studio_interact');
  }, [isAnimating, unlockAchievement]);
  useEffect(() => {
    const handleWheel = e => {
      fallSpeed.current += e.deltaY * SCROLL_SENSITIVITY;
      unlockAchievement('studio_interact');
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [unlockAchievement]);
  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [handlePointerUp, handlePointerMove]);
  const handleMonitorClick = useCallback(item => {
    if (dragDistance.current > 5 || isAnimating || !towerRef.current) return;
    setIsAnimating(true);
    setSelectedMonitor(item);
    rotationVelocity.current = 0;
    unlockAchievement('studio_interact');
    const monitorFacingRotation = item.rot;
    let targetRotation = -monitorFacingRotation;
    let currentRotation = towerRef.current.rotation.y % (Math.PI * 2);
    if (currentRotation < 0) currentRotation += Math.PI * 2;
    while (targetRotation < 0) targetRotation += Math.PI * 2;
    targetRotation = targetRotation % (Math.PI * 2);
    let delta = targetRotation - currentRotation;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    const finalRotation = towerRef.current.rotation.y + delta;
    gsap.to(towerRef.current.rotation, {
      y: finalRotation,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        if (originalCameraY.current === null) {
          originalCameraY.current = camera.position.y;
        }
        const monitorCurrentY = item.baseY + (monitorOffsets.current[item.index] || 0);
        const monitorWorldY = -1.2 + monitorCurrentY + responsiveParams.yOffset;
        if (originalCameraZ.current === null) {
          originalCameraZ.current = camera.position.z;
          originalCameraX.current = camera.position.x;
        }
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3();
        right.crossVectors(forward, up).normalize();
        const zoomDist = responsiveParams.zoomDistance;
        const panRight = responsiveParams.panRight;
        const panDown = responsiveParams.panDown;
        const targetX = camera.position.x + forward.x * zoomDist + right.x * panRight;
        const targetZ = camera.position.z + forward.z * zoomDist + right.z * panRight;
        const targetY = monitorWorldY - panDown;
        gsap.to(camera.position, {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            setIsAnimating(false);
            openOverlay(item);
          }
        });
      }
    });
  }, [isAnimating, camera, responsiveParams, openOverlay]);
  const prevOverlayContent = useRef(null);
  useEffect(() => {
    if (prevOverlayContent.current && !overlayContent && selectedMonitor && !isAnimating) {
      handleReturnCamera();
    }
    prevOverlayContent.current = overlayContent;
  }, [overlayContent, selectedMonitor, isAnimating]);
  const handleReturnCamera = useCallback(() => {
    setIsAnimating(true);
    if (originalCameraX.current !== null && originalCameraY.current !== null && originalCameraZ.current !== null) {
      gsap.to(camera.position, {
        x: originalCameraX.current,
        y: originalCameraY.current,
        z: originalCameraZ.current,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          setIsAnimating(false);
          setSelectedMonitor(null);
        }
      });
    } else {
      setIsAnimating(false);
      setSelectedMonitor(null);
    }
  }, [camera]);
  useFrame((state, delta) => {
    if (!towerRef.current) return;
    if (!isDraggingRef.current && !isAnimating && !selectedMonitor) {
      towerRef.current.rotation.y += autoRotationSpeed.current * delta + rotationVelocity.current;
      rotationVelocity.current *= FRICTION;
      const targetDrift = fallSpeed.current > 0 ? BASE_FALL_SPEED : -BASE_FALL_SPEED;
      fallSpeed.current = THREE.MathUtils.lerp(fallSpeed.current, targetDrift, 1.0 - SPEED_DECAY);
      monitors.forEach((monitor, index) => {
        monitorOffsets.current[index] -= fallSpeed.current * delta;
        const currentY = monitor.baseY + monitorOffsets.current[index];
        if (currentY < -2 && fallSpeed.current > 0) {
          monitorOffsets.current[index] += totalHeight;
        } else if (currentY > totalHeight - 2 && fallSpeed.current < 0) {
          monitorOffsets.current[index] -= totalHeight;
        }
        const ref = monitorRefs.current[index];
        if (ref) {
          ref.position.y = monitor.baseY + monitorOffsets.current[index];
        }
      });
      particleTowerRotation.current = towerRef.current.rotation.y;
      particleFallOffset.current = fallSpeed.current;
    }
  });
  return <group ref={groupRef} position={[0, -1.2, 0]}>
            {!isWarmup && <PositionalAudio ref={audioRef} url="/sounds/szummonitorow.mp3" distanceModel="exponential" refDistance={AUDIO_SETTINGS.distance} rolloffFactor={AUDIO_SETTINGS.rolloff} loop autoplay volume={effectiveVolume} />}

            <ChemistryBackground />

            {}
            <group ref={towerRef} position={[0, TOWER_Y_START, TOWER_Z_START]} onPointerDown={handlePointerDown}>
                {}
                <mesh visible={false}>
                    <cylinderGeometry args={[responsiveParams.towerRadius + 0.5, responsiveParams.towerRadius + 0.5, TOWER_HEIGHT * 1.5, 16]} />
                    <meshBasicMaterial color="#e0e0e0" />
                </mesh>

                {monitors.map((item, index) => <MonitorBlock key={item.id} item={item} index={index} meshRef={el => {
        monitorRefs.current[index] = el;
      }} isSelected={selectedMonitor?.id === item.id} onMonitorClick={handleMonitorClick} disabled={isAnimating} paintOnBeforeCompile={paintOnBeforeCompile} paintUniforms={paintUniforms} />)}
            </group>

            {}
            {/* <FloatingCodeParticles towerRotationRef={particleTowerRotation} fallOffsetRef={particleFallOffset} /> */}
        </group>;
};
const MonitorBlock = memo(({
  item,
  meshRef,
  isSelected,
  onMonitorClick,
  disabled,
  paintOnBeforeCompile,
  paintUniforms
}) => {
  const paintedBoxRef = useRef();
  const hideDelayRef = useRef();
  const matRef0 = useRef();
  const matRef1 = useRef();
  const matRef2 = useRef();
  const matRef3 = useRef();
  const matRef4 = useRef();
  const matRef5 = useRef();
  const matRefs = [matRef0, matRef1, matRef2, matRef3, matRef4, matRef5];
  const isBlogMonitor = item.platform === 'turshilt';
  const isTvMonitor = item.platform === 'molecules';
  const isPhoneMonitor = item.platform === 'periodicTable';
  const frontTextureUrl = item.frontTexture || (isBlogMonitor ? '/textures/studio/monitor_front.webp' : isTvMonitor ? '/textures/studio/tv_front.webp' : '/textures/studio/phone_front.webp');
  const isTouch = isTouchDevice();
  const dummyTex = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const paintedFrontTextureUrl = isTouch ? dummyTex : item.paintedFrontTexture || (isBlogMonitor ? '/textures/studio/monitor_front_painted.webp' : isTvMonitor ? '/textures/studio/tv_front_painted.webp' : '/textures/studio/phone_front_painted.webp');
  const frontTex = useLoader(TextureLoader, frontTextureUrl);
  const frontPaintedTex = useLoader(TextureLoader, paintedFrontTextureUrl);
  const monitorBack = useLoader(TextureLoader, '/textures/studio/monitor_back.webp');
  const monitorTop = useLoader(TextureLoader, '/textures/studio/monitor_top.webp');
  const monitorBottom = useLoader(TextureLoader, '/textures/studio/monitor_bottom.webp');
  const monitorLeft = useLoader(TextureLoader, '/textures/studio/monitor_left.webp');
  const monitorRight = useLoader(TextureLoader, '/textures/studio/monitor_right.webp');
  const monitorBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_back_painted.webp');
  const monitorTopPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_top_painted.webp');
  const monitorBottomPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_bottom_painted.webp');
  const monitorLeftPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_left_painted.webp');
  const monitorRightPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/monitor_right_painted.webp');
  const tvBack = useLoader(TextureLoader, '/textures/studio/tv_back.webp');
  const tvTop = useLoader(TextureLoader, '/textures/studio/tv_top.webp');
  const tvBottom = useLoader(TextureLoader, '/textures/studio/tv_bottom.webp');
  const tvSide = useLoader(TextureLoader, '/textures/studio/tv_side.webp');
  const tvFront = useLoader(TextureLoader, '/textures/studio/tv_front.webp');
  const moleculesFull = useLoader(TextureLoader, '/textures/studio/molecules_full.png');
  const tvBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_back_painted.webp');
  const tvTopPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_top_painted.webp');
  const tvBottomPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_bottom_painted.webp');
  const tvSidePainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_side_painted.webp');
  const tvFrontPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/tv_front_painted.webp');
  const phoneBack = useLoader(TextureLoader, '/textures/studio/phone_back.webp');
  const phoneSide = useLoader(TextureLoader, '/textures/studio/phone_side.webp');
  const phoneBackPainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/phone_back_painted.webp');
  const phoneSidePainted = useLoader(TextureLoader, isTouch ? dummyTex : '/textures/studio/phone_side_painted.webp');
  const faceConfig = useMemo(() => {
    if (isBlogMonitor) {
      return [{
        sketch: monitorRight,
        painted: monitorRightPainted
      }, {
        sketch: monitorLeft,
        painted: monitorLeftPainted
      }, {
        sketch: monitorTop,
        painted: monitorTopPainted
      }, {
        sketch: monitorBottom,
        painted: monitorBottomPainted
      }, {
        sketch: frontTex,
        painted: frontPaintedTex
      }, {
        sketch: monitorBack,
        painted: monitorBackPainted
      }];
    } else if (isTvMonitor) {
      return [{
        sketch: tvSide,
        painted: tvSidePainted
      }, {
        sketch: tvSide,
        painted: tvSidePainted
      }, {
        sketch: tvTop,
        painted: tvTopPainted
      }, {
        sketch: tvBottom,
        painted: tvBottomPainted
      }, {
        sketch: moleculesFull,
        painted: moleculesFull
      }, {
        sketch: tvBack,
        painted: tvBackPainted
      }];
    } else if (isPhoneMonitor) {
      return [{
        sketch: phoneSide,
        painted: phoneSidePainted
      }, {
        sketch: phoneSide,
        painted: phoneSidePainted
      }, {
        sketch: phoneSide,
        painted: phoneSidePainted
      }, {
        sketch: phoneSide,
        painted: phoneSidePainted
      }, {
        sketch: frontTex,
        painted: frontPaintedTex
      }, {
        sketch: phoneBack,
        painted: phoneBackPainted
      }];
    }
    return null;
  }, [isBlogMonitor, isTvMonitor, isPhoneMonitor, frontTex, frontPaintedTex, monitorBack, monitorTop, monitorBottom, monitorLeft, monitorRight, monitorBackPainted, monitorTopPainted, monitorBottomPainted, monitorLeftPainted, monitorRightPainted, tvBack, tvTop, tvBottom, tvSide, tvFront, tvBackPainted, tvTopPainted, tvBottomPainted, tvSidePainted, tvFrontPainted, phoneBack, phoneSide, phoneBackPainted, phoneSidePainted]);
  const faceColor = useCallback((faceIndex: number) => {
    if (isTvMonitor) {
      if (faceIndex === 4) return '#ffffff';   // molecules front — natural image colors
      return '#b8ddd0';                        // TV frame — soft teal
    }
    if (isBlogMonitor) {
      if (faceIndex === 4) return '#78aad8';   // lab screen — vivid sky blue
      return '#b8cce8';                        // monitor frame — soft blue
    }
    if (isPhoneMonitor) {
      if (faceIndex === 4) return '#d4b84a';   // periodic table screen — warm amber
      return '#e8dca0';                        // phone frame — light gold
    }
    return '#dedad4';
  }, [isTvMonitor, isBlogMonitor, isPhoneMonitor]);

  const paintedMaterials = useMemo(() => {
    if (!faceConfig) return null;
    return faceConfig.map((f, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color: faceColor(i),
        map: f.painted || f.sketch
      });
      if (paintOnBeforeCompile) {
        mat.onBeforeCompile = paintOnBeforeCompile;
        mat.customProgramCacheKey = () => 'paintOnBeforeCompile_studio_painted';
        mat.transparent = true;
        mat.needsUpdate = true;
      }
      return mat;
    });
  }, [faceConfig, paintOnBeforeCompile, faceColor]);
  const sketchMaterials = useMemo(() => {
    if (!faceConfig) return null;
    return faceConfig.map((f, i) => {
      if (f.painted) return null;
      const mat = new THREE.MeshBasicMaterial({
        color: faceColor(i),
        map: f.sketch
      });
      if (paintOnBeforeCompile) {
        mat.onBeforeCompile = paintOnBeforeCompile;
        mat.customProgramCacheKey = () => 'paintOnBeforeCompile_studio_sketch';
        mat.transparent = true;
        mat.needsUpdate = true;
      }
      return mat;
    });
  }, [faceConfig, paintOnBeforeCompile, faceColor]);
  const isHoveredRef = useRef(false);
  const updatePaintState = useCallback(() => {
    if (!faceConfig) return;
    const shouldPaint = !isTouch && (isHoveredRef.current || isSelected);
    const targetProgress = shouldPaint ? 1.0 : 0.0;
    const duration = shouldPaint ? 0.8 : 0.5;
    matRefs.forEach(ref => {
      if (ref.current) {
        gsap.to(ref.current, {
          uProgress: targetProgress,
          duration,
          ease: 'power2.out',
          overwrite: true
        });
      }
    });
    if (shouldPaint) {
      if (hideDelayRef.current) hideDelayRef.current.kill();
      if (paintedBoxRef.current) paintedBoxRef.current.visible = true;
    } else {
      const delay = hideDelayRef.current === undefined ? 0.05 : duration + 0.05;
      hideDelayRef.current = gsap.delayedCall(delay, () => {
        if (paintedBoxRef.current) paintedBoxRef.current.visible = false;
      });
    }
  }, [faceConfig, isSelected, isTouch]);
  useEffect(() => {
    updatePaintState();
  }, [isSelected, updatePaintState]);
  if (!faceConfig) {
    return <group ref={meshRef} position={[item.x, item.baseY, item.z]} rotation={[0, item.rot, 0]}>
                <mesh>
                    <boxGeometry args={[item.width, item.height, item.depth]} />
                    <meshBasicMaterial color={item.platformConfig.color} />
                </mesh>
            </group>;
  }
  return <group ref={meshRef} position={[item.x, item.baseY, item.z]} rotation={[0, item.rot, 0]} onPointerOver={e => {
    if (disabled) return;
    e.stopPropagation();
    isHoveredRef.current = true;
    updatePaintState();
    document.body.style.cursor = 'pointer';
  }} onPointerOut={() => {
    isHoveredRef.current = false;
    updatePaintState();
    document.body.style.cursor = 'auto';
  }} onPointerUp={e => {
    if (disabled) return;
    e.stopPropagation();
    onMonitorClick(item);
  }}>
            {}
            <mesh ref={paintedBoxRef} visible={true}>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                {paintedMaterials.map((mat, i) => <primitive key={`p${i}`} attach={`material-${i}`} object={mat} />)}
            </mesh>

            {}
            <mesh>
                <boxGeometry args={[item.width, item.height, item.depth]} />
                {faceConfig.map((face, i) => {
        if (face.painted) {
          return <revealMaterial color={faceColor(i)} key={`s${i}`} ref={matRefs[i]} attach={`material-${i}`} map={face.sketch} transparent={true} alphaTest={0.1} paintUniforms={paintUniforms} paintConfig={STUDIO_PAINT_CONFIG} uProgress={0.0} />;
        } else {
          return <primitive key={`s${i}`} attach={`material-${i}`} object={sketchMaterials[i]} />;
        }
      })}
            </mesh>

        </group>;
});
export default ChemistryRoom;
