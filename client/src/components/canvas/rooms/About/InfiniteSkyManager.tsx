import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Text, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import SkyChunk, { CHUNK_LENGTH, ROOM_Z } from './SkyChunk';
import { useScene } from '../../../../context/SceneContext';
import '../../shaders/RevealBasicMaterial';
import { isTouchDevice } from '../../../../utils/deviceDetect';
const _tempVec3 = new THREE.Vector3();
import { useAudio } from '../../../../context/AudioManager';
export const BALLOON_AUDIO_SETTINGS = {
  volume: 1.0,
  distance: 2,
  rolloff: 2
};
const AwardButton = ({
  onClick,
  texture,
  paintedTexture,
  width,
  height,
  position,
  onHoverChange
}) => {
  const isTouch = isTouchDevice();
  const meshRef = useRef();
  const buttonRevealRef = useRef();
  const paintedRef = useRef();
  const hideDelayRef = useRef();
  const [hovered, setHovered] = useState(false);
  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.05 : 1.0;
      const lerpFactor = 10 * delta;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, lerpFactor);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, lerpFactor);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, lerpFactor);
    }
  });
  const handlePointerOver = () => {
    if (isTouch) return;
    setHovered(true);
    document.body.style.cursor = 'pointer';
    onHoverChange?.(true);
    if (buttonRevealRef.current) {
      gsap.to(buttonRevealRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (hideDelayRef.current) hideDelayRef.current.kill();
    if (paintedRef.current) {
      paintedRef.current.visible = true;
      if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
    }
  };
  const handlePointerOut = () => {
    if (isTouch) return;
    setHovered(false);
    document.body.style.cursor = 'auto';
    onHoverChange?.(false);
    if (buttonRevealRef.current) {
      gsap.to(buttonRevealRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    hideDelayRef.current = gsap.delayedCall(0.55, () => {
      if (paintedRef.current && paintedRef.current.material) {
        paintedRef.current.material.opacity = 0;
      }
    });
  };
  return <group ref={meshRef} position={position}>
            {}
            <mesh ref={paintedRef} position={[0, 0, -0.001]} visible={true}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color="#e0e0e0" map={paintedTexture} transparent opacity={0} side={THREE.DoubleSide} alphaTest={0.5} depthWrite={false} />
            </mesh>
            {}
            <mesh onClick={onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                <planeGeometry args={[width, height]} />
                <revealBasicMaterial ref={buttonRevealRef} map={texture} transparent side={THREE.DoubleSide} alphaTest={0.1} depthWrite={false} uProgress={0.0} />
            </mesh>
            <Text position={[0, 0, 0.05]} fontSize={0.25} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                VIEW
            </Text>
        </group>;
};
const STORY_CYCLE_LENGTH = 160;
const MILESTONE_CORRIDOR_CLIP_Z = -8.0;
const InfiniteSkyManager = ({
  scrollProgressRef
}) => {
  const [activeChunks, setActiveChunks] = useState([-1, 0, 1, 2]);
  const [activeStoryCycles, setActiveStoryCycles] = useState([-1, 0, 1]);
  const worldRef = useRef();
  const getCurrentChunk = worldZ => {
    return Math.floor(worldZ / CHUNK_LENGTH);
  };
  const getCurrentStoryCycle = worldZ => {
    return Math.floor(worldZ / STORY_CYCLE_LENGTH);
  };
  useFrame(() => {
    if (!worldRef.current) return;
    const scrollProgress = scrollProgressRef?.current || 0;
    worldRef.current.position.z = scrollProgress;
    const currentChunk = getCurrentChunk(scrollProgress);
    const shouldBeActiveChunks = [currentChunk - 1, currentChunk, currentChunk + 1, currentChunk + 2];
    const chunksNeedUpdate = shouldBeActiveChunks.some(c => !activeChunks.includes(c)) || activeChunks.some(c => !shouldBeActiveChunks.includes(c));
    if (chunksNeedUpdate) {
      setActiveChunks(shouldBeActiveChunks);
    }
    const currentStoryCycle = getCurrentStoryCycle(scrollProgress);
    const shouldBeActiveCycles = [currentStoryCycle - 1, currentStoryCycle, currentStoryCycle + 1];
    const cyclesNeedUpdate = shouldBeActiveCycles.some(c => !activeStoryCycles.includes(c)) || activeStoryCycles.some(c => !shouldBeActiveCycles.includes(c));
    if (cyclesNeedUpdate) {
      setActiveStoryCycles(shouldBeActiveCycles);
    }
  });
  return <group ref={worldRef}>
            {}
            {activeChunks.map(chunkIndex => <SkyChunk key={`sky-chunk-${chunkIndex}`} chunkIndex={chunkIndex} seed={42} scrollProgressRef={scrollProgressRef} />)}

            {}
            {activeStoryCycles.map(cycleIndex => <group key={`story-cycle-${cycleIndex}`}>
                    {}
                    <IntroMilestone z={-(cycleIndex * STORY_CYCLE_LENGTH + 15)} scrollProgressRef={scrollProgressRef} />

                    {}
                    <AwardsMilestone z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)} scrollProgressRef={scrollProgressRef} />

                    {}
                    <JourneyMilestone z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)} scrollProgressRef={scrollProgressRef} />

                    {}

                    <SkillsMilestone z={-(cycleIndex * STORY_CYCLE_LENGTH + 135)} scrollProgressRef={scrollProgressRef} />
                </group>)}
        </group>;
};
const IntroMilestone = ({
  z,
  scrollProgressRef
}) => {
  const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.webp');
  const {
    camera,
    viewport
  } = useThree();
  const isTouch = isTouchDevice();
  const groupRef = useRef();
  const titleRef = useRef();
  const brandRef = useRef();
  const avatarRef = useRef();
  const motto1Ref = useRef();
  const motto2Ref = useRef();
  const baseY = 2;
  const legacyAspectRatio = 2816 / 1536;
  const avatarWidth = 6;
  const avatarHeight = avatarWidth / legacyAspectRatio;
  useFrame(state => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const scrollProgress = scrollProgressRef?.current || 0;
    const worldZ = ROOM_Z + scrollProgress + z;
    groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
    if (!groupRef.current.visible) return;
    const distanceZ = z + scrollProgress - 55;
    const spreadStart = -70;
    const spreadEnd = -50;
    let spreadFactor = 0;
    if (distanceZ > spreadStart && distanceZ < spreadEnd) {
      spreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
      spreadFactor = Math.min(1, Math.max(0, spreadFactor));
      spreadFactor = spreadFactor * spreadFactor;
    } else if (distanceZ >= spreadEnd) {
      spreadFactor = 1;
    }
    const maxSpread = 15;
    if (titleRef.current) {
      titleRef.current.position.x = -spreadFactor * maxSpread * 0.8;
    }
    if (brandRef.current) {
      brandRef.current.position.x = spreadFactor * maxSpread * 0.6;
    }
    if (avatarRef.current) {
      avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 3;
      avatarRef.current.position.x = -spreadFactor * maxSpread * 0.3;
    }
    if (motto1Ref.current) {
      motto1Ref.current.position.x = spreadFactor * maxSpread * 0.7;
    }
    if (motto2Ref.current) {
      motto2Ref.current.position.x = -spreadFactor * maxSpread * 0.5;
    }
  });
  return <group ref={groupRef} position={[0, 0, z]}>
            {}
            <Text ref={titleRef} position={[0, 5, 0.1]} fontSize={0.8} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/RubikScribble-Regular.ttf">
                TOMASZ SZMAJDA
            </Text>

            {}
            <Text ref={brandRef} position={[0, 4.3, 0.1]} fontSize={0.45} color="#4a4a4a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf">
                (ITOM)
            </Text>

            {}
            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial color="#e0e0e0" map={avatarTexture} transparent side={THREE.DoubleSide} depthWrite={false} />
            </mesh>

            {}
            <Text ref={motto1Ref} position={[0, 0, 0.1]} fontSize={0.32} color="#555555" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf" fontStyle="italic">
                "Crafting digital experiences
            </Text>

            {}
            <Text ref={motto2Ref} position={[0, -0.5, 0]} fontSize={0.32} color="#555555" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf" fontStyle="italic">
                that push creative boundaries"
            </Text>
        </group>;
};
const AWARDS_DATA = {
  featured: {
    id: 'award-featured',
    layout: 'certificate_grid',
    title: 'Featured Projects Collection',
    items: [{
      label: 'Featured - Awwwards',
      date: 'May 2025',
      image: '/textures/about/FEATURED.webp',
      url: 'https://awwwards.com'
    }, {
      label: 'Featured - CSS Design Awards',
      date: 'June 2025',
      image: '/textures/about/FEATURED.webp',
      url: 'https://cssdesignawards.com'
    }, {
      label: 'Featured - The FWA',
      date: 'July 2025',
      image: '/textures/about/FEATURED.webp',
      url: 'https://thefwa.com'
    }, {
      label: 'Featured - Behance',
      date: 'August 2025',
      image: '/textures/about/FEATURED.webp',
      url: 'https://behance.net'
    }],
    platformConfig: {
      label: 'HONOR',
      color: '#1a1a1a',
      icon: '⭐'
    }
  },
  sotd: {
    id: 'award-sotd',
    layout: 'certificate_grid',
    title: 'Site of the Day Awards',
    items: [{
      label: 'SOTD - GSAP',
      date: 'February 13, 2026',
      image: '/textures/about/SOTDAYYOUNGMULTIGSAP.webp',
      url: 'https://www.linkedin.com/posts/greensock_site-of-the-day-young-multi-this-immersive-activity-7427567524940017664-zU2n?utm_source=share&utm_medium=member_desktop&rcm=ACoAAE3TV6UBqXoaJXUN5-1s3ij6SQJwTRAcbCM'
    }, {
      label: 'SOTD - CSS Winner',
      date: 'January 24, 2026',
      image: '/textures/about/SOTDAYYOUNGMULTICSSWINNER.webp',
      url: 'https://www.csswinner.com/details/young-multi-official-experience/19045'
    }, {
      label: 'SOTD - Orpetron',
      date: 'January 29, 2026',
      image: '/textures/about/SOTDAYYOUNGMULTIORPETRON.webp',
      url: 'https://orpetron.com/sites/young-multi/'
    }, {
      label: 'SOTD - Design Nominess',
      date: 'February 17, 2026',
      image: '/textures/about/SOTDAYYOUNGMULTIDESIGNNOMINESS.webp',
      url: 'https://www.designnominees.com/sites/young-multi'
    }],
    platformConfig: {
      label: 'AWARD',
      color: '#1a1a1a',
      icon: '🏆'
    }
  },
  sotm: {
    id: 'award-sotm',
    layout: 'certificate_grid',
    title: 'Site of the Month Awards',
    items: [],
    platformConfig: {
      label: 'AWARD',
      color: '#1a1a1a',
      icon: '📅'
    }
  },
  soty: {
    id: 'award-soty',
    layout: 'certificate_grid',
    title: 'Site of the Year Awards',
    items: [],
    platformConfig: {
      label: 'PRESTIGE',
      color: '#1a1a1a',
      icon: '👑'
    }
  }
};
const AwardsMilestone = ({
  z,
  scrollProgressRef
}) => {
  const {
    camera,
    viewport
  } = useThree();
  const isTouch = isTouchDevice();
  const {
    openOverlay
  } = useScene();
  const groupRef = useRef();
  const sotyRef = useRef();
  const sotdRef = useRef();
  const sotmRef = useRef();
  const sotdCardRevealRef = useRef();
  const sotdCardPaintedRef = useRef();
  const sotdHideDelayRef = useRef();
  const sotmCardRevealRef = useRef();
  const sotmCardPaintedRef = useRef();
  const sotmHideDelayRef = useRef();
  const sotyCardRevealRef = useRef();
  const sotyCardPaintedRef = useRef();
  const sotyHideDelayRef = useRef();
  const sotyTexture = useLoader(THREE.TextureLoader, '/textures/about/SOTY.webp');
  const sotdTexture = useLoader(THREE.TextureLoader, '/textures/about/SOTD.webp');
  const sotmTexture = useLoader(THREE.TextureLoader, '/textures/about/SOTM.webp');
  const sotyPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/textures/about/SOTY.webp' : '/textures/about/SOTY_painted.webp');
  const sotdPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/textures/about/SOTD.webp' : '/textures/about/SOTD_painted.webp');
  const sotmPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/textures/about/SOTM.webp' : '/textures/about/SOTM_painted.webp');
  const buttonTexture = useLoader(THREE.TextureLoader, '/textures/about/button.webp');
  const buttonPaintedTexture = useLoader(THREE.TextureLoader, isTouch ? '/textures/about/button.webp' : '/textures/about/button_painted.webp');
  sotyTexture.colorSpace = THREE.SRGBColorSpace;
  sotdTexture.colorSpace = THREE.SRGBColorSpace;
  sotmTexture.colorSpace = THREE.SRGBColorSpace;
  sotyPaintedTexture.colorSpace = THREE.SRGBColorSpace;
  sotdPaintedTexture.colorSpace = THREE.SRGBColorSpace;
  sotmPaintedTexture.colorSpace = THREE.SRGBColorSpace;
  buttonTexture.colorSpace = THREE.SRGBColorSpace;
  buttonPaintedTexture.colorSpace = THREE.SRGBColorSpace;
  const cardLegacyAspect = 2400 / 1760;
  const buttonLegacyAspect = 894 / 208;
  const cardHeight = 2.5;
  const buttonHeight = 0.35;
  const buttonWidth = buttonHeight * buttonLegacyAspect;
  const buttonY = -cardHeight / 2 - buttonHeight / 2 + 0.5;
  const makeCardHoverHandler = (revealRef, paintedRef, hideDelayRef) => isHovered => {
    if (isTouch) return;
    if (isHovered) {
      if (revealRef.current) {
        gsap.to(revealRef.current, {
          uProgress: 1.0,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: true
        });
      }
      if (hideDelayRef.current) hideDelayRef.current.kill();
      if (paintedRef.current) {
        paintedRef.current.visible = true;
        if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
      }
    } else {
      if (revealRef.current) {
        gsap.to(revealRef.current, {
          uProgress: 0.0,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true
        });
      }
      hideDelayRef.current = gsap.delayedCall(0.55, () => {
        if (paintedRef.current && paintedRef.current.material) {
          paintedRef.current.material.opacity = 0;
        }
      });
    }
  };
  useFrame(state => {
    if (!groupRef.current) return;
    const scrollProgress = scrollProgressRef?.current || 0;
    const worldZ = ROOM_Z + scrollProgress + z;
    groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
    if (!groupRef.current.visible) return;
    const distanceZ = z + scrollProgress - 55;
    const revealStart = -120;
    const revealEnd = -50;
    let revealFactor = 0;
    if (distanceZ > revealStart && distanceZ < revealEnd) {
      revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
      revealFactor = Math.min(1, Math.max(0, revealFactor));
      revealFactor = revealFactor * revealFactor;
    } else if (distanceZ >= revealEnd) {
      revealFactor = 1;
    }
    const sotyStart = -80;
    const sotyEnd = -20;
    let sotyFactor = 0;
    if (distanceZ > sotyStart && distanceZ < sotyEnd) {
      sotyFactor = (distanceZ - sotyStart) / (sotyEnd - sotyStart);
      sotyFactor = Math.min(1, Math.max(0, sotyFactor));
      sotyFactor = 1 - Math.pow(1 - sotyFactor, 2);
    } else if (distanceZ >= sotyEnd) {
      sotyFactor = 1;
    }
    const spreadX = 5;
    if (sotdRef.current) {
      sotdRef.current.position.x = -revealFactor * spreadX;
    }
    if (sotmRef.current) {
      sotmRef.current.position.x = revealFactor * spreadX;
    }
    if (sotyRef.current) {
      sotyRef.current.position.y = 0.5 + sotyFactor * 2.5;
    }
  });
  return <group ref={groupRef} position={[0, 2, z]}>
            {}
            <Text position={[0, 4, 0]} fontSize={1.2} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/RubikScribble-Regular.ttf">
                AWARDS
            </Text>

            {}
            <group ref={sotdRef} position={[0, 0.5, -0.5]}>
                {}
                <mesh ref={sotdCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={sotdPaintedTexture} transparent opacity={0} side={THREE.DoubleSide} alphaTest={0.5} />
                </mesh>
                {}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial ref={sotdCardRevealRef} map={sotdTexture} transparent side={THREE.DoubleSide} uProgress={0.0} />
                </mesh>
                {}
                <AwardButton onClick={e => {
        e.stopPropagation();
        openOverlay(AWARDS_DATA.sotd);
      }} texture={buttonTexture} paintedTexture={buttonPaintedTexture} width={buttonWidth} height={buttonHeight} position={[0, buttonY, 0.05]} onHoverChange={makeCardHoverHandler(sotdCardRevealRef, sotdCardPaintedRef, sotdHideDelayRef)} />
                {}
                <Text position={[0, 0.95, 0.01]} fontSize={0.45} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    SOTD
                </Text>
                {}
                <Text position={[-0.05, 0, 0.01]} fontSize={0.8} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    4
                </Text>
            </group>

            {}
            <group ref={sotmRef} position={[0, 0.5, -0.2]}>
                {}
                <mesh ref={sotmCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={sotmPaintedTexture} transparent opacity={0} side={THREE.DoubleSide} alphaTest={0.5} />
                </mesh>
                {}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial ref={sotmCardRevealRef} map={sotmTexture} transparent side={THREE.DoubleSide} uProgress={0.0} />
                </mesh>
                {}
                <AwardButton onClick={e => {
        e.stopPropagation();
        openOverlay(AWARDS_DATA.sotm);
      }} texture={buttonTexture} paintedTexture={buttonPaintedTexture} width={buttonWidth} height={buttonHeight} position={[0, buttonY, 0.05]} onHoverChange={makeCardHoverHandler(sotmCardRevealRef, sotmCardPaintedRef, sotmHideDelayRef)} />
                {}
                <Text position={[0, 0.95, 0.01]} fontSize={0.45} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    SOTM
                </Text>
                {}
                <Text position={[-0.05, 0, 0.01]} fontSize={0.8} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    0
                </Text>
            </group>

            {}
            <group ref={sotyRef} position={[0, 0.5, 0]}>
                {}
                <mesh ref={sotyCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={sotyPaintedTexture} transparent opacity={0} side={THREE.DoubleSide} alphaTest={0.5} />
                </mesh>
                {}
                <mesh>
                    <planeGeometry args={[cardHeight * cardLegacyAspect, cardHeight]} />
                    <revealBasicMaterial ref={sotyCardRevealRef} map={sotyTexture} transparent side={THREE.DoubleSide} />
                </mesh>
                {}
                <AwardButton onClick={e => {
        e.stopPropagation();
        openOverlay(AWARDS_DATA.soty);
      }} texture={buttonTexture} paintedTexture={buttonPaintedTexture} width={buttonWidth} height={buttonHeight} position={[0, buttonY, 0.05]} onHoverChange={makeCardHoverHandler(sotyCardRevealRef, sotyCardPaintedRef, sotyHideDelayRef)} />
                {}
                <Text position={[0, 0.95, 0.01]} fontSize={0.45} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    SOTY
                </Text>
                {}
                <Text position={[-0.05, 0, 0.01]} fontSize={0.8} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    0
                </Text>
            </group>
        </group>;
};
const JourneyMilestone = ({
  z,
  scrollProgressRef
}) => {
  const {
    camera,
    viewport
  } = useThree();
  const isTouch = isTouchDevice();
  const groupRef = useRef();
  const uoRef = useRef();
  const freelanceRef = useRef();
  const uoTexture = useLoader(THREE.TextureLoader, '/textures/about/uowyspa.webp');
  const freelanceTexture = useLoader(THREE.TextureLoader, '/textures/about/freelancewyspa.webp');
  uoTexture.colorSpace = THREE.SRGBColorSpace;
  freelanceTexture.colorSpace = THREE.SRGBColorSpace;
  const islandLegacyAspect = 2816 / 1536;
  const uoAspect = islandLegacyAspect;
  const freelanceAspect = islandLegacyAspect;
  const islandHeight = 4.5;
  useFrame(state => {
    if (!groupRef.current) return;
    const scrollProgress = scrollProgressRef?.current || 0;
    const worldZ = ROOM_Z + scrollProgress + z;
    groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
    if (!groupRef.current.visible) return;
    const time = state.clock.elapsedTime;
    const distanceZ = z + scrollProgress - 55;
    const revealStart = -100;
    const revealEnd = -20;
    let revealFactor = 0;
    if (distanceZ > revealStart && distanceZ < revealEnd) {
      revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
      revealFactor = Math.min(1, Math.max(0, revealFactor));
      revealFactor = 1 - Math.pow(1 - revealFactor, 2);
    } else if (distanceZ >= revealEnd) {
      revealFactor = 1;
    }
    if (uoRef.current) {
      const startY = -2;
      const endY = 1.5;
      const currentBaseY = startY + revealFactor * (endY - startY);
      uoRef.current.position.y = currentBaseY + Math.sin(time * 0.5) * 0.2;
      uoRef.current.rotation.z = Math.sin(time * 0.3) * 0.05;
    }
    if (freelanceRef.current) {
      const startY = -1;
      const endY = 2.5;
      const currentBaseY = startY + revealFactor * (endY - startY);
      freelanceRef.current.position.y = currentBaseY + Math.sin(time * 0.4 + 2) * 0.25;
      freelanceRef.current.rotation.z = Math.sin(time * 0.2 + 1) * -0.05;
    }
  });
  return <group ref={groupRef} position={[0, 0, z]}>
            {}
            <Text position={[0, 5, 0.3]} fontSize={1.2} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/RubikScribble-Regular.ttf">
                JOURNEY
            </Text>

            {}
            <Text position={[0, 4.2, 0.3]} fontSize={0.35} color="#555555" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf">
                My path so far...
            </Text>

            {}
            <group ref={uoRef} position={[-3.5, -1, 0]}>
                <mesh>
                    <planeGeometry args={[islandHeight * uoAspect, islandHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={uoTexture} transparent side={THREE.DoubleSide} />
                </mesh>
                {}
                <Text position={[0.1, -0.85, 0.1]} fontSize={0.4} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    2025-NOW
                </Text>
            </group>

            {}
            <group ref={freelanceRef} position={[3.5, -2, 0.5]}>
                <mesh>
                    <planeGeometry args={[islandHeight * freelanceAspect, islandHeight]} />
                    <meshBasicMaterial color="#e0e0e0" map={freelanceTexture} transparent side={THREE.DoubleSide} />
                </mesh>
                {}
                <Text position={[0, -0.65, 0.1]} fontSize={0.5} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Bold.ttf">
                    2023-NOW
                </Text>
            </group>
        </group>;
};
const BALLOON_CONFIG = [{
  texture: '/textures/about/reactduzybalon.webp',
  paintedTexture: '/textures/about/reactduzybalon_painted.webp',
  label: 'React',
  size: 'large',
  x: -2.5,
  y: 2,
  z: 0.3,
  phase: 0
}, {
  texture: '/textures/about/threejsduzybalon.webp',
  paintedTexture: '/textures/about/threejsduzybalon_painted.webp',
  label: 'Three.js',
  size: 'large',
  x: 2.5,
  y: 2.5,
  z: 0.2,
  phase: 1.5
}, {
  texture: '/textures/about/GSAPduzybalon.webp',
  paintedTexture: '/textures/about/GSAPduzybalon_painted.webp',
  label: 'GSAP',
  size: 'large',
  x: 0,
  y: 3,
  z: 0.5,
  phase: 3
}, {
  texture: '/textures/about/JSSREDNIBALON.webp',
  paintedTexture: '/textures/about/JSSREDNIBALON_painted.webp',
  label: 'JavaScript',
  size: 'medium',
  x: -4,
  y: 1,
  z: -0.3,
  phase: 0.8
}, {
  texture: '/textures/about/csssrednibalon.webp',
  paintedTexture: '/textures/about/csssrednibalon_painted.webp',
  label: 'CSS',
  size: 'medium',
  x: 4,
  y: 1.5,
  z: -0.2,
  phase: 2.2
}, {
  texture: '/textures/about/nextjssrednibalon.webp',
  paintedTexture: '/textures/about/nextjssrednibalon_painted.webp',
  label: 'Next.js',
  size: 'medium',
  x: 0,
  y: 0.5,
  z: -0.4,
  phase: 4
}, {
  texture: '/textures/about/htmlmalybalon.webp',
  paintedTexture: '/textures/about/htmlmalybalon_painted.webp',
  label: 'HTML',
  size: 'small',
  x: -5.5,
  y: 2.5,
  z: -0.8,
  phase: 1.2
}, {
  texture: '/textures/about/gitmalybalon.webp',
  paintedTexture: '/textures/about/gitmalybalon_painted.webp',
  label: 'Git',
  size: 'small',
  x: 5.5,
  y: 3,
  z: -0.7,
  phase: 2.8
}, {
  texture: '/textures/about/figmamalybalon.webp',
  paintedTexture: '/textures/about/figmamalybalon_painted.webp',
  label: 'Figma',
  size: 'small',
  x: -3,
  y: 4.5,
  z: -0.5,
  phase: 3.5
}, {
  texture: '/textures/about/firebasemalybalon.webp',
  paintedTexture: '/textures/about/firebasemalybalon_painted.webp',
  label: 'Firebase',
  size: 'small',
  x: 3.5,
  y: 4,
  z: -0.6,
  phase: 4.5
}];
const SIZE_MULTIPLIERS = {
  large: 3.0,
  medium: 2.2,
  small: 1.6
};
const SkillBalloon = ({
  config,
  revealFactorRef,
  spreadFactorRef,
  timeRef
}) => {
  const {
    viewport
  } = useThree();
  const isTouch = isTouchDevice();
  const texture = useLoader(THREE.TextureLoader, config.texture);
  const paintedTextureUrl = isTouch ? config.texture : config.paintedTexture;
  const paintedTexture = useLoader(THREE.TextureLoader, paintedTextureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  paintedTexture.colorSpace = THREE.SRGBColorSpace;
  const [isPopping, setIsPopping] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isFadingOutText, setIsFadingOutText] = useState(false);
  const popRef = useRef(0);
  const textFadeRef = useRef(1);
  const respawnOffsetRef = useRef(0);
  const balloonMatRef = useRef();
  const balloonRevealRef = useRef();
  const paintedMeshRef = useRef();
  const paintedMatRef = useRef();
  const hideDelayRef = useRef();
  const textRef = useRef();
  const balloonAudioRef = useRef();
  const {
    globalVolume,
    isMuted
  } = useAudio();
  const playBalloonSound = () => {
    if (balloonAudioRef.current) {
      const vol = isMuted ? 0 : BALLOON_AUDIO_SETTINGS.volume * globalVolume;
      balloonAudioRef.current.setVolume(vol);
      if (balloonAudioRef.current.isPlaying) balloonAudioRef.current.stop();
      balloonAudioRef.current.play();
    }
  };
  const legacyAspects = {
    'reactduzybalon.webp': 736 / 1447,
    'threejsduzybalon.webp': 1141 / 1964,
    'GSAPduzybalon.webp': 1.0,
    'default_small_medium': 631 / 1482
  };
  const filename = config.texture.split('/').pop();
  const aspect = legacyAspects[filename] || legacyAspects['default_small_medium'];
  const baseHeight = SIZE_MULTIPLIERS[config.size];
  const outerGroupRef = useRef();
  const innerGroupRef = useRef();
  const targetScale = useRef(1.0);
  const currentScale = useRef(1.0);
  const targetMagnet = useRef({
    x: 0,
    y: 0
  });
  const currentMagnet = useRef({
    x: 0,
    y: 0
  });
  const positionScale = isTouch ? 0.5 : 1;
  const spreadScale = isTouch ? 0.4 : 1;
  const sizeScale = isTouch ? 0.85 : 1;
  useEffect(() => {
    if (hovered && !isPopping) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [hovered, isPopping]);
  useEffect(() => {
    if (isPopping) {
      const timer = setTimeout(() => {
        setIsFadingOutText(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPopping]);
  const handlePointerOver = e => {
    if (isTouch) return;
    e.stopPropagation();
    if (!isPopping) setHovered(true);
    if (balloonRevealRef.current) {
      gsap.to(balloonRevealRef.current, {
        uProgress: 1.0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    }
    if (hideDelayRef.current) hideDelayRef.current.kill();
    if (paintedMeshRef.current) paintedMeshRef.current.visible = true;
    if (paintedMatRef.current) paintedMatRef.current.opacity = 1;
  };
  const handlePointerOut = e => {
    if (isTouch) return;
    e.stopPropagation();
    setHovered(false);
    if (balloonRevealRef.current) {
      gsap.to(balloonRevealRef.current, {
        uProgress: 0.0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true
      });
    }
    hideDelayRef.current = gsap.delayedCall(0.55, () => {
      if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
    });
  };
  useFrame((state, delta) => {
    if (hovered && !isPopping) {
      targetScale.current = 1.05;
    } else {
      targetScale.current = 1.0;
      targetMagnet.current.x = 0;
      targetMagnet.current.y = 0;
    }
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, 8 * delta);
    currentMagnet.current.x = THREE.MathUtils.lerp(currentMagnet.current.x, targetMagnet.current.x, 8 * delta);
    currentMagnet.current.y = THREE.MathUtils.lerp(currentMagnet.current.y, targetMagnet.current.y, 8 * delta);
    if (isPopping) {
      popRef.current = THREE.MathUtils.lerp(popRef.current, 1, 2.5 * delta);
      if (hideDelayRef.current) hideDelayRef.current.kill();
      if (balloonRevealRef.current) {
        balloonRevealRef.current.uProgress = 0;
      }
    }
    if (isFadingOutText) {
      textFadeRef.current = THREE.MathUtils.lerp(textFadeRef.current, 0, 2 * delta);
      if (textFadeRef.current < 0.05) {
        setIsPopping(false);
        setHovered(false);
        setIsFadingOutText(false);
        popRef.current = 0;
        textFadeRef.current = 1;
        respawnOffsetRef.current = -12;
        if (outerGroupRef.current) {
          outerGroupRef.current.position.y -= 12;
        }
        if (balloonRevealRef.current) balloonRevealRef.current.opacity = 1;
        if (textRef.current) textRef.current.fillOpacity = 0;
        if (balloonRevealRef.current) balloonRevealRef.current.uProgress = 0;
        if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
        if (paintedMeshRef.current) paintedMeshRef.current.visible = false;
      }
    }
    if (respawnOffsetRef.current < -0.01) {
      respawnOffsetRef.current = THREE.MathUtils.lerp(respawnOffsetRef.current, 0, 1.5 * delta);
    }
    if (balloonRevealRef.current && isPopping) {
      balloonRevealRef.current.opacity = 1 - popRef.current;
    }
    if (paintedMatRef.current && isPopping) {
      paintedMatRef.current.opacity = 1 - popRef.current;
    }
    if (textRef.current && isPopping) {
      textRef.current.fillOpacity = popRef.current * textFadeRef.current;
      textRef.current.outlineOpacity = popRef.current * textFadeRef.current;
    }
  });
  const baseX = config.x * positionScale;
  useFrame(() => {
    if (!outerGroupRef.current) return;
    const time = timeRef.current;
    const revealFactor = revealFactorRef.current;
    const spreadFactor = spreadFactorRef.current;
    const floatY = Math.sin(time * 0.6 + config.phase) * 0.3;
    const floatX = Math.sin(time * 0.4 + config.phase * 0.7) * 0.15;
    const rotation = Math.sin(time * 0.3 + config.phase) * 0.08;
    const startY = config.y - 8;
    const endY = config.y;
    const currentY = startY + revealFactor * (endY - startY) + floatY + respawnOffsetRef.current;
    let scale = revealFactor * sizeScale;
    const popScaleEffect = currentScale.current + popRef.current * 0.4;
    scale *= popScaleEffect;
    const maxSpread = 15 * spreadScale;
    let spreadX = 0;
    if (config.x < -0.5) {
      spreadX = -spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
    } else if (config.x > 0.5) {
      spreadX = spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
    } else {
      spreadX = config.phase > 3.5 ? spreadFactor * maxSpread * 0.8 : -spreadFactor * maxSpread * 0.8;
    }
    outerGroupRef.current.position.set(baseX + floatX + spreadX, currentY, config.z);
    outerGroupRef.current.rotation.z = rotation;
    const s = Math.max(0.001, scale);
    outerGroupRef.current.scale.set(s, s, s);
    if (innerGroupRef.current) {
      innerGroupRef.current.position.set(currentMagnet.current.x, currentMagnet.current.y, 0);
    }
  });
  return <group ref={outerGroupRef} position={[baseX, config.y - 8, config.z]}>
            <group ref={innerGroupRef}>
                {}
                <mesh ref={paintedMeshRef} visible={true}>
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <meshBasicMaterial color="#e0e0e0" ref={paintedMatRef} map={paintedTexture} transparent opacity={0} side={THREE.DoubleSide} alphaTest={0.5} depthWrite={false} />
                </mesh>

                {}
                <mesh position={[0, 0, 0.001]} onClick={e => {
        e.stopPropagation();
        if (!isPopping) {
          setIsPopping(true);
          playBalloonSound();
        }
      }} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onPointerMove={e => {
        if (hovered && !isPopping && outerGroupRef.current) {
          outerGroupRef.current.getWorldPosition(_tempVec3);
          targetMagnet.current.x = (e.point.x - _tempVec3.x) * 0.15;
          targetMagnet.current.y = (e.point.y - _tempVec3.y) * 0.15;
        }
      }} visible={popRef.current < 0.99}>
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <revealBasicMaterial ref={balloonRevealRef} map={texture} transparent side={THREE.DoubleSide} depthWrite={false} uProgress={0.0} />
                </mesh>

                {}
                {isPopping && textFadeRef.current > 0.01 && <Text ref={textRef} position={[0, 0, 0.1]} fontSize={baseHeight * 0.4} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/RubikScribble-Regular.ttf" fillOpacity={0} outlineWidth={0.02} outlineColor="#fff" outlineOpacity={0}>
                        {config.label}
                    </Text>}

                <PositionalAudio ref={balloonAudioRef} url="/sounds/baloonpoop.mp3" distanceModel="exponential" rolloffFactor={BALLOON_AUDIO_SETTINGS.rolloff} refDistance={BALLOON_AUDIO_SETTINGS.distance} loop={false} />
            </group>
        </group>;
};
const SkillsMilestone = ({
  z,
  scrollProgressRef
}) => {
  const {
    camera,
    viewport
  } = useThree();
  const isTouch = isTouchDevice();
  const groupRef = useRef();
  const revealFactorRef = useRef(0);
  const spreadFactorRef = useRef(0);
  const timeRef = useRef(0);
  useFrame(state => {
    if (!groupRef.current) return;
    const scrollProgress = scrollProgressRef?.current || 0;
    const worldZ = ROOM_Z + scrollProgress + z;
    groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
    if (!groupRef.current.visible) return;
    timeRef.current = state.clock.elapsedTime;
    const distanceZ = z + scrollProgress - 55;
    const revealStart = -100;
    const revealEnd = -25;
    let newRevealFactor = 0;
    if (distanceZ > revealStart && distanceZ < revealEnd) {
      newRevealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
      newRevealFactor = Math.min(1, Math.max(0, newRevealFactor));
      newRevealFactor = 1 - Math.pow(1 - newRevealFactor, 3);
    } else if (distanceZ >= revealEnd) {
      newRevealFactor = 1;
    }
    revealFactorRef.current = newRevealFactor;
    const spreadStart = -70;
    const spreadEnd = -40;
    let newSpreadFactor = 0;
    if (distanceZ > spreadStart && distanceZ < spreadEnd) {
      newSpreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
      newSpreadFactor = Math.min(1, Math.max(0, newSpreadFactor));
      newSpreadFactor = newSpreadFactor * newSpreadFactor;
    } else if (distanceZ >= spreadEnd) {
      newSpreadFactor = 1;
    }
    spreadFactorRef.current = newSpreadFactor;
  });
  return <group ref={groupRef} position={[0, 0, z]}>
            {}
            <Text position={[0, 6, 0.5]} fontSize={1.2} color="#1a1a1a" anchorX="center" anchorY="middle" font="/fonts/RubikScribble-Regular.ttf">
                SKILLS
            </Text>

            {}
            <Text position={[0, 5.2, 0.5]} fontSize={0.35} color="#555555" anchorX="center" anchorY="middle" font="/fonts/CabinSketch-Regular.ttf">
                Technologies I love working with
            </Text>

            {}
            {BALLOON_CONFIG.map((config, index) => <SkillBalloon key={index} config={config} revealFactorRef={revealFactorRef} spreadFactorRef={spreadFactorRef} timeRef={timeRef} />)}
        </group>;
};
export default InfiniteSkyManager;
