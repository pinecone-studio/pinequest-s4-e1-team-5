import { useMemo } from "react";
import { useTexture, Text } from "@react-three/drei";
import * as THREE from "three";

const FLOOR_Y = -1.75;
const CEIL_Y = 1.75;
const LW = -3.5;
const RW = 3.5;

// Safe z zones (relative to zOffset):
// Left wall holes:  Math [z-20, z-16], Physics [z-50, z-46]
// Right wall holes: Chemistry [z-34, z-30], Geometry [z-64, z-60]

// ── 3D ШҮҮГЭ (геометрийн өрөөний ойролцоо, баруун хана) ─────────────────
function Cabinet3D({ z }: { z: number }) {
  // Cabinet is against the right wall (x = RW = 3.5)
  // Depth along -x direction into corridor: 0.42
  const depth = 0.42;
  const cx = RW - depth / 2 - 0.02; // body center x
  const frontX = RW - depth - 0.02; // front face x
  const bodyH = 1.46;
  const cy = FLOOR_Y + bodyH / 2;

  return (
    <group>
      {/* Их бие */}
      <mesh position={[cx, cy, z]}>
        <boxGeometry args={[depth, bodyH, 0.88]} />
        <meshBasicMaterial color="#c2b078" />
      </mesh>
      {/* Дээд тал (бага зэрэг гадагш) */}
      <mesh position={[cx - 0.02, FLOOR_Y + bodyH + 0.025, z]}>
        <boxGeometry args={[depth + 0.04, 0.05, 0.93]} />
        <meshBasicMaterial color="#d4c888" />
      </mesh>
      {/* Доод суурь */}
      <mesh position={[cx, FLOOR_Y + 0.04, z]}>
        <boxGeometry args={[depth + 0.02, 0.08, 0.9]} />
        <meshBasicMaterial color="#a09060" />
      </mesh>
      {/* Зүүн хаалга */}
      <mesh position={[frontX - 0.015, cy + 0.04, z - 0.225]}>
        <boxGeometry args={[0.04, bodyH * 0.82, 0.385]} />
        <meshBasicMaterial color="#cdbf7a" />
      </mesh>
      {/* Баруун хаалга */}
      <mesh position={[frontX - 0.015, cy + 0.04, z + 0.225]}>
        <boxGeometry args={[0.04, bodyH * 0.82, 0.385]} />
        <meshBasicMaterial color="#cdbf7a" />
      </mesh>
      {/* Хаалганы хооронд хуваах тулгуур */}
      <mesh position={[frontX - 0.02, cy, z]}>
        <boxGeometry args={[0.035, bodyH * 0.9, 0.035]} />
        <meshBasicMaterial color="#9a8a58" />
      </mesh>
      {/* Зүүн хаалганы бариул */}
      <mesh position={[frontX - 0.06, cy, z - 0.07]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.07, 8]} />
        <meshBasicMaterial color="#888070" />
      </mesh>
      {/* Баруун хаалганы бариул */}
      <mesh position={[frontX - 0.06, cy, z + 0.07]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.07, 8]} />
        <meshBasicMaterial color="#888070" />
      </mesh>
    </group>
  );
}

