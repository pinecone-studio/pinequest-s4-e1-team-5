import { useRef, useState, useMemo, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Observer } from 'gsap/all';
import { useScene } from '../../../../context/SceneContext';
gsap.registerPlugin(Observer);
import { useAchievements } from '../../../../context/AchievementsContext';
import PaperMaterial from './PaperMaterial';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from './usePaintMaterial';
const _tempScale = new THREE.Vector3();

const MATH_FORMULAS = [
  'π ≈ 3.14159', 'a² + b² = c²', 'E = mc²', 'A = πr²',
  'sin²θ + cos²θ = 1', '∫e⁻ˣdx = -e⁻ˣ', 'Σn = n(n+1)/2',
  'F = ma', 'i² = -1', 'φ = (1+√5)/2',
  'dy/dx', '√2 ≈ 1.414', 'e^(iπ)+1 = 0', 'V = (4/3)πr³',
  'C = 2πr', '∇²φ = 0', 'd = √(x²+y²)', 'tan = sin/cos',
  'logₐb = lnb/lna', 'x̄ = Σxᵢ/n',
];

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
  id: 'pythagorean',
  title: 'a² + b² = c²',
  front: '/textures/gallery/monetuneprzod.webp',
  painted: '/textures/gallery/monetuneprzod_painted.webp',
  url: 'https://en.wikipedia.org/wiki/Pythagorean_theorem',
  description: 'In a right triangle the square of the hypotenuse c equals the sum of squares of legs a and b. A cornerstone of Euclidean geometry known since antiquity.',
  techStack: ['c = √(a²+b²)', 'sin θ = a/c', 'cos θ = b/c', 'tan θ = a/b'],
  quiz: [
    { q: 'Legs are 3 and 4. What is c?', opts: ['5', '6', '7'], ans: 0 },
    { q: 'The theorem applies to which triangle?', opts: ['Equilateral', 'Isosceles', 'Right'], ans: 2 },
    { q: 'Which gives side c?', opts: ['a + b', '√(a²+b²)', 'a · b'], ans: 1 },
  ]
}, {
  id: 'pi',
  title: 'π ≈ 3.14159',
  front: '/textures/gallery/timberkittyprzod.webp',
  painted: '/textures/gallery/timberkittyprzod_painted.webp',
  url: 'https://en.wikipedia.org/wiki/Pi',
  description: 'Pi is the ratio of any circle\'s circumference to its diameter. It is irrational and transcendental, appearing across geometry, physics and probability.',
  techStack: ['C = 2πr', 'A = πr²', 'V = 4/3πr³', 'e^(iπ)+1 = 0'],
  quiz: [
    { q: 'π equals circumference divided by:', opts: ['Area', 'Radius', 'Diameter'], ans: 2 },
    { q: 'π is what kind of number?', opts: ['Rational', 'Irrational', 'Integer'], ans: 1 },
    { q: 'Circle area formula:', opts: ['πr²', '2πr', 'πd'], ans: 0 },
  ]
}, {
  id: 'einstein',
  title: 'E = mc²',
  front: '/textures/gallery/youngmultiprzod.webp',
  painted: '/textures/gallery/youngmultiprzod_painted.webp',
  url: 'https://en.wikipedia.org/wiki/Mass%E2%80%93energy_equivalence',
  description: 'Einstein\'s mass-energy equivalence: energy E equals mass m times the speed of light c squared. Even tiny masses hold enormous energy.',
  techStack: ['p = mv', 'KE = ½mv²', 'F = ma', 'W = Fd'],
  quiz: [
    { q: "What does 'c' represent?", opts: ['Charge', 'Speed of light', 'Mass'], ans: 1 },
    { q: 'Who derived E = mc²?', opts: ['Newton', 'Tesla', 'Einstein'], ans: 2 },
    { q: 'The equation shows mass and energy are:', opts: ['Opposite', 'Unrelated', 'Equivalent'], ans: 2 },
  ]
}, {
  id: 'circle',
  title: 'A = πr²',
  front: '/textures/gallery/bioprzod.webp',
  painted: '/textures/gallery/bioprzod_painted.webp',
  url: 'https://en.wikipedia.org/wiki/Area_of_a_circle',
  description: 'Area of a circle: pi times the radius squared. This elegant formula links the one-dimensional radius to the two-dimensional surface through the constant π.',
  techStack: ['V = πr²h', 'C = 2πr', 'S = 4πr²', 'r = √(A/π)'],
  quiz: [
    { q: 'If r = 3, the area is:', opts: ['6π', '9π', '3π'], ans: 1 },
    { q: "What is 'r' in A = πr²?", opts: ['Diameter', 'Ratio', 'Radius'], ans: 2 },
    { q: 'Area of a semicircle:', opts: ['πr²', 'πr²/2', '2πr'], ans: 1 },
  ]
}];
const PROJECT_COUNT = 10;
const GAP = 2.5;
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
      return {
        ...projectData,
        index: i,
        frontTexture: frontTex,
        paintedTexture: paintedTex !== frontTex && canHover ? paintedTex : null,
        backTexture: backTextureRaw,
        buttonTexture: overlayTextureRaw,
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

                <GeometricShapes onBeforeCompile={onBeforeCompile} />
                <FloatingFormulas count={20} seed={123} />

                {}
                <mesh position={[0, 5, -20]}>
                    <sphereGeometry args={[40, 32, 32]} />
                    <meshBasicMaterial color="#f0f0f0" side={THREE.BackSide} transparent opacity={0.5} onBeforeCompile={onBeforeCompile} />
                </mesh>
            </group>
        </group>;
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
  const [quizActive, setQuizActive] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
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
        setQuizActive(false);
        setQuizIdx(0);
        setQuizScore(0);
        setQuizAnswered(null);
        setQuizDone(false);
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
  const handleQuizAnswer = (ansIdx: number) => {
    if (quizAnswered !== null || !isSelected) return;
    const correct = ansIdx === project.quiz[quizIdx].ans;
    setQuizAnswered(ansIdx);
    if (correct) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizIdx + 1 >= project.quiz.length) {
        setQuizDone(true);
      } else {
        setQuizIdx(qi => qi + 1);
        setQuizAnswered(null);
      }
    }, 1100);
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
                    <mesh position={[0, 0, -0.001]}>
                        <planeGeometry args={[1.22, 0.21]} />
                        <meshBasicMaterial color="#d8d8d0" />
                    </mesh>
                    <mesh>
                        <planeGeometry args={[1.18, 0.18]} />
                        <meshBasicMaterial color={btnHovered ? "#e8e8df" : "#f2f2ea"} />
                    </mesh>
                    <Text ref={openTextRef} position={[0, 0, 0.01]} fontSize={0.095} color={btnHovered ? "#222222" : "#444444"} font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        AI QUIZ
                    </Text>
                    <mesh position={[0, 0, 0.02]} onClick={e => {
          if (isSelected && !isTransitioning && !quizActive) {
            e.stopPropagation();
            setQuizActive(true);
            setQuizIdx(0);
            setQuizScore(0);
            setQuizAnswered(null);
            setQuizDone(false);
          }
        }} onPointerEnter={e => {
          if (isSelected && !isTransitioning) { e.stopPropagation(); setBtnHovered(true); }
        }} onPointerLeave={e => {
          setBtnHovered(false);
        }}>
                        <planeGeometry args={[1.18, 0.18]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                </group>

                {}
                <group ref={detailsGroupRef} position={[0, -0.38, 0]} rotation={[Math.PI, 0, 0]}>
                    <FormulaVisualizer id={project.id} />
                </group>

                {}
                <group ref={techStackGroupRef} position={[0, 0.26, 0]} rotation={[Math.PI, 0, 0]}>
                    <Text ref={techTextRef} position={[0, 0.2, 0.01]} fontSize={0.075} color="#333333" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        ABOUT:
                    </Text>
                    <Text ref={detailsTextRef2} position={[0, 0.1, 0.01]} fontSize={0.055} color="#555555" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="top" maxWidth={1.2} lineHeight={1.38} textAlign="center" fillOpacity={0}>
                        {project.description}
                    </Text>
                    <Text ref={detailsTextRef1} position={[0, -0.23, 0.01]} fontSize={0.06} color="#777777" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                        {project.techStack?.join('  ·  ')}
                    </Text>
                </group>

                {}
                {quizActive && (
                  <group rotation={[Math.PI, 0, 0]}>
                    <mesh position={[0, 0, 0.06]}>
                      <planeGeometry args={[1.46, 1.95]} />
                      <meshBasicMaterial color="#f7f6f0" />
                    </mesh>
                    {!quizDone ? (
                      <>
                        <Text position={[0, 0.78, 0.08]} fontSize={0.065} color="#999999" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">
                          {`Q${quizIdx + 1} / ${project.quiz.length}`}
                        </Text>
                        <Text position={[0, 0.58, 0.08]} fontSize={0.078} color="#222222" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" maxWidth={1.2} textAlign="center" lineHeight={1.35}>
                          {project.quiz[quizIdx].q}
                        </Text>
                        {project.quiz[quizIdx].opts.map((opt, i) => {
                          const y = 0.15 - i * 0.22;
                          const isCorrect = i === project.quiz[quizIdx].ans;
                          const isChosen = quizAnswered === i;
                          const bg = quizAnswered !== null
                            ? isCorrect ? '#c8e6c9' : isChosen ? '#ffcdd2' : '#eeeeea'
                            : '#eeeeea';
                          const borderCol = quizAnswered !== null
                            ? isCorrect ? '#81c784' : isChosen ? '#e57373' : '#cccccc'
                            : '#cccccc';
                          return (
                            <group key={i} position={[0, y, 0.07]}>
                              <mesh position={[0, 0, -0.002]}>
                                <planeGeometry args={[1.2, 0.175]} />
                                <meshBasicMaterial color={borderCol} />
                              </mesh>
                              <mesh onClick={e => { e.stopPropagation(); handleQuizAnswer(i); }}
                                onPointerEnter={e => { if (!quizAnswered) { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}}
                                onPointerLeave={() => { document.body.style.cursor = 'auto'; }}>
                                <planeGeometry args={[1.16, 0.155]} />
                                <meshBasicMaterial color={bg} />
                              </mesh>
                              <Text position={[0, 0, 0.01]} fontSize={0.066} color="#333333" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">
                                {opt}
                              </Text>
                            </group>
                          );
                        })}
                        <Text position={[0, -0.65, 0.08]} fontSize={0.065} color="#aaaaaa" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">
                          {`Score: ${quizScore} / ${quizIdx + (quizAnswered !== null ? 1 : 0)}`}
                        </Text>
                        <group position={[0.58, 0.82, 0.09]}>
                          <mesh onClick={e => { e.stopPropagation(); setQuizActive(false); }}>
                            <planeGeometry args={[0.15, 0.1]} />
                            <meshBasicMaterial color="#e0e0da" />
                          </mesh>
                          <Text position={[0, 0, 0.01]} fontSize={0.062} color="#888888" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">X</Text>
                        </group>
                      </>
                    ) : (
                      <>
                        <Text position={[0, 0.45, 0.08]} fontSize={0.13} color="#333333" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">
                          {quizScore === project.quiz.length ? 'PERFECT!' : quizScore >= 2 ? 'WELL DONE!' : 'KEEP GOING!'}
                        </Text>
                        <Text position={[0, 0.18, 0.08]} fontSize={0.11} color="#666666" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">
                          {`${quizScore} / ${project.quiz.length}`}
                        </Text>
                        <group position={[0, -0.15, 0.08]}>
                          <mesh position={[0, 0, -0.001]}>
                            <planeGeometry args={[0.82, 0.165]} />
                            <meshBasicMaterial color="#bbbbbb" />
                          </mesh>
                          <mesh onClick={e => { e.stopPropagation(); setQuizIdx(0); setQuizScore(0); setQuizAnswered(null); setQuizDone(false); }}>
                            <planeGeometry args={[0.78, 0.15]} />
                            <meshBasicMaterial color="#e8e8e0" />
                          </mesh>
                          <Text position={[0, 0, 0.01]} fontSize={0.072} color="#444444" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">TRY AGAIN</Text>
                        </group>
                      </>
                    )}
                  </group>
                )}

                {}
                <Text ref={textRef} position={[0, 0.7, 0]} fontSize={0.20} color="#1c1c1c" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle" fillOpacity={0}>
                    {project.title}
                </Text>

                <PositionalAudio ref={paperAudioRef} url="/sounds/papersound.mp3" distanceModel="exponential" rolloffFactor={GALLERY_INTERACTION_AUDIO_SETTINGS.rolloff} refDistance={GALLERY_INTERACTION_AUDIO_SETTINGS.distance} loop={false} />
            </group>
        </group>;
}));
const PythagoreanVis = () => {
  const matA = useRef<THREE.LineBasicMaterial>(null);
  const matB = useRef<THREE.LineBasicMaterial>(null);
  const matC = useRef<THREE.LineBasicMaterial>(null);
  useFrame(({ clock }) => {
    const ph = (clock.getElapsedTime() % 6) / 6;
    if (matA.current) matA.current.color.set(ph < 0.33 ? '#444444' : '#cccccc');
    if (matB.current) matB.current.color.set(ph >= 0.33 && ph < 0.66 ? '#444444' : '#cccccc');
    if (matC.current) matC.current.color.set(ph >= 0.66 ? '#444444' : '#cccccc');
  });
  const geoA = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.22,-0.28,0, 0.22,-0.28,0], 3)); return g; }, []);
  const geoB = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.22,-0.28,0, -0.22,0.28,0], 3)); return g; }, []);
  const geoC = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0.22,-0.28,0, -0.22,0.28,0], 3)); return g; }, []);
  const geoRA = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.22,-0.21,0, -0.15,-0.21,0, -0.15,-0.28,0], 3)); return g; }, []);
  return (
    <group>
      <line geometry={geoA}><lineBasicMaterial ref={matA} color="#cccccc" /></line>
      <line geometry={geoB}><lineBasicMaterial ref={matB} color="#cccccc" /></line>
      <line geometry={geoC}><lineBasicMaterial ref={matC} color="#cccccc" /></line>
      <line geometry={geoRA}><lineBasicMaterial color="#999999" /></line>
      <Text position={[0, -0.38, 0.01]} fontSize={0.09} color="#777777" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">a</Text>
      <Text position={[-0.35, 0, 0.01]} fontSize={0.09} color="#777777" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">b</Text>
      <Text position={[0.14, 0.06, 0.01]} fontSize={0.09} color="#777777" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">c</Text>
    </group>
  );
};

