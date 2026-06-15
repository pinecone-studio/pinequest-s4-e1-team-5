'use client';
import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Text,
  Float,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei';
import {
  Trash2,
  ChevronLeftIcon,
  Sparkles,
  BookOpen,
  Loader2,
  Beaker,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import * as THREE from 'three';

const detectMolecule = (atoms: any[]) => {
  if (atoms.length === 0) return 'Хоосон';

  const counts: any = {};
  atoms.forEach((a) => (counts[a.type] = (counts[a.type] || 0) + 1));

  if (counts['C'] === 2 && counts['H'] === 6 && counts['O'] === 1) return 'Этанол (C2H5OH)';
  if (counts['C'] === 1 && counts['H'] === 4 && counts['O'] === 1) return 'Метанол (CH3OH)';
  if (counts['C'] === 2 && counts['H'] === 4 && counts['O'] === 2) return 'Цууны хүчил (CH3COOH)';

  const priority = ['Na', 'Mg', 'Ca', 'Fe', 'Mn', 'Ag', 'Si', 'C', 'N', 'H', 'S', 'O', 'Cl', 'F'];
 
    const sortedAtoms = Object.entries(counts).sort(([a], [b]) => {
    let indexA = priority.indexOf(a);
    let indexB = priority.indexOf(b);
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;
    return indexA - indexB;
  });

  const formula = sortedAtoms.map(([t, c]) => `${t}${c > 1 ? c : ''}`).join('');

  const names: any = {
    H2O: 'Ус (H₂O)',
    CO2: 'Нүүрсхүчлийн хий (CO₂)',
    NaCl: 'Хоолны давс (NaCl)',
    HCl: 'Давсны хүчил (HCl)',
    O2: 'Хүчилтөрөгч (O₂)',
    NH3: 'Аммиак (NH₃)',
    CH4: 'Метан (CH₄)',
    H2SO4: 'Хүхрийн хүчил (H₂SO₄)',
    SiO2: 'Элс (SiO₂)',
    MgO: 'Магнийн исэл (MgO)',
    Fe2O3: 'Зэв (Fe₂O₃)',
    N2: 'Азот(N₂)',
    O3: 'Озон(O₃)',
    C6H12O6: 'Глюкоз(C₆H₁₂O₆)',
    C2H5OH: 'Этанол (C₂H₅OH)',
    CH3COOH: 'Цууны хүчил (H₃COOH)',
    C6H6: 'Бензол (C₆H₆)',
    C3H8: 'Пропан (C₃H₈)',
    CaCO3: 'Шохой (CaCO₃)',
    HF: 'Фторт устөрөгч (HF)',
    N2O: 'Азотын исэл (N₂O)',
    C2H2: 'Ацетилен (C₂H₂)',
    CH2O: 'Формальдегид (CH₂O)',
    AgNO3: 'Мөнгөний нитрат (AgNO₃)',
    NaOH: 'Идэмхий натри (NaOH)',
    KMnO4: 'Калийн перманганат (KMnO₄)',
    CHCl3: 'Хлороформ (CHCl₃)',
    SO2: 'Хүхэрлэг хий (SO₂)',
    NaHC03: 'Хүнсний сод (NaHCO₃)',
  };
  return names[formula] || `Нэгдэл (${formula})`;
};

function MoleculeBonds({ atoms }: { atoms: any[] }) {
  const threshold = 2.5;
  const lines = useMemo(() => {
    const b = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const p1 = new THREE.Vector3(...atoms[i].position);
        const p2 = new THREE.Vector3(...atoms[j].position);
        if (p1.distanceTo(p2) < threshold) {
          b.push({ id: `${atoms[i].id}-${atoms[j].id}`, start: p1, end: p2, dist: p1.distanceTo(p2) });
        }
      }
    }
    return b;
  }, [atoms]);

  return (
    <group>
      {lines.map((l) => {
        const mid = new THREE.Vector3().addVectors(l.start, l.end).multiplyScalar(0.5);
        return (
          <mesh key={l.id} position={mid} onUpdate={(s) => s.lookAt(l.end)}>
            <cylinderGeometry args={[0.08, 0.08, l.dist, 12]} />
            <meshStandardMaterial color="white" opacity={0.3} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function Atom3D({ atom, onUpdate, color }: any) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        position={atom.position}
        onPointerMove={(e) => {
          if (e.buttons === 1) onUpdate(atom.id, [e.point.x, e.point.y, 0]);
        }}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.8} roughness={0.1} />
        <Text position={[0, 0, 0.7]} fontSize={0.4} color="white" fontWeight="bold">
          {atom.type}
        </Text>
      </mesh>
    </Float>
  );
}

export default function FullChemistryLab() {
  const [atoms, setAtoms] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

 const ATOM_TYPES = [
    { type: 'H', color: '#ffffff', name: 'Устөрөгч' },
    { type: 'O', color: '#ff4444', name: 'Хүчилтөрөгч' },
    { type: 'C', color: '#4b5563', name: 'Нүүрстөрөгч' },
    { type: 'N', color: '#3b82f6', name: 'Азот' },
    { type: 'Cl', color: '#1ff01f', name: 'Хлор' },
    { type: 'Na', color: '#ab5cf2', name: 'Натри' },
    { type: 'S', color: '#ffff33', name: 'Хүхэр' },
    { type: 'Ca', color: '#3f3f3f', name: 'Кальци' },
    { type: 'Si', color: '#f5deb3', name: 'Цахиур' },
    { type: 'F', color: '#90ee90', name: 'Фтор' },
    { type: 'Ag', color: '#c0c0c0', name: 'Мөнгө' },
    { type: 'Mn', color: '#e066ff', name: 'Манган' },
    { type: 'Mg', color: '#15803d', name: 'Магни' },
    { type: 'Fe', color: '#ffa500', name: 'Төмөр' },
    { type: 'K', color: '#ffa500', name: 'Кали' },
  ];
  const handleSolve = async () => {
    if (!query) return;
    setLoading(true);
    setResult('AI тооцоолж байна...');
    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });
      const data = await res.json();
      setResult(data.answer || data.error);
    } catch {
      setResult('Холболтын алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white p-4 font-sans overflow-hidden">
      <header className="flex items-center justify-between max-w-full p-4 mx-auto mb-4 border bg-white/5 backdrop-blur-xl rounded-2xl border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/chemistry/formulas" className="p-2 transition-all rounded-full hover:bg-white/10">
            <ChevronLeftIcon />
          </Link>
          <div className="flex items-center gap-2">
            <Beaker className="w-6 h-6 text-emerald-500" />
            <h1 className="text-lg font-black tracking-tighter uppercase">
              CHEMISTRY <span className="text-emerald-500">LAB</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 border bg-black/40 rounded-xl border-emerald-500/20">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Илэрсэн:</span>
            <span className="font-bold text-emerald-400">{detectMolecule(atoms)}</span>
          </div>
          <button onClick={() => setAtoms([])} className="p-2 text-red-400 transition-colors hover:bg-red-500/10 rounded-xl">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

     
      <main className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        
    
        <div className="relative overflow-hidden border shadow-inner lg:col-span-8 bg-gradient-to-b from-slate-900/50 to-black/50 rounded-2xl border-white/10">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-h-[90%] overflow-y-auto custom-scrollbar p-2">
            {ATOM_TYPES.map((a) => (
              <button
                key={a.type}
                onClick={() => setAtoms([...atoms, { id: Date.now(), type: a.type, color: a.color, position: [0, 0, 0] }])}
                className="flex flex-col items-center justify-center transition-all border group w-14 h-14 rounded-xl hover:scale-110 active:scale-95"
                style={{ backgroundColor: `${a.color}10`, borderColor: `${a.color}30`, color: a.color }}
              >
                <span className="text-xs font-black">{a.type}</span>
              </button>
            ))}
          </div>

          <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, 12]} />
            <Stars count={1000} factor={4} fade speed={1} />
            <ambientLight intensity={1} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Suspense fallback={null}>
              <MoleculeBonds atoms={atoms} />
              {atoms.map((a) => (
                <Atom3D key={a.id} atom={a} color={a.color} onUpdate={(id: any, pos: any) => 
                  setAtoms(prev => prev.map(at => at.id === id ? { ...at, position: pos } : at))
                } />
              ))}
              <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} />
            </Suspense>
            <OrbitControls enablePan={false} makeDefault />
          </Canvas>

          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-gray-400">
            <Info size={12} className="text-emerald-500" />
            <span>Атомыг чирч холбоно уу</span>
          </div>
        </div>

     
        <div className="flex flex-col h-full gap-4 overflow-hidden lg:col-span-4">
          <div className="flex flex-col h-full p-6 overflow-hidden border bg-slate-900/40 backdrop-blur-md rounded-2xl border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Ухаалаг Туслах</h3>
                <p className="text-[9px] text-emerald-500 font-bold tracking-[0.2em] uppercase"> Chemistry</p>
              </div>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Бодлогоо энд бичнэ үү..."
                className="w-full p-4 pr-24 text-sm transition-all border outline-none bg-black/40 border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
              />
              <button
                onClick={handleSolve}
                disabled={loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'БОД'}
              </button>
            </div>

            <div className="flex-1 min-h-0 p-4 overflow-y-auto border bg-black/20 rounded-xl border-white/5 custom-scrollbar">
              <div className="flex items-center gap-2 text-emerald-500 font-bold mb-3 text-[10px] uppercase tracking-widest">
                <BookOpen size={14} /> Бодолтын үр дүн
              </div>
              <div className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                {result || "Асуултаа оруулна уу. AI танд алхам алхмаар тайлбарлаж өгнө."}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.6); }
      `}</style> */}
    </div>
  );
}
 
 