// ── ХАНАН ПОСТЕР HELPER ───────────────────────────────────────────────────
function WallPoster({
  side,
  pz,
  py,
  w,
  h,
  texture,
  color = "#e8e8e8",
}: {
  side: "left" | "right";
  pz: number;
  py: number;
  w: number;
  h: number;
  texture: THREE.Texture;
  color?: string;
}) {
  const x = side === "left" ? LW + 0.025 : RW - 0.025;
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <mesh position={[x, py, pz]} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        color={color}
        map={texture}
        transparent
        alphaTest={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── ХАНАН ТЕКСТ HELPER ────────────────────────────────────────────────────
function WallText({
  side,
  pz,
  py = 0.4,
  text,
  size = 0.22,
  color = "#333333",
}: {
  side: "left" | "right";
  pz: number;
  py?: number;
  text: string;
  size?: number;
  color?: string;
}) {
  const x = side === "left" ? LW + 0.04 : RW - 0.04;
  const rotY = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <Text
      position={[x, py, pz]}
      rotation={[0, rotY, 0]}
      font="/fonts/CabinSketch-Bold.ttf"
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={2.5}
      textAlign="center"
    >
      {text}
    </Text>
  );
}

// ── ҮНДСЭН COMPONENT ──────────────────────────────────────────────────────
interface Props {
  zOffset: number;
}

export default function CorridorDecorations({ zOffset: z }: Props) {
  const t = useTexture({
    drzewo:       "/textures/corridor/drzewkowdoniczce.webp",
    kratanalampy: "/textures/corridor/kratanalampy.webp",
    bokilampy:    "/textures/corridor/bokilampy.webp",
    kratkawent:   "/textures/corridor/kratkawentylacyjna.webp",
    ramkaDuza:    "/textures/corridor/ramkanazdjecieduza.webp",
    ramkaMala:    "/textures/corridor/ramkanazdjeciemala.webp",
    obraz1:       "/textures/corridor/rysuneknaobraz1.webp",
    obraz3:       "/textures/corridor/rysuneknaobrazek3.webp",
    kaffeDebug:   "/textures/corridor/decorations/coffee_debug.webp",
    whileLoop:    "/textures/corridor/decorations/while_true_loop.webp",
    ideaProcess:  "/textures/corridor/decorations/idea_process.webp",
    papierLot:    "/textures/corridor/decorations/paper_airplane.webp",
    pilka:        "/textures/corridor/decorations/paper_ball.webp",
    olowek:       "/textures/corridor/decorations/pencil.webp",
  });

  useMemo(() => {
    Object.values(t).forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }, [t]);

  const FX = [-Math.PI / 2, 0, 0] as [number, number, number];

  // Мод спрайтын хаа — математикийн өрөөний өмнө (зүүн хана, z-13)
  // Cross pattern → бүх талаас бодит мод шиг харагдана
  const treeX = LW + 0.46;
  const treeZ = z - 13;
  const treeH = 1.6;
  const treeW = 0.8;
  const treeY = FLOOR_Y + treeH / 2;

  return (
    <group>
      {/* ── ТААЗ ЛАМПУУД ──────────────────────────────────────────────── */}
      {[z - 10, z - 30, z - 52].map((lz, i) => (
        <group key={`lamp-${i}`}>
          <mesh position={[0, CEIL_Y - 0.01, lz]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color="#f0f0f0" map={t.kratanalampy} transparent alphaTest={0.05} />
          </mesh>
          <mesh position={[0, CEIL_Y - 0.32, lz]}>
            <planeGeometry args={[1.2, 0.075]} />
            <meshBasicMaterial color="#f0f0f0" map={t.bokilampy} />
          </mesh>
        </group>
      ))}

      {/* ── МОД — drzewkowdoniczce.webp, cross sprites, math өрөөний өмнө ── */}
      {/* Plane 1: ханатай параллель, коридорт харагдана */}
      <mesh position={[treeX, treeY, treeZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[treeW, treeH]} />
        <meshBasicMaterial
          color="#ffffff"
          map={t.drzewo}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Plane 2: перпендикуляр, гүн өгнө */}
      <mesh position={[treeX, treeY, treeZ]}>
        <planeGeometry args={[treeW, treeH]} />
        <meshBasicMaterial
          color="#ffffff"
          map={t.drzewo}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── ХАНАН ТЕКСТҮҮД ──────────────────────────────────────────────── */}
      {/* Баруун хана — химийн өмнө */}
      <WallText side="right" pz={z - 14} py={0.42} text={"E = mc²"} size={0.28} color="#334455" />

      {/* Зүүн хана — физик ба математикийн хооронд */}
      <WallText side="left" pz={z - 32} py={0.55} text={"F = ma"} size={0.28} color="#334433" />

      {/* Баруун хана — хими ба геометрийн хооронд */}
      <WallText side="right" pz={z - 40} py={0.42} text={"π ≈ 3.14"} size={0.24} color="#443344" />

      {/* ── ЗҮҮН ХАНЫ ЧИМЭГЛЭЛ ─────────────────────────────────────────── */}
      {/* Том зургийн хүрэ (z-5, before Math door zone z-16) */}
      <WallPoster side="left" pz={z - 5} py={0.38} w={1.7} h={0.85} texture={t.ramkaDuza} color="#e2e2e2" />
      <WallPoster side="left" pz={z - 5} py={0.38} w={1.4} h={0.70} texture={t.obraz3}    color="#ebebeb" />

      {/* Idea Process постер (z-24) */}
      <WallPoster side="left" pz={z - 24} py={0.2} w={0.7} h={1.4} texture={t.ideaProcess} />

      {/* Жижиг зургийн хүрэ (z-38) */}
      <WallPoster side="left" pz={z - 38} py={0.35} w={0.5}  h={1.0} texture={t.ramkaMala} color="#e2e2e2" />
      <WallPoster side="left" pz={z - 38} py={0.35} w={0.4}  h={0.8} texture={t.obraz1}    color="#ebebeb" />

      {/* Агааржуулагч (z-57) */}
      <WallPoster side="left" pz={z - 57} py={1.18} w={0.9} h={0.45} texture={t.kratkawent} color="#d0d0d0" />

      {/* ── БАРУУН ХАНЫ ЧИМЭГЛЭЛ ────────────────────────────────────────── */}
      {/* Coffee Debug постер (z-8) */}
      <WallPoster side="right" pz={z - 8}  py={0.28} w={1.5} h={0.75} texture={t.kaffeDebug} />

      {/* While True Loop постер (z-20) */}
      <WallPoster side="right" pz={z - 20} py={0.28} w={1.5} h={0.75} texture={t.whileLoop} />

      {/* Агааржуулагч (z-42) */}
      <WallPoster side="right" pz={z - 42} py={1.18} w={0.7} h={0.35} texture={t.kratkawent} color="#d0d0d0" />

      {/* ── 3D ШҮҮГЭ — баруун хана, геометрийн ойролцоо (z-55) ─────────── */}
      <Cabinet3D z={z - 55} />

      {/* ── ШАЛАН ЖИЖИГ ЗҮЙЛС ───────────────────────────────────────────── */}
      {/* Цаасан онгоц */}
      <mesh position={[-0.65, FLOOR_Y + 0.018, z - 27]} rotation={[FX[0], FX[1], -0.8]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial color="#e8e8e8" map={t.papierLot} transparent alphaTest={0.1} />
      </mesh>

      {/* Бутарсан цаас */}
      <mesh position={[0.85, FLOOR_Y + 0.018, z - 43]} rotation={[FX[0], FX[1], 0.3]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#e8e8e8" map={t.pilka} transparent alphaTest={0.1} />
      </mesh>

      {/* Харандаа */}
      <mesh position={[-0.4, FLOOR_Y + 0.018, z - 59]} rotation={[FX[0], FX[1], 1.2]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshBasicMaterial color="#e8e8e8" map={t.olowek} transparent alphaTest={0.1} />
      </mesh>
    </group>
  );
}
