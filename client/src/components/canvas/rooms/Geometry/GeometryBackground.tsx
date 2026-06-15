import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";

const FONT = "/fonts/CabinSketch-Bold.ttf";
const MAIN_COLOR = "#b09a30";
const TEXT_COLOR = "#a08820";

// Shared Material Component - Гүйцэтгэл сайжруулах үүднээс
const SharedLineMaterial = ({ opacity }: { opacity: number }) => (
  <lineBasicMaterial
    color={MAIN_COLOR}
    transparent
    opacity={opacity}
    depthWrite={false}
  />
);

const BackgroundImage = memo(() => {
  const wallTexture = useTexture("/textures/gallery/geometry.png");

  // Текстурын чанарыг сайжруулах тохиргоо
  useEffect(() => {
    if (wallTexture) {
      wallTexture.minFilter = THREE.LinearFilter;
      wallTexture.generateMipmaps = false;
    }
  }, [wallTexture]);

  return (
    <mesh position={[0, 0, -80]} renderOrder={-999}>
      <planeGeometry args={[180, 100]} />
      <meshBasicMaterial
        map={wallTexture}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
});
BackgroundImage.displayName = "BackgroundImage";

const CircleOutline = memo(() => {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(Math.cos(a), Math.sin(a), 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const radGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));
    return g;
  }, []);

  // Санах ойг цэвэрлэх (Memory Leak-ээс сэргийлэх)
  useEffect(() => {
    return () => {
      geo.dispose();
      radGeo.dispose();
    };
  }, [geo, radGeo]);

  return (
    <group>
      <line geometry={geo}>
        <SharedLineMaterial opacity={0.5} />
      </line>
      <line geometry={radGeo}>
        <SharedLineMaterial opacity={0.4} />
      </line>
      <Text position={[0.52, 0.12, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">
        r
      </Text>
    </group>
  );
});
CircleOutline.displayName = "CircleOutline";

const TriangleOutline = memo(() => {
  const outerGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.1, 0, -1.0, -0.55, 0, 1.0, -0.55, 0, 0, 1.1, 0], 3));
    return g;
  }, []);

  const hGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.1, 0, 0, -0.55, 0], 3));
    return g;
  }, []);

  const raGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, -0.55, 0, 0, -0.38, 0, 0.17, -0.38, 0, 0.17, -0.55, 0], 3));
    return g;
  }, []);

  useEffect(() => {
    return () => {
      outerGeo.dispose();
      hGeo.dispose();
      raGeo.dispose();
    };
  }, [outerGeo, hGeo, raGeo]);

  return (
    <group>
      <line geometry={outerGeo}>
        <SharedLineMaterial opacity={0.5} />
      </line>
      <line geometry={hGeo}>
        <SharedLineMaterial opacity={0.3} />
      </line>
      <line geometry={raGeo}>
        <SharedLineMaterial opacity={0.35} />
      </line>
      <Text position={[0.14, -0.2, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">
        h
      </Text>
      <Text position={[0, -0.76, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">
        a
      </Text>
    </group>
  );
});
TriangleOutline.displayName = "TriangleOutline";

const RectangleOutline = memo(() => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-1, 0.6, 0, 1, 0.6, 0, 1, -0.6, 0, -1, -0.6, 0, -1, 0.6, 0], 3));
    return g;
  }, []);

  useEffect(() => {
    return () => geo.dispose();
  }, [geo]);

  return (
    <group>
      <line geometry={geo}>
        <SharedLineMaterial opacity={0.5} />
      </line>
      <Text position={[0, 0.76, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">
        a
      </Text>
      <Text position={[1.18, 0, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">
        b
      </Text>
    </group>
  );
});
RectangleOutline.displayName = "RectangleOutline";

const CoordOutline = memo(() => {
  const axesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-1.1, 0, 0, 1.2, 0, 0, 0, -1.1, 0, 0, 1.2, 0], 3));
    return g;
  }, []);

  const hypoGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.8, 0.85, 0], 3));
    return g;
  }, []);

  useEffect(() => {
    return () => {
      axesGeo.dispose();
      hypoGeo.dispose();
    };
  }, [axesGeo, hypoGeo]);

  return (
    <group>
      <lineSegments geometry={axesGeo}>
        <SharedLineMaterial opacity={0.5} />
      </lineSegments>
      <line geometry={hypoGeo}>
        <SharedLineMaterial opacity={0.4} />
      </line>
      <Text position={[1.28, 0, 0]} fontSize={0.2} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">
        x
      </Text>
      <Text position={[0, 1.28, 0]} fontSize={0.2} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="bottom">
        y
      </Text>
    </group>
  );
});
CoordOutline.displayName = "CoordOutline";

// ─── Floating diagrams ─────────────────────────────────────────────────────────

const SHAPES = [CircleOutline, TriangleOutline, RectangleOutline, CoordOutline] as const;

interface ConfigItem {
  formula: string;
  pos: readonly [number, number, number];
  scale: number;
  rotY: number;
  phase: number;
}

const CONFIGS: ConfigItem[] = [
  { formula: "S = π · r²", pos: [-10, 2.0, -16], scale: 3.2, rotY: 0.15, phase: 0.0 },
  { formula: "S = ½ · a · h", pos: [9, 3.0, -19], scale: 2.8, rotY: -0.18, phase: 1.5 },
  { formula: "S = a · b", pos: [-11, 1.5, -22], scale: 2.5, rotY: 0.12, phase: 2.8 },
  { formula: "a² + b² = c²", pos: [10, 0.8, -14], scale: 2.3, rotY: -0.14, phase: 4.1 },
];

const FloatingDiagram = memo(({ idx }: { idx: number }) => {
  const ref = useRef<THREE.Group>(null!);
  const cfg = CONFIGS[idx];
  const Shape = SHAPES[idx];

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // Delta ашиглан өндөр Hz дэлгэц дээр ч зөөлөн хөдөлнө
    ref.current.position.y = cfg.pos[1] + Math.sin(t * 0.35 + cfg.phase) * 0.38;
    ref.current.rotation.y += cfg.rotY * delta;
  });

  return (
    <group ref={ref} position={cfg.pos} scale={cfg.scale}>
      <Shape />
      <Text position={[0, -1.6, 0]} fontSize={0.27} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">
        {cfg.formula}
      </Text>
    </group>
  );
});
FloatingDiagram.displayName = "FloatingDiagram";

const GeometryBackground = memo(() => (
  <group>
    <BackgroundImage />

    {/* Доорх сетка тор */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -10]}>
      <planeGeometry args={[50, 36, 25, 18]} />
      <meshBasicMaterial color="#c0a840" wireframe transparent opacity={0.22} depthWrite={false} />
    </mesh>

    {CONFIGS.map((_, i) => (
      <FloatingDiagram key={i} idx={i} />
    ))}

    {/* Алсын бөмбөрцөг гэрэлтүүлэг */}
    <mesh position={[0, 4, -18]}>
      <sphereGeometry args={[48, 32, 32]} />
      <meshBasicMaterial color="#e8d878" side={THREE.BackSide} transparent opacity={0.72} depthWrite={false} />
    </mesh>
  </group>
));
GeometryBackground.displayName = "GeometryBackground";

export default GeometryBackground;