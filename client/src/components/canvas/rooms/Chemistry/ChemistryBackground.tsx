import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const FONT = '/fonts/CabinSketch-Bold.ttf';
const LINE_COLOR = '#5a8070';
const TEXT_COLOR = '#4a6e5e';
const DECOR_COLOR = '#6b9080';

// ─── Atom diagram ─────────────────────────────────────────────────────────────

const AtomOutline = memo(() => {
  const nucleusGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      pts.push(Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const orbitGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= 56; i++) {
      const a = (i / 56) * Math.PI * 2;
      pts.push(Math.cos(a) * 1.0, Math.sin(a) * 0.38, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useEffect(() => () => { nucleusGeo.dispose(); orbitGeo.dispose(); }, [nucleusGeo, orbitGeo]);

  return (
    <group>
      <line geometry={nucleusGeo}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.75} depthWrite={false} />
      </line>
      {[0, Math.PI / 3, -Math.PI / 3].map((rot, i) => (
        <group key={i} rotation={[0, 0, rot]}>
          <line geometry={orbitGeo}>
            <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.45} depthWrite={false} />
          </line>
        </group>
      ))}
    </group>
  );
});
AtomOutline.displayName = 'AtomOutline';

// ─── H₂O molecule (V shape) ───────────────────────────────────────────────────

const H2OMolecule = memo(() => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.65, -0.42, 0,  0, 0, 0,
       0.65, -0.42, 0,  0, 0, 0,
    ], 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.65} depthWrite={false} />
      </lineSegments>
      <Text position={[0, 0.26, 0]} fontSize={0.28} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">O</Text>
      <Text position={[-0.78, -0.58, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">H</Text>
      <Text position={[0.78, -0.58, 0]} fontSize={0.22} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">H</Text>
    </group>
  );
});
H2OMolecule.displayName = 'H2OMolecule';

// ─── CO₂ molecule (linear) ────────────────────────────────────────────────────

const CO2Molecule = memo(() => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.85, 0, 0, 0.85, 0, 0], 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <line geometry={geo}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.65} depthWrite={false} />
      </line>
      <Text position={[0, 0.26, 0]} fontSize={0.28} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">C</Text>
      <Text position={[-0.96, 0.26, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">O</Text>
      <Text position={[0.96, 0.26, 0]} fontSize={0.24} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">O</Text>
    </group>
  );
});
CO2Molecule.displayName = 'CO2Molecule';

// ─── NH₃ molecule (trigonal pyramid base) ────────────────────────────────────

const NH3Molecule = memo(() => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
       0,     0,     0,   0,     -0.7,  0,
       0,     0,     0,  -0.65,   0.35, 0,
       0,     0,     0,   0.65,   0.35, 0,
    ], 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={LINE_COLOR} transparent opacity={0.65} depthWrite={false} />
      </lineSegments>
      <Text position={[0, 0.22, 0]} fontSize={0.26} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">N</Text>
      <Text position={[0, -0.9, 0]} fontSize={0.2} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">H</Text>
      <Text position={[-0.8, 0.42, 0]} fontSize={0.2} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">H</Text>
      <Text position={[0.8, 0.42, 0]} fontSize={0.2} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">H</Text>
    </group>
  );
});
NH3Molecule.displayName = 'NH3Molecule';

// ─── Floating molecule configs ─────────────────────────────────────────────────

const SHAPES = [H2OMolecule, CO2Molecule, AtomOutline, NH3Molecule] as const;

interface MolConfig {
  formula: string;
  pos: readonly [number, number, number];
  scale: number;
  rotY: number;
  phase: number;
}

const CONFIGS: MolConfig[] = [
  { formula: 'H₂O',        pos: [-12, 3.5, -18],  scale: 3.2, rotY:  0.12, phase: 0.0 },
  { formula: 'CO₂',        pos: [ 11, 4.0, -22],  scale: 2.8, rotY: -0.15, phase: 1.8 },
  { formula: 'Atom',       pos: [-11, -1.5, -24], scale: 3.0, rotY:  0.10, phase: 3.0 },
  { formula: 'NH₃',        pos: [ 10, -1.5, -17], scale: 2.6, rotY: -0.12, phase: 4.5 },
];