const PiVis = () => {
  const radiusRef = useRef<THREE.Group>(null);
  const circleGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; pts.push(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, []);
  const radiusGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0.3,0,0], 3)); return g; }, []);
  useFrame(({ clock }) => { if (radiusRef.current) radiusRef.current.rotation.z = clock.getElapsedTime() * 0.7; });
  return (
    <group>
      <line geometry={circleGeo}><lineBasicMaterial color="#888888" /></line>
      <group ref={radiusRef}>
        <line geometry={radiusGeo}><lineBasicMaterial color="#555555" /></line>
        <Text position={[0.19, 0.06, 0.01]} fontSize={0.09} color="#555555" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">r</Text>
      </group>
      <Text position={[0, 0, 0.01]} fontSize={0.08} color="#999999" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">π</Text>
    </group>
  );
};

const EinsteinVis = () => {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    [[r1, 0], [r2, 1.2], [r3, 2.4]].forEach(([ref, off]: any) => {
      if (!ref.current) return;
      const ph = ((t * 0.6 + off) % 3.6) / 3.6;
      const s = 0.4 + ph * 0.9;
      ref.current.scale.setScalar(s);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.55 - ph * 0.5;
    });
  });
  return (
    <group>
      {[r1, r2, r3].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <torusGeometry args={[0.28, 0.012, 8, 48]} />
          <meshBasicMaterial color="#777777" transparent opacity={0.5} />
        </mesh>
      ))}
      <Text position={[0, 0, 0.01]} fontSize={0.09} color="#999999" font="/fonts/CabinSketch-Bold.ttf" anchorX="center" anchorY="middle">mc²</Text>
    </group>
  );
};

