import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";

const FONT = "/fonts/CabinSketch-Bold.ttf";

// Өнгөний тохиргоо
const MAIN_COLOR = "#8f7318";  
const TEXT_COLOR = "#786010";  
const DECOR_COLOR = "#a68b2d"; // Арын чимэглэл текстийн өнгө

interface SharedMaterialProps {
  opacity: number;
}

const SharedLineMaterial = ({ opacity }: SharedMaterialProps) => (
  <lineBasicMaterial
    color={MAIN_COLOR}
    transparent
    opacity={opacity}
    depthWrite={false}
  />
);

const BackgroundImage = memo(() => {
  const wallTexture = useTexture("/textures/gallery/geometry.png");

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

// ─── ЗАССАН ХЭСЭГ: "GEOMETRY"-Г ДЭЭШЛҮҮЛЖ, БУСАД ТОМ ҮГСИЙГ УСТГАВ ──────────────────
const BackgroundDecorations = memo(() => {
  return (
    <group position={[0, 0, -25]}>
      {/* GEOMETRY үгийг Y тэнхлэг дагуу 7 байсныг 11.5 болгож дээшлүүлэв (Картуудын дээр тод харагдана) */}
      <Text position={[0, 11.5, -5]} fontSize={3.2} color={DECOR_COLOR} font={FONT} opacity={0.55} depthWrite={false}>
        GEOMETRY
      </Text>

      {/* Жижиг математикийн тэмдэглэгээнүүд (Орон зайг дүүргэх хэвээр үлдээв) */}
      <Text position={[-6, 4, -4]} fontSize={1.2} color={DECOR_COLOR} font={FONT} opacity={0.4} depthWrite={false}>
        ∑ (x_i)
      </Text>
      <Text position={[7, 4, -5]} fontSize={1.5} color={DECOR_COLOR} font={FONT} opacity={0.4} depthWrite={false}>
        ∫ f(x)dx
      </Text>
      <Text position={[-15, -1, -5]} fontSize={1.4} color={DECOR_COLOR} font={FONT} opacity={0.3} depthWrite={false}>
        ∞
      </Text>
      <Text position={[12, 6, -7]} fontSize={1.1} color={DECOR_COLOR} font={FONT} opacity={0.4} depthWrite={false}>
        √x + y²
      </Text>
      <Text position={[-2, -3, -3]} fontSize={0.9} color={DECOR_COLOR} font={FONT} opacity={0.4} depthWrite={false}>
        f(x) = sin(x)
      </Text>

      {/* Грек үсгүүд болон өнцөг */}
      <Text position={[-11, 8, -6]} fontSize={1.0} color={DECOR_COLOR} font={FONT} opacity={0.3} depthWrite={false}>
        α + β = 90°
      </Text>
      <Text position={[3, -4, -4]} fontSize={1.2} color={DECOR_COLOR} font={FONT} opacity={0.35} depthWrite={false}>
        λ = v / f
      </Text>
      <Text position={[-14, 5, -8]} fontSize={1.3} color={DECOR_COLOR} font={FONT} opacity={0.25} depthWrite={false}>
        Δx → 0
      </Text>
      <Text position={[14, -4, -8]} fontSize={1.2} color={DECOR_COLOR} font={FONT} opacity={0.3} depthWrite={false}>
        π ≈ 3.1415
      </Text>
      <Text position={[-8, -5, -5]} fontSize={1.1} color={DECOR_COLOR} font={FONT} opacity={0.3} depthWrite={false}>
        matrix[A]
      </Text>
    </group>
  );
});
BackgroundDecorations.displayName = "BackgroundDecorations";

// ─── Геометрийн дүрсүүд ──────────────────────────────────────────────────
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

  useEffect(() => {
    return () => {
      geo.dispose();
      radGeo.dispose();
    };
  }, [geo, radGeo]);

  return (
    <group>
      <line geometry={geo}><SharedLineMaterial opacity={0.7} /></line>
      <line geometry={radGeo}><SharedLineMaterial opacity={0.6} /></line>
      <Text position={[0.52, 0.12, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">r</Text>
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
      <line geometry={outerGeo}><SharedLineMaterial opacity={0.7} /></line>
      <line geometry={hGeo}><SharedLineMaterial opacity={0.5} /></line>
      <line geometry={raGeo}><SharedLineMaterial opacity={0.55} /></line>
      <Text position={[0.14, -0.2, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">h</Text>
      <Text position={[0, -0.76, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">a</Text>
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
      <line geometry={geo}><SharedLineMaterial opacity={0.7} /></line>
      <Text position={[0, 0.76, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">a</Text>
      <Text position={[1.18, 0, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">b</Text>
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
      <lineSegments geometry={axesGeo}><SharedLineMaterial opacity={0.7} /></lineSegments>
      <line geometry={hypoGeo}><SharedLineMaterial opacity={0.6} /></line>
      <Text position={[1.28, 0, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="left" anchorY="middle">x</Text>
      <Text position={[0, 1.28, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="bottom">y</Text>
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
  { formula: "S = π · r²", pos: [-11, 2.2, -15], scale: 3.5, rotY: 0.15, phase: 0.0 },
  { formula: "S = ½ · a · h", pos: [10, 3.2, -18], scale: 3.0, rotY: -0.18, phase: 1.5 },
  { formula: "S = a · b", pos: [-12, -1.0, -20], scale: 2.8, rotY: 0.12, phase: 2.8 },
  { formula: "a² + b² = c²", pos: [11, -1.5, -14], scale: 2.5, rotY: -0.14, phase: 4.1 },
];

const FloatingDiagram = memo(({ idx }: { idx: number }) => {
  const ref = useRef<THREE.Group>(null!);
  const cfg = CONFIGS[idx];
  const Shape = SHAPES[idx];

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = cfg.pos[1] + Math.sin(t * 0.35 + cfg.phase) * 0.4;
    ref.current.rotation.y += cfg.rotY * delta;
  });

  return (
    <group ref={ref} position={cfg.pos} scale={cfg.scale}>
      <Shape />
      <Text
        position={[0, -1.7, 0]}
        fontSize={0.3}
        color={TEXT_COLOR}
        font={FONT}
        anchorX="center"
        anchorY="middle"
      >
        {cfg.formula}
      </Text>
    </group>
  );
});
FloatingDiagram.displayName = "FloatingDiagram";

const GeometryBackground = memo(() => (
  <group>
    <BackgroundImage />

    {/* Арын хоосон орон зайг дүүргэх чимэглэлүүд */}
    <BackgroundDecorations />

    {/* Доорх сетка тор */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, -10]}>
      <planeGeometry args={[60, 40, 30, 20]} />
      <meshBasicMaterial
        color="#b59c40" 
        wireframe
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>

    {CONFIGS.map((_, i) => (
      <FloatingDiagram key={i} idx={i} />
    ))}

    {/* Алсын бөмбөрцөг гэрэлтүүлэг */}
    <mesh position={[0, 5, -22]}>
      <sphereGeometry args={[50, 32, 32]} />
      <meshBasicMaterial
        color="#e3caa2" 
        side={THREE.BackSide}
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </mesh>
  </group>
));
GeometryBackground.displayName = "GeometryBackground";

export default GeometryBackground;