const FloatingMolecule = memo(({ idx }: { idx: number }) => {
  const ref = useRef<THREE.Group>(null!);
  const cfg = CONFIGS[idx];
  const Shape = SHAPES[idx];

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = cfg.pos[1] + Math.sin(t * 0.32 + cfg.phase) * 0.5;
    ref.current.rotation.y += cfg.rotY * delta;
  });

  return (
    <group ref={ref} position={cfg.pos} scale={cfg.scale}>
      <Shape />
      {cfg.formula !== 'Atom' && (
        <Text position={[0, -1.6, 0]} fontSize={0.28} color={TEXT_COLOR} font={FONT} anchorX="center" anchorY="middle">
          {cfg.formula}
        </Text>
      )}
    </group>
  );
});
FloatingMolecule.displayName = 'FloatingMolecule';

// ─── Background image & board ─────────────────────────────────────────────────

const BackgroundPlanes = memo(() => {
  const backTex = useTexture('/textures/studio/chemistry_back.png');
  const boardTex = useTexture('/textures/studio/chemistry_board.png');

  useEffect(() => {
    [backTex, boardTex].forEach(t => {
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    });
  }, [backTex, boardTex]);

  return (
    <>
      {/* Main background — crumpled paper chemistry sketch */}
      <mesh position={[0, 2, -65]} renderOrder={-999}>
        <planeGeometry args={[165, 93]} />
        <meshBasicMaterial map={backTex} depthWrite={false} depthTest={false} color="#f5f0e8" />
      </mesh>

      {/* Chemistry chalkboard, slightly left and back */}
      <mesh position={[-18, 3, -38]} rotation={[0, 0.28, 0]}>
        <planeGeometry args={[22, 12.5]} />
        <meshBasicMaterial map={boardTex} transparent alphaTest={0.05} side={THREE.DoubleSide} color="#e8e8e8" />
      </mesh>
    </>
  );
});
BackgroundPlanes.displayName = 'BackgroundPlanes';

// ─── Floating text decorations ────────────────────────────────────────────────

const BackgroundDecorations = memo(() => (
  <group position={[0, 0, -26]}>
    <Text position={[0, 10.5, -5]} fontSize={3.0} color={DECOR_COLOR} font={FONT} opacity={0.45} depthWrite={false}>
      CHEMISTRY
    </Text>
    <Text position={[-7, 4.5, -4]} fontSize={1.1} color={DECOR_COLOR} font={FONT} opacity={0.35} depthWrite={false}>
      2H₂ + O₂ → 2H₂O
    </Text>
    <Text position={[8, 5, -5]} fontSize={1.2} color={DECOR_COLOR} font={FONT} opacity={0.35} depthWrite={false}>
      PV = nRT
    </Text>
    <Text position={[-14, 0, -6]} fontSize={1.0} color={DECOR_COLOR} font={FONT} opacity={0.28} depthWrite={false}>
      pH = -log[H⁺]
    </Text>
    <Text position={[12, 0.5, -7]} fontSize={1.0} color={DECOR_COLOR} font={FONT} opacity={0.30} depthWrite={false}>
      ΔG = ΔH - TΔS
    </Text>
    <Text position={[-3, -3.5, -3]} fontSize={0.9} color={DECOR_COLOR} font={FONT} opacity={0.32} depthWrite={false}>
      n = m / M
    </Text>
    <Text position={[5, -4, -5]} fontSize={1.1} color={DECOR_COLOR} font={FONT} opacity={0.28} depthWrite={false}>
      C₆H₁₂O₆
    </Text>
    <Text position={[-12, 7, -7]} fontSize={0.9} color={DECOR_COLOR} font={FONT} opacity={0.25} depthWrite={false}>
      Kw = [H⁺][OH⁻]
    </Text>
    <Text position={[14, -4, -8]} fontSize={1.0} color={DECOR_COLOR} font={FONT} opacity={0.25} depthWrite={false}>
      Na · Cl → NaCl
    </Text>
  </group>
));
BackgroundDecorations.displayName = 'BackgroundDecorations';

// ─── Main export ──────────────────────────────────────────────────────────────

const ChemistryBackground = memo(() => (
  <group>
    <BackgroundPlanes />
    <BackgroundDecorations />

    {/* Floor grid — subtle teal */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -12]}>
      <planeGeometry args={[55, 38, 28, 18]} />
      <meshBasicMaterial color="#4a8070" wireframe transparent opacity={0.18} depthWrite={false} />
    </mesh>

    {/* Sky sphere — warm cream */}
    <mesh position={[0, 6, -22]}>
      <sphereGeometry args={[55, 32, 32]} />
      <meshBasicMaterial color="#eef5f0" side={THREE.BackSide} transparent opacity={0.80} depthWrite={false} />
    </mesh>

    {CONFIGS.map((_, i) => (
      <FloatingMolecule key={i} idx={i} />
    ))}
  </group>
));
ChemistryBackground.displayName = 'ChemistryBackground';

export default ChemistryBackground;