const CircleAreaVis = () => {
  const fillRef = useRef<THREE.Mesh>(null);
  const radiusRef = useRef<THREE.Group>(null);
  const circleGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; pts.push(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, []);
  const radiusGeo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0.3,0,0], 3)); return g; }, []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (fillRef.current) { const s = 0.88 + Math.sin(t * 1.4) * 0.1; fillRef.current.scale.setScalar(s); (fillRef.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(t * 1.4) * 0.07; }
    if (radiusRef.current) radiusRef.current.rotation.z = t * 0.5;
  });
  return (
    <group>
      <mesh ref={fillRef}>
        <circleGeometry args={[0.3, 48]} />
        <meshBasicMaterial color="#aaaaaa" transparent opacity={0.22} />
      </mesh>
      <line geometry={circleGeo}><lineBasicMaterial color="#888888" /></line>
      <group ref={radiusRef}>
        <line geometry={radiusGeo}><lineBasicMaterial color="#555555" /></line>
        <Text position={[0.19, 0.06, 0.01]} fontSize={0.09} color="#555555" font="/fonts/CabinSketch-Bold.ttf" anchorX="center">r</Text>
      </group>
    </group>
  );
};

const FormulaVisualizer = ({ id }: { id: string }) => {
  return (
    <group scale={[0.92, 0.92, 0.92]}>
      {id === 'pythagorean' && <PythagoreanVis />}
      {id === 'pi' && <PiVis />}
      {id === 'einstein' && <EinsteinVis />}
      {id === 'circle' && <CircleAreaVis />}
    </group>
  );
};

