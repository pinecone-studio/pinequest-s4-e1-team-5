import { useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useTexture, Float, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Observer } from 'gsap/all';
import { useScene } from '../../../../context/SceneContext';
gsap.registerPlugin(Observer);
import { useAchievements } from '../../../../context/AchievementsContext';
import PaperMaterial from './PaperMaterial';
import GalleryClouds from './GalleryClouds';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';
const _tempScale = new THREE.Vector3();
export const AUDIO_SETTINGS = {
  volume: 0.6,
  distance: 2,
  rolloff: 1.5
};
export const GALLERY_INTERACTION_AUDIO_SETTINGS = {
  volume: 0.6,
  distance: 2,
  rolloff: 2
};
const UNIQUE_PROJECTS = [{
  id: 'monetune',
  title: 'MONETUNE',
  front: '/textures/gallery/monetuneprzod.webp',
  painted: '/textures/gallery/monetuneprzod_painted.webp',
  url: 'https://monetune.pl',
  description: 'MoneTune is a step-by-step blueprint that teaches beginners how to generate passive income using AI-created music. Without any musical skills, you will learn how to easily produce professional tracks, publish them on platforms like Spotify, and monetize your digital assets.',
  techStack: ['/textures/gallery/wordpresslogo.webp', '/textures/gallery/elementorlogo.webp', '/textures/gallery/phplogo.webp', '/textures/gallery/csslogo.webp']
}, {
  id: 'timber',
  title: 'TIMBERKITTY',
  front: '/textures/gallery/timberkittyprzod.webp',
  painted: '/textures/gallery/timberkittyprzod_painted.webp',
  url: 'https://timberkitty.netlify.app',
  description: 'TimberKitty is an addictive, free-to-play browser arcade game built in pure JavaScript. Players control a lumberjack cat to chop wood, save birds, complete daily missions, and compete on global leaderboards.',
  techStack: ['/textures/gallery/jslogo.webp', '/textures/gallery/htmllogo.webp', '/textures/gallery/csslogo.webp', '/textures/gallery/firebaselogo.webp']
}, {
  id: 'young',
  title: 'YOUNG MULTI',
  front: '/textures/gallery/youngmultiprzod.webp',
  painted: '/textures/gallery/youngmultiprzod_painted.webp',
  url: 'https://young-multi-strona.netlify.app',
  description: 'A sleek, modern concept website dedicated to the Polish rapper and creator Young Multi. It serves as a promotional landing page designed to highlight his personal brand, music, and online presence.',
  techStack: ['/textures/gallery/reactlogo.webp', '/textures/gallery/tailwindlogo.webp', '/textures/gallery/htmllogo.webp', '/textures/gallery/netlifylogo.webp']
}, {
  id: 'bio',
  title: 'BIO',
  front: '/textures/gallery/bioprzod.webp',
  painted: '/textures/gallery/bioprzod_painted.webp',
  url: 'https://tomkingbio.netlify.app',
  description: 'A fast, modern personal bio page serving as a central hub for my digital footprint. It showcases my latest coding projects, web development services, YouTube videos, and recommended music artists.',
  techStack: ['/textures/gallery/htmllogo.webp', '/textures/gallery/csslogo.webp', '/textures/gallery/jslogo.webp', '/textures/gallery/netlifylogo.webp']
}];
const PROJECT_COUNT = 10;
const GAP = 2.5;
const BIRD_WIDTH = 0.49;
const BIRD_HEIGHT = 0.35;
const RIGHT_CROP_AMOUNT = 0.2;
const GalleryRoom = ({
  showRoom,
  onReady,
  isExiting,
  isWarmup
}) => {
  const {
    openOverlay,
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
  const groupRef = useRef();
  const [scrollOffset, setScrollOffset] = useState(0);
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [globalIsAnimating, setGlobalIsAnimating] = useState(false);
  const cardRefs = useRef([]);
  useEffect(() => {
    if (isExiting || isTeleporting) {
      hidePopup();
    }
  }, [isExiting, isTeleporting, hidePopup]);
  const {
    onBeforeCompile,
    animatePaint,
    resetPaint,
    uniformsData,
    updateRoomOrigin
  } = usePaintMaterial();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wasTeleportedRef = useRef(false);
  useEffect(() => {
    if (isTeleporting) wasTeleportedRef.current = true;
  }, [isTeleporting]);
  useEffect(() => {
    if (showRoom && !isWarmup) {
      if (wasTeleportedRef.current || isTeleporting) {
        uniformsData.uPaintProgress.value = 1.0;
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
      uniformsData.uPaintProgress.value = 1.0;
    }
  }, [showRoom, isWarmup, isTeleporting]);
  const handleCardClick = async clickedIndex => {
    if (globalIsAnimating || isTransitioning) return;
    unlockAchievement('gallery_inspect');
    if (selectedCard === clickedIndex) {
      setGlobalIsAnimating(true);
      await cardRefs.current[clickedIndex].closeCard();
      setSelectedCard(null);
      setGlobalIsAnimating(false);
    } else if (selectedCard !== null) {
      setGlobalIsAnimating(true);
      await cardRefs.current[selectedCard].closeCard();
      setSelectedCard(null);
      await cardRefs.current[clickedIndex].openCard();
      setSelectedCard(clickedIndex);
      setGlobalIsAnimating(false);
    } else {
      setGlobalIsAnimating(true);
      await cardRefs.current[clickedIndex].openCard();
      setSelectedCard(clickedIndex);
      setGlobalIsAnimating(false);
    }
  };
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
      setTimeout(() => {
        if (!isWarmup) showTutorial('gallery_inspect');
      }, 2000);
    }
  });
  const BALCONY_WIDTH = 5;
  const BALCONY_DEPTH = 3;
  const RAILING_HEIGHT = 1.25;
  const [canHover, setCanHover] = useState(() => typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const handleHoverChange = e => setCanHover(e.matches);
    mq.addEventListener('change', handleHoverChange);
    return () => mq.removeEventListener('change', handleHoverChange);
  }, []);
  const textureUrls = UNIQUE_PROJECTS.map(p => p.front);
  const projectTextures = useTexture(textureUrls);
  const paintedUrls = UNIQUE_PROJECTS.map(p => canHover && p.painted ? p.painted : p.front);
  const paintedTextures = useTexture(paintedUrls);
  const backTextureRaw = useTexture(canHover ? '/textures/gallery/tylkartki_painted.webp' : '/textures/gallery/tylkartki.webp');
  const overlayTextureRaw = useTexture(canHover ? '/textures/gallery/przyciskdotylukartki_painted.webp' : '/textures/gallery/przyciskdotylukartki.webp');
  const allLogos = useMemo(() => {
    const names = ['csslogo', 'elementorlogo', 'firebaselogo', 'htmllogo', 'jslogo', 'netlifylogo', 'phplogo', 'reactlogo', 'tailwindlogo', 'wordpresslogo'];
    return names.map(name => {
      if (!canHover) return `/textures/gallery/${name}.webp`;
      if (name === 'csslogo') return `/textures/gallery/css3logo_painted.webp`;
      return `/textures/gallery/${name}_painted.webp`;
    });
  }, [canHover]);
  useTexture(allLogos);
  const projects = useMemo(() => {
    return Array.from({
      length: PROJECT_COUNT
    }).map((_, i) => {
      const projectIndex = i % UNIQUE_PROJECTS.length;
      const projectData = UNIQUE_PROJECTS[projectIndex];
      const frontTex = projectTextures[projectIndex];
      const paintedTex = paintedTextures[projectIndex];
      if (frontTex) {
        frontTex.colorSpace = THREE.SRGBColorSpace;
      }
      if (paintedTex) {
        paintedTex.colorSpace = THREE.SRGBColorSpace;
      }
      if (backTextureRaw) {
        backTextureRaw.colorSpace = THREE.SRGBColorSpace;
      }
      if (overlayTextureRaw) {
        overlayTextureRaw.colorSpace = THREE.SRGBColorSpace;
      }
      const techStack = projectData.techStack.map(path => {
        if (!canHover) return path;
        const name = path.split('/').pop().replace('.webp', '');
        if (name === 'csslogo') return '/textures/gallery/css3logo_painted.webp';
        return `/textures/gallery/${name}_painted.webp`;
      });
      return {
        ...projectData,
        index: i,
        frontTexture: frontTex,
        paintedTexture: paintedTex !== frontTex && canHover ? paintedTex : null,
        backTexture: backTextureRaw,
        buttonTexture: overlayTextureRaw,
        techStack: techStack
      };
    });
  }, [projectTextures, backTextureRaw, overlayTextureRaw]);
  const scrollToIndex = (index, onComplete) => {
    const totalWidth = PROJECT_COUNT * GAP;
    const targetScrollValue = index * GAP;
    const currentScrollValue = currentScroll.current;
    let diff = targetScrollValue - currentScrollValue;
    const halfWidth = totalWidth / 2;
    while (diff > halfWidth) diff -= totalWidth;
    while (diff < -halfWidth) diff += totalWidth;
    const finalTarget = currentScrollValue + diff;
    gsap.to(targetScroll, {
      current: finalTarget,
      duration: 0.5,
      ease: 'power2.inOut'
    });
    gsap.to(currentScroll, {
      current: finalTarget,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: onComplete
    });
  };
  const lastTouchX = useRef(0);
  useEffect(() => {
    const scrollObserver = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      onWheel: e => {
        if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
        const orig = e.event;
        orig.preventDefault();
        targetScroll.current += orig.deltaY * 0.005;
      },
      onPress: e => {
        if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
        const orig = e.event;
        if (orig.touches && orig.touches.length === 1) {
          lastTouchX.current = orig.touches[0].clientX;
        }
      },
      onDrag: e => {
        if (!showRoom || selectedCard !== null || globalIsAnimating || isTransitioning) return;
        const orig = e.event;
        if (orig.touches && orig.touches.length === 1) {
          const deltaX = lastTouchX.current - orig.touches[0].clientX;
          lastTouchX.current = orig.touches[0].clientX;
          targetScroll.current += deltaX * 0.008;
        }
      }
    });
    return () => scrollObserver.kill();
  }, [showRoom, selectedCard, globalIsAnimating]);
  useFrame((state, delta) => {
    currentScroll.current = THREE.MathUtils.lerp(currentScroll.current, targetScroll.current, delta * 5);
  });
  const floorTexture = useTexture('/textures/gallery/floor.webp');
  const railingTexture = useTexture('/textures/gallery/railing.webp');
  const housesTexture = useTexture('/textures/gallery/domki.webp');
  const cityTexture = useTexture('/textures/gallery/miastotlo.webp');
  const birdTexture = useTexture('/textures/gallery/bird_gray.webp');
  const clothespinTexture = useTexture('/textures/gallery/klamerka.webp');
  useEffect(() => {
    if (floorTexture) {
      floorTexture.wrapS = THREE.MirroredRepeatWrapping;
      floorTexture.wrapT = THREE.MirroredRepeatWrapping;
      floorTexture.repeat.set(0.5, 0.5 * 1.835);
      floorTexture.needsUpdate = true;
    }
    if (railingTexture) {
      railingTexture.wrapS = railingTexture.wrapT = THREE.RepeatWrapping;
      railingTexture.repeat.set(7, 1);
      railingTexture.needsUpdate = true;
    }
  }, [floorTexture, railingTexture]);
  const materials = useMemo(() => {
    const floorMat = new THREE.MeshBasicMaterial({
      map: floorTexture,
      color: '#e0e0e0',
      side: THREE.DoubleSide
    });
    floorMat.onBeforeCompile = onBeforeCompile;
    floorMat.transparent = true;
    floorMat.needsUpdate = true;
    const ropeMat = new THREE.MeshBasicMaterial({
      color: '#666666'
    });
    ropeMat.onBeforeCompile = onBeforeCompile;
    ropeMat.transparent = true;
    ropeMat.needsUpdate = true;
    const thresholdMat = new THREE.MeshBasicMaterial({
      color: '#e0e0e0',
      map: (() => {
        const t = new THREE.TextureLoader().load('/textures/corridor/texturadoprogow.webp');
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(15 / 2.524, 1);
        return t;
      })(),
      side: THREE.DoubleSide
    });
    thresholdMat.onBeforeCompile = onBeforeCompile;
    thresholdMat.transparent = true;
    thresholdMat.needsUpdate = true;
    return {
      floor: floorMat,
      rope: ropeMat,
      threshold: thresholdMat
    };
  }, [floorTexture, onBeforeCompile]);
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([new THREE.Vector3(-16, 3.5, -6), new THREE.Vector3(-8, 2.5, -4.5), new THREE.Vector3(0, 1.8, -3), new THREE.Vector3(8, 2.5, -4.5), new THREE.Vector3(16, 3.5, -6)]);
  }, []);
  const ropeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
  }, [curve]);
  const floorShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.1, -2.0);
    shape.lineTo(1.1, -2.0);
    shape.lineTo(7.5, 4);
    shape.lineTo(-7.5, 4);
    shape.lineTo(-1.1, -2.0);
    return shape;
  }, []);
  return <group ref={groupRef}>
            {!isWarmup && <PositionalAudio ref={audioRef} url="/sounds/szummiasta.mp3" distanceModel="exponential" refDistance={AUDIO_SETTINGS.distance} rolloffFactor={AUDIO_SETTINGS.rolloff} loop autoplay volume={effectiveVolume} />}
            <group position={[0, -0.7, -2]}>
                {}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <shapeGeometry args={[floorShape]} />
                    <primitive object={materials.floor} />
                </mesh>

                {}
                <line rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <bufferGeometry>
                        <float32BufferAttribute attach="attributes-position" count={2} array={new Float32Array([7.5, 4, 0, -7.5, 4, 0])} itemSize={3} />
                    </bufferGeometry>
                    <lineBasicMaterial color="#999999" onBeforeCompile={onBeforeCompile} transparent={true} needsUpdate={true} />
                </line>

                {}
                <mesh position={[0, RAILING_HEIGHT / 2, -3.9]}>
                    <planeGeometry args={[20, RAILING_HEIGHT]} />
                    <meshBasicMaterial color="#e0e0e0" map={railingTexture} transparent={true} side={THREE.DoubleSide} alphaTest={0.1} onBeforeCompile={onBeforeCompile} customProgramCacheKey={() => 'railing-paint'} />
                </mesh>

                {}
                <mesh position={[0, 0.01, -3.9]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[15, 0.15]} />
                    <primitive object={materials.threshold} />
                </mesh>

                {}
                <group position={[0, 1.6, -4]}>
                    <mesh geometry={ropeGeometry} material={materials.rope} />

                    {}
                    {projects.map((project, i) => <ProjectCard key={i} index={i} ref={el => cardRefs.current[i] = el} project={project} clothespinTexture={clothespinTexture} total={PROJECT_COUNT} currentScroll={currentScroll} materials={materials} curve={curve} isSelected={selectedCard === i} scrollToIndex={scrollToIndex} onClick={handleCardClick} isMobile={!canHover} isTransitioning={isTransitioning} paintProgress={uniformsData.uPaintProgress} roomOrigin={uniformsData.uRoomOrigin} />)}
                </group>

                {}
                {}
                <mesh position={[0, -1, -9]} scale={[1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0" map={housesTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} />
                </mesh>
                {}
                <mesh position={[-15, -1, -9]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[15, 15 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0" map={housesTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} />
                </mesh>
                {}
                <RightSideHouses texture={housesTexture} baseWidth={15} baseHeight={15 / 2.357} cropAmount={RIGHT_CROP_AMOUNT} />

                {}
                <mesh position={[0, 3.4, -17]} scale={[1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0" map={cityTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} />
                </mesh>
                {}
                <mesh position={[-30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0" map={cityTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} />
                </mesh>
                {}
                <mesh position={[30, 3.4, -17]} scale={[-1, 1, 1]}>
                    <planeGeometry args={[30, 30 / 2.357]} />
                    <meshBasicMaterial color="#e0e0e0" map={cityTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} onBeforeCompile={onBeforeCompile} />
                </mesh>

                {}
                <FlyingBird texture={birdTexture} />

                {}
                <GalleryClouds count={65} seed={123} />

                {}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} onBeforeCompile={onBeforeCompile} />
                </mesh>
            </group>
        </group>;
};
const FlyingBird = ({
  texture
}) => {
  const birdRef = useRef();
  const startX = -25;
  const endX = 25;
  const speed = 2.5;
  const velocityY = useRef(0);
  const gravity = -12.0;
  const jumpStrength = 5.5;
  const jumpInterval = useRef(0);
  useFrame((state, delta) => {
    if (!birdRef.current) return;
    const safeDelta = Math.min(delta, 0.05);
    birdRef.current.position.x += speed * safeDelta;
    if (birdRef.current.position.x > endX) {
      birdRef.current.position.x = startX;
      birdRef.current.position.y = 4.5;
      velocityY.current = 0;
      jumpInterval.current = 0;
      birdRef.current.rotation.z = 0;
    }
    velocityY.current += gravity * safeDelta;
    birdRef.current.position.y += velocityY.current * safeDelta;
    jumpInterval.current -= safeDelta;
    if (jumpInterval.current <= 0 || birdRef.current.position.y < 3.2) {
      velocityY.current = jumpStrength;
      jumpInterval.current = 0.9 + Math.random() * 0.3;
    }
    if (birdRef.current.position.y < 3.0) {
      birdRef.current.position.y = 3.0;
      velocityY.current = jumpStrength;
    }
    if (birdRef.current.position.y > 6.5) {
      birdRef.current.position.y = 6.5;
      velocityY.current = 0;
    }
    const targetRotationZ = THREE.MathUtils.clamp(velocityY.current * 0.05, -Math.PI / 6, Math.PI / 8);
    birdRef.current.rotation.z = THREE.MathUtils.lerp(birdRef.current.rotation.z, targetRotationZ, safeDelta * 8);
  });
  return <mesh ref={birdRef} position={[startX, 4.5, -10]} scale={[BIRD_WIDTH, BIRD_HEIGHT, 1]}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial color="#e0e0e0" map={texture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>;
};
const ProjectCard = memo(forwardRef(({
  index,
  project,
  clothespinTexture,
  currentScroll,
  materials,
  curve,
  isSelected,
  scrollToIndex,
  onClick,
  isMobile,
  isTransitioning,
  paintProgress,
  roomOrigin
}, ref) => {
  const cardRef = useRef();
  const paperRef = useRef();
  const materialRef = useRef();
  const textRef = useRef();
  const buttonGroupRef = useRef();
  const detailsGroupRef = useRef();
  const techStackGroupRef = useRef();
  const detailsTextRef1 = useRef();
  const detailsTextRef2 = useRef();
  const techTextRef = useRef();
  const openTextRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const swaySpeed = useRef(Math.random() * 0.2 + 0.3);
  const swayOffset = useRef(Math.random() * 100);
  const paperAudioRef = useRef();
  const {
    globalVolume,
    isMuted
  } = useAudio();
  const playPaperSound = () => {
    if (paperAudioRef.current) {
      const vol = isMuted ? 0 : GALLERY_INTERACTION_AUDIO_SETTINGS.volume * globalVolume;
      paperAudioRef.current.setVolume(vol);
      if (paperAudioRef.current.isPlaying) paperAudioRef.current.stop();
      paperAudioRef.current.play();
    }
  };
  useImperativeHandle(ref, () => ({
    closeCard: () => {
      return new Promise(resolve => {
        setIsAnimating(true);
        playPaperSound();
        const timeline = gsap.timeline({
          onComplete: () => {
            setIsAnimating(false);
            resolve();
            if (project.paintedTexture && materialRef.current) {
              gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: 'auto'
              });
            }
          }
        });
        const localBaseY = -1.1;
        timeline.to(paperRef.current.position, {
          y: localBaseY + 0.6,
          x: 0,
          z: 1,
          duration: 0.35,
          ease: 'power2.in'
        });
        timeline.to(paperRef.current.rotation, {
          x: 0.5,
          z: -0.05,
          y: 0,
          duration: 0.35,
          ease: 'power2.in'
        }, '<');
        if (materialRef.current) {
          timeline.to(materialRef.current, {
            bend: 0.6,
            duration: 0.3,
            ease: 'power2.in'
          }, '<');
        }
        timeline.to(paperRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          ease: 'sine.inOut'
        }, '<');
        timeline.to(paperRef.current.position, {
          y: localBaseY,
          x: 0,
          z: 0,
          duration: 0.25,
          ease: 'power3.out'
        });
        timeline.to(paperRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.25,
          ease: 'power3.out'
        }, '<');
        if (materialRef.current) {
          timeline.to(materialRef.current, {
            bend: 0,
            duration: 0.3,
            ease: 'power2.out'
          }, '<');
        }
      });
    },
    openCard: () => {
      return new Promise(resolve => {
        setIsScrolling(true);
        scrollToIndex(index, () => {
          setIsScrolling(false);
          setIsAnimating(true);
          playPaperSound();
          const isMobile = window.innerWidth < 768;
          const targetX_World = 0;
          const targetY_World = isMobile ? -0.2 : 0.1;
          const targetZ_World = isMobile ? 0.5 : 1.5;
          const parentPos = cardRef.current.position;
          const targetX = targetX_World - parentPos.x;
          const targetY = targetY_World - parentPos.y;
          const targetZ = targetZ_World - parentPos.z;
          const timeline = gsap.timeline({
            onComplete: () => {
              setIsAnimating(false);
              resolve();
            }
          });
          timeline.to(cardRef.current.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.3,
            ease: 'power2.out'
          }, 0);
          if (materialRef.current) materialRef.current.bend = 0;
          const localBaseY = -1.1;
          timeline.to(paperRef.current.position, {
            y: localBaseY - 0.5,
            duration: 0.15,
            ease: 'power2.out'
          });
          timeline.to(paperRef.current.rotation, {
            x: 0.5,
            z: -0.05,
            duration: 0.15,
            ease: 'power2.out'
          }, '<');
          if (materialRef.current) {
            timeline.to(materialRef.current, {
              bend: 0.8,
              duration: 0.15,
              ease: 'power2.out'
            }, '<');
            if (project.paintedTexture) {
              gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto'
              });
            }
          }
          timeline.to(paperRef.current.position, {
            y: localBaseY + 1.5,
            x: targetX * 0.2,
            z: targetZ * 0.2,
            duration: 0.4,
            ease: 'power1.out'
          });
          timeline.to(paperRef.current.rotation, {
            x: Math.PI * 0.8,
            z: 0.05,
            y: -0.02,
            duration: 0.4,
            ease: 'power1.inOut'
          }, '<');
          if (materialRef.current) {
            timeline.to(materialRef.current, {
              bend: -0.3,
              duration: 0.4,
              ease: 'power1.inOut'
            }, '<');
          }
          timeline.to(paperRef.current.position, {
            y: targetY,
            x: targetX,
            z: targetZ,
            duration: 0.4,
            ease: 'power3.out'
          });
          timeline.to(paperRef.current.rotation, {
            x: Math.PI,
            y: 0,
            z: 0,
            duration: 0.4,
            ease: 'power3.out'
          }, '<');
          if (materialRef.current) {
            timeline.to(materialRef.current, {
              bend: 0,
              duration: 0.5,
              ease: 'power2.out'
            }, '<');
          }
          timeline.to(paperRef.current.scale, {
            x: 1.1,
            y: 1.1,
            z: 1.1,
            duration: 0.3,
            ease: 'sine.out'
          }, '-=0.4');
        });
      });
    }
  }));
  const handleClick = e => {
    e.stopPropagation();
    if (onClick) onClick(index);
  };
  useEffect(() => {
    if (btnHovered && isSelected) {
      document.body.style.cursor = 'pointer';
    } else if (hovered && !isSelected) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, isSelected, btnHovered]);
  useFrame(state => {
    if (!cardRef.current) return;
    if (textRef.current && paintProgress) {
      const p = paintProgress.value;
      const expectedOpacity = p >= 1.0 ? 1.0 : THREE.MathUtils.clamp((p - 0.3) * 2.0, 0.0, 1.0);
      if (textRef.current.fillOpacity !== expectedOpacity) {
        const applyOpacity = ref => {
          if (ref.current) {
            ref.current.fillOpacity = expectedOpacity;
            if (ref.current.material) {
              ref.current.material.opacity = expectedOpacity;
              ref.current.material.transparent = true;
            }
          }
        };
        applyOpacity(textRef);
        applyOpacity(detailsTextRef1);
        applyOpacity(detailsTextRef2);
        applyOpacity(techTextRef);
        applyOpacity(openTextRef);
      }
    }
    if (textRef.current && materialRef.current) {
      const y = textRef.current.position.y;
      const uBend = materialRef.current.bend;
      const uWindStrength = materialRef.current.windStrength || 0;
      const uTime = state.clock.getElapsedTime();
      const bendAmount = Math.pow(y, 2.0) * uBend;
      const totalWind = 0.02 + uWindStrength;
      const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      textRef.current.position.z = bendAmount + flutter + 0.02;
      const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      textRef.current.rotation.x = Math.atan(dz_dy);
    }
    if (buttonGroupRef.current && materialRef.current) {
      const y = buttonGroupRef.current.position.y;
      const uBend = materialRef.current.bend;
      const uWindStrength = materialRef.current.windStrength || 0;
      const uTime = state.clock.getElapsedTime();
      const bendAmount = Math.pow(y, 2.0) * uBend;
      const totalWind = 0.02 + uWindStrength;
      const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      buttonGroupRef.current.position.z = bendAmount + flutter - 0.03;
      const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      buttonGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);
      const targetScale = btnHovered ? 1.08 : 1;
      buttonGroupRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, 1), 0.15);
    }
    if (detailsGroupRef.current && materialRef.current) {
      const y = detailsGroupRef.current.position.y;
      const uBend = materialRef.current.bend;
      const uWindStrength = materialRef.current.windStrength || 0;
      const uTime = state.clock.getElapsedTime();
      const bendAmount = Math.pow(y, 2.0) * uBend;
      const totalWind = 0.02 + uWindStrength;
      const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      detailsGroupRef.current.position.z = bendAmount + flutter - 0.03;
      const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      detailsGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);
    }
    if (techStackGroupRef.current && materialRef.current) {
      const y = techStackGroupRef.current.position.y;
      const uBend = materialRef.current.bend;
      const uWindStrength = materialRef.current.windStrength || 0;
      const uTime = state.clock.getElapsedTime();
      const bendAmount = Math.pow(y, 2.0) * uBend;
      const totalWind = 0.02 + uWindStrength;
      const flutter = Math.sin(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      techStackGroupRef.current.position.z = bendAmount + flutter - 0.03;
      const dz_dy = 2.0 * y * uBend + 2.0 * Math.cos(uTime * 2.0 + y * 2.0) * totalWind * (1.0 + Math.abs(uBend * 3.0));
      techStackGroupRef.current.rotation.x = Math.PI + Math.atan(dz_dy);
    }
    if (isAnimating || isSelected) return;
    const totalWidth = PROJECT_COUNT * GAP;
    let rawX = index * GAP - currentScroll.current;
    const halfWidth = totalWidth / 2;
    let displayX = ((rawX + halfWidth) % totalWidth + totalWidth) % totalWidth - halfWidth;
    const u = (displayX + 16) / 32;
    const safeU = THREE.MathUtils.clamp(u, 0, 1);
    const pointOnCurve = curve.getPointAt(safeU);
    cardRef.current.position.set(pointOnCurve.x, pointOnCurve.y, pointOnCurve.z);
    const time = state.clock.getElapsedTime();
    const wind = Math.sin(time * swaySpeed.current + swayOffset.current) * 0.05;
    cardRef.current.rotation.z = wind;
    cardRef.current.rotation.x = 0;
    const dist = Math.abs(displayX);
    const scale = THREE.MathUtils.clamp(1 - dist / 50, 0.7, 1);
    cardRef.current.scale.setScalar(scale);
  });
  return <group ref={cardRef} onClick={handleClick} onPointerEnter={e => {
    if (isMobile || isTransitioning) return;
    e.stopPropagation();
    setHovered(true);
    if (materialRef.current && project.paintedTexture && !isSelected) {
      gsap.to(materialRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  }} onPointerLeave={e => {
    if (isMobile || isTransitioning) return;
    e.stopPropagation();
    setHovered(false);
    if (materialRef.current && project.paintedTexture && !isSelected) {
      gsap.to(materialRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  }}>
            {}
            <mesh position={[0, -0.08, 0.15]} rotation={[0, 0, Math.PI]}>
                <planeGeometry args={[0.3, 0.2]} />
                <meshBasicMaterial color="#ffffff" map={clothespinTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} />
            </mesh>

            {}
            <group ref={paperRef} position={[0, -1.1, 0]}>
                <mesh>
                    <planeGeometry args={[1.5, 2, 16, 16]} />
                    <PaperMaterial ref={materialRef} color="#ffffff" map={project.frontTexture} mapBack={project.backTexture} mapPainted={project.paintedTexture} side={THREE.DoubleSide} roughness={0.6} paintProgress={paintProgress} roomOrigin={roomOrigin} />
                </mesh>

                {}
                <group ref={buttonGroupRef} position={[0, 0.75, 0]} rotation={[Math.PI, 0, 0]}>
                    {}
                    <mesh>
                        <planeGeometry args={[1.2, 1.2 / 3.613]} />
                        <meshBasicMaterial color="#ffffff" map={project.buttonTexture} transparent={true} alphaTest={0.05} />
                    </mesh>

                    {}
                    <Text ref={openTextRef} position={[0, 0, 0.01]} fontSize={0.11} color={btnHovered ? "#333333" : "#1c1c1c"} font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        OPEN PROJECT
                    </Text>

                    {}
                    <mesh position={[0, 0, 0.02]} onClick={e => {
          if (isSelected && !isTransitioning) {
            e.stopPropagation();
            window.open(project.url, '_blank');
          }
        }} onPointerEnter={e => {
          if (isSelected && !isTransitioning) {
            e.stopPropagation();
            setBtnHovered(true);
          }
        }} onPointerLeave={e => {
          if (isSelected && !isTransitioning) {
            e.stopPropagation();
          }
          setBtnHovered(false);
        }}>
                        <planeGeometry args={[1.2, 1.2 / 3.613]} />
                        <meshBasicMaterial color="#e0e0e0" transparent={true} opacity={0} />
                    </mesh>
                </group>

                {}
                <group ref={detailsGroupRef} position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
                    <Text ref={detailsTextRef1} position={[0, 0.28, 0.01]} fontSize={0.10} color="#1c1c1c" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        PROJECT DETAILS:
                    </Text>

                    <Text ref={detailsTextRef2} position={[0, 0.2, 0.01]} fontSize={0.06} color="#333333" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="top" maxWidth={1.1} lineHeight={1.4} textAlign="center" fillOpacity={0}>
                        {project.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco."}
                    </Text>
                </group>

                {}
                <group ref={techStackGroupRef} position={[0, 0.30, 0]} rotation={[Math.PI, 0, 0]}>
                    <Text ref={techTextRef} position={[0, 0.15, 0.01]} fontSize={0.08} color="#1c1c1c" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        TECH STACK
                    </Text>

                    {}
                    <group position={[0, -0.05, 0.01]}>
                        {project.techStack && project.techStack.map((logoPath, idx) => {
            const spacing = 0.30;
            const startX = -((project.techStack.length - 1) * spacing) / 2;
            const xPos = startX + idx * spacing;
            return <TechStackLogo key={idx} path={logoPath} position={[xPos, 0, 0]} />;
          })}
                    </group>
                </group>

                {}
                <Text ref={textRef} position={[0, 0.7, 0]} fontSize={0.20} color="#1c1c1c" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                    {project.title}
                </Text>

                <PositionalAudio ref={paperAudioRef} url="/sounds/papersound.mp3" distanceModel="exponential" rolloffFactor={GALLERY_INTERACTION_AUDIO_SETTINGS.rolloff} refDistance={GALLERY_INTERACTION_AUDIO_SETTINGS.distance} loop={false} />
            </group>
        </group>;
}));
const RightSideHouses = ({
  texture,
  baseWidth,
  baseHeight,
  cropAmount
}) => {
  const croppedTexture = useMemo(() => {
    const t = texture.clone();
    t.offset.x = cropAmount;
    t.repeat.x = 1 - cropAmount;
    t.needsUpdate = true;
    return t;
  }, [texture, cropAmount]);
  const newWidth = baseWidth * (1 - cropAmount);
  const newX = 7.5 + newWidth / 2;
  return <mesh position={[newX, -1, -9]} scale={[-1, 1, 1]}>
            <planeGeometry args={[newWidth, baseHeight]} />
            <meshBasicMaterial color="#e0e0e0" map={croppedTexture} transparent={true} alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>;
};
const TechStackLogo = ({
  path,
  position
}) => {
  const texture = useTexture(path);
  return <mesh position={position}>
            <planeGeometry args={[0.17, 0.17]} />
            <meshBasicMaterial color="#ffffff" map={texture} transparent={true} />
        </mesh>;
};
export default GalleryRoom;
