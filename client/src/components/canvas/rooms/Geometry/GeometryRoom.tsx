import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { Observer } from "gsap/all";
import GeometryBackground from "./GeometryBackground";
import GeometryCard, { type GeometryCardHandle } from "./GeometryCard";
import { CARD_COUNT, GAP, TOPICS, UNIQUE_TEXTURES } from "./GeometryData";

gsap.registerPlugin(Observer);

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  showRoom?: boolean;
  onReady?: () => void;
  isExiting?: boolean;
  isWarmup?: boolean;
};

// ─── Inner component (needs to be inside Canvas / R3F context) ────────────────

const GeometryRoomInner = ({ showRoom, onReady, isWarmup }: Props) => {
  // ── Texture loading (all at parent level, no Suspense inside loop) ──────────
  const frontTextures = useTexture(
    TOPICS.map((t) => UNIQUE_TEXTURES[t.textureIndex].front),
  );
  const backTexture = useTexture("/textures/gallery/tylkartki_painted.webp");
  const buttonTexture = useTexture(
    "/textures/gallery/przyciskdotylukartki_painted.webp",
  );
  const clothespinTexture = useTexture("/textures/gallery/klamerka.webp");

  // Set colorSpace for all front textures
  useMemo(() => {
    const arr = Array.isArray(frontTextures) ? frontTextures : [frontTextures];
    arr.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });
    backTexture.colorSpace = THREE.SRGBColorSpace;
  }, [frontTextures, backTexture]);

  // ── Scroll state ────────────────────────────────────────────────────────────
  const targetScroll = useRef(0);
  const currentScroll = useRef(0);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [globalIsAnimating, setGlobalIsAnimating] = useState(false);
  const cardRefs = useRef<(GeometryCardHandle | null)[]>([]);

  // ── Signal ready ────────────────────────────────────────────────────────────
  const hasSignaledReady = useRef(false);
  const frameCount = useRef(0);
  useFrame(() => {
    if (hasSignaledReady.current) return;
    frameCount.current++;
    if (frameCount.current >= 5) {
      hasSignaledReady.current = true;
      onReady?.();
    }
  });

  // ── Smooth scroll lerp ───────────────────────────────────────────────────────
  useFrame((_, delta) => {
    currentScroll.current = THREE.MathUtils.lerp(
      currentScroll.current,
      targetScroll.current,
      delta * 5,
    );
  });

  // ── GSAP scroll observer ────────────────────────────────────────────────────
  const lastTouchX = useRef(0);
  useEffect(() => {
    const obs = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      wheelSpeed: -1,
      onWheel: (e) => {
        if (!showRoom || selectedCard !== null || globalIsAnimating) return;
        const orig = e.event as WheelEvent;
        orig.preventDefault();
        targetScroll.current += orig.deltaY * 0.005;
      },
      onPress: (e) => {
        if (!showRoom || selectedCard !== null || globalIsAnimating) return;
        const orig = e.event as TouchEvent;
        if (orig.touches?.length === 1)
          lastTouchX.current = orig.touches[0].clientX;
      },
      onDrag: (e) => {
        if (!showRoom || selectedCard !== null || globalIsAnimating) return;
        const orig = e.event as TouchEvent;
        if (orig.touches?.length === 1) {
          const dx = lastTouchX.current - orig.touches[0].clientX;
          lastTouchX.current = orig.touches[0].clientX;
          targetScroll.current += dx * 0.008;
        }
      },
    });
    return () => obs.kill();
  }, [showRoom, selectedCard, globalIsAnimating]);

  // ── Scroll to index ─────────────────────────────────────────────────────────
  const scrollToIndex = useCallback((idx: number, cb: () => void) => {
    const totalWidth = CARD_COUNT * GAP;
    const target = idx * GAP;
    const cur = currentScroll.current;
    let diff = target - cur;
    const half = totalWidth / 2;
    while (diff > half) diff -= totalWidth;
    while (diff < -half) diff += totalWidth;
    const final = cur + diff;
    gsap.to(targetScroll, {
      current: final,
      duration: 0.5,
      ease: "power2.inOut",
    });
    gsap.to(currentScroll, {
      current: final,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: cb,
    });
  }, []);

  // ── Card click handler ───────────────────────────────────────────────────────
  const handleCardClick = useCallback(
    async (clickedIdx: number) => {
      if (globalIsAnimating) return;
      if (selectedCard === clickedIdx) {
        setGlobalIsAnimating(true);
        await cardRefs.current[clickedIdx]?.closeCard();
        setSelectedCard(null);
        setGlobalIsAnimating(false);
      } else if (selectedCard !== null) {
        setGlobalIsAnimating(true);
        await cardRefs.current[selectedCard]?.closeCard();
        setSelectedCard(null);
        await cardRefs.current[clickedIdx]?.openCard();
        setSelectedCard(clickedIdx);
        setGlobalIsAnimating(false);
      } else {
        setGlobalIsAnimating(true);
        await cardRefs.current[clickedIdx]?.openCard();
        setSelectedCard(clickedIdx);
        setGlobalIsAnimating(false);
      }
    },
    [selectedCard, globalIsAnimating],
  );

  // ── Rope ─────────────────────────────────────────────────────────────────────
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-13, 3.3, -6),
        new THREE.Vector3(-6.5, 2.4, -4.5),
        new THREE.Vector3(0, 1.8, -3),
        new THREE.Vector3(6.5, 2.4, -4.5),
        new THREE.Vector3(13, 3.3, -6),
      ]),
    [],
  );
  const ropeGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.015, 8, false),
    [curve],
  );

  const texArr = Array.isArray(frontTextures) ? frontTextures : [frontTextures];

  return (
    <group>
      <GeometryBackground />

      <group position={[0, -0.7, -2]}>
        <group position={[0, 1.6, -4]}>
          {/* Rope */}
          <mesh geometry={ropeGeo}>
            <meshBasicMaterial color="#888888" />
          </mesh>

          {/* Cards */}
          {TOPICS.map((topic, i) => (
            <GeometryCard
              key={topic.id}
              index={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              topic={topic}
              frontTexture={texArr[i]}
              backTexture={backTexture}
              buttonTexture={buttonTexture}
              clothespinTexture={clothespinTexture}
              total={CARD_COUNT}
              currentScroll={currentScroll}
              curve={curve}
              isSelected={selectedCard === i}
              scrollToIndex={scrollToIndex}
              onClick={handleCardClick}
            />
          ))}
        </group>
      </group>
    </group>
  );
};

// ─── Public component (with Suspense for textures) ────────────────────────────

const GeometryRoom = (props: Props) => (
  <Suspense fallback={null}>
    <GeometryRoomInner {...props} />
  </Suspense>
);

export default GeometryRoom;