const GeometricShapes = ({ onBeforeCompile }) => {
  const triGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([0, 1, 0, -0.866, -0.5, 0, 0.866, -0.5, 0, 0, 1, 0]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    return g;
  }, []);
  const squareGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3));
    return g;
  }, []);
  const spinRef1 = useRef<THREE.Mesh>(null);
  const spinRef2 = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spinRef1.current) spinRef1.current.rotation.z = t * 0.15;
    if (spinRef2.current) spinRef2.current.rotation.z = -t * 0.1;
  });
  return (
    <group>
      <line geometry={triGeo} position={[-14, 1, -12]} scale={[4, 4, 1]}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.28} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={triGeo} position={[11, 2, -14]} scale={[3.5, 3.5, 1]} rotation={[0, 0, 0.4]}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.22} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={triGeo} position={[-4, 7, -20]} scale={[6, 6, 1]} rotation={[0, 0, -0.15]}>
        <lineBasicMaterial color="#bbbbbb" transparent opacity={0.14} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={triGeo} position={[20, 0, -10]} scale={[2.5, 2.5, 1]}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.2} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={squareGeo} position={[17, 3, -15]} scale={[3.5, 3.5, 1]} rotation={[0, 0, 0.25]}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.2} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={squareGeo} position={[-18, 3, -11]} scale={[2.8, 2.8, 1]}>
        <lineBasicMaterial color="#aaaaaa" transparent opacity={0.22} onBeforeCompile={onBeforeCompile} />
      </line>
      <line geometry={squareGeo} position={[2, 9, -24]} scale={[6, 6, 1]} rotation={[0, 0, 0.5]}>
        <lineBasicMaterial color="#cccccc" transparent opacity={0.12} onBeforeCompile={onBeforeCompile} />
      </line>
      <mesh ref={spinRef1} position={[8, 4, -13]}>
        <torusGeometry args={[2.2, 0.022, 8, 52]} />
        <meshBasicMaterial color="#aaaaaa" transparent opacity={0.22} onBeforeCompile={onBeforeCompile} />
      </mesh>
      <mesh ref={spinRef2} position={[-11, 2, -16]}>
        <torusGeometry args={[3, 0.022, 8, 52]} />
        <meshBasicMaterial color="#aaaaaa" transparent opacity={0.18} onBeforeCompile={onBeforeCompile} />
      </mesh>
      <mesh position={[0, 8, -22]}>
        <torusGeometry args={[4.5, 0.022, 8, 52]} />
        <meshBasicMaterial color="#bbbbbb" transparent opacity={0.13} onBeforeCompile={onBeforeCompile} />
      </mesh>
      <mesh position={[-22, 5, -18]}>
        <torusGeometry args={[1.5, 0.022, 8, 40]} />
        <meshBasicMaterial color="#aaaaaa" transparent opacity={0.18} onBeforeCompile={onBeforeCompile} />
      </mesh>
    </group>
  );
};

const FloatingFormulaItem = ({ formula, y, z, scale, opacity, driftSpeed, initialOffset }) => {
  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const progress = (clock.getElapsedTime() * driftSpeed + initialOffset) % 90 - 5;
    ref.current.position.x = 40 - progress;
  });
  return (
    <Text ref={ref} position={[0, y, z]} fontSize={scale} color="#777777" font="/fonts/CabinSketch-Bold.ttf" fillOpacity={opacity} anchorX="center" anchorY="middle">
      {formula}
    </Text>
  );
};

const FloatingFormulas = ({ count = 20, seed = 42 }) => {
  const items = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      formula: MATH_FORMULAS[i % MATH_FORMULAS.length],
      y: 4 + random() * 9,
      z: -5 - random() * 22,
      scale: 0.13 + random() * 0.18,
      opacity: 0.18 + random() * 0.22,
      driftSpeed: 0.05 + random() * 0.09,
      initialOffset: (i / count) * 80 + random() * 5,
    }));
  }, [count, seed]);
  return (
    <group>
      {items.map(item => <FloatingFormulaItem key={item.id} {...item} />)}
    </group>
  );
};

function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = Math.sin(s * 9999) * 10000;
    return s - Math.floor(s);
  };
}
export default GalleryRoom;
