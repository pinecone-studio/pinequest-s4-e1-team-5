'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Stars,
  Float,
  Text,
  PerspectiveCamera,
  ContactShadows,
} from '@react-three/drei';
import { MOLECULES } from '@/constants/molecules';
import * as THREE from 'three';
import { ArrowLeftIcon, MagnifyingGlassIcon, BeakerIcon, ListBulletIcon, XMarkIcon } from '@heroicons/react/24/outline';

function MoleculeModel({ atoms, bonds }: any) {
  const groupRef = useRef<THREE.Group>(null!);
  return (
    <group ref={groupRef}>
      {atoms.map((atom: any, i: number) => (
        <mesh key={i} position={atom.position}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshPhysicalMaterial color={atom.color} metalness={0.9} roughness={0.1} clearcoat={1} emissive={atom.color} emissiveIntensity={0.2} />
          <Text position={[0, 0, 0.65]} fontSize={0.25} color="white" fontWeight="bold">{atom.element}</Text>
        </mesh>
      ))}
      {bonds.map((bond: any, i: number) => {
        const start = new THREE.Vector3(...bond.start);
        const end = new THREE.Vector3(...bond.end);
        const distance = start.distanceTo(end);
        return (
          <mesh key={i} position={start.clone().lerp(end, 0.5)} onUpdate={(self) => self.lookAt(end)}>
            <cylinderGeometry args={[0.07, 0.07, distance, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(MOLECULES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredMolecules = MOLECULES.filter(
    (m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.formula.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen w-full bg-[#010101] text-white overflow-hidden selection:bg-emerald-500/30 font-sans">
      
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 lg:top-10 lg:left-10 z-[120] flex items-center gap-2 lg:gap-4 px-4 py-2 lg:px-6 lg:py-3 bg-black/50 backdrop-blur-3xl border border-white/10 rounded-xl lg:rounded-2xl transition-all group active:scale-95"
      >
        <ArrowLeftIcon className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
        <span className="text-[10px] lg:text-xs font-black tracking-[0.2em] uppercase">Буцах</span>
      </button>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-6 right-6 z-[120] p-3 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-xl"
      >
        {isSidebarOpen ? <XMarkIcon className="w-6 h-6 text-emerald-400" /> : <ListBulletIcon className="w-6 h-6 text-emerald-400" />}
      </button>

      <div className={`
        absolute z-[110] transition-all duration-500 ease-in-out
        ${isMobile 
          ? `bottom-0 left-0 w-full h-[60vh] bg-black/95 rounded-t-[3rem] border-t border-white/10 ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full'}`
          : 'top-10 right-10 w-96 max-h-[80vh] flex flex-col translate-y-0'
        }
      `}>
        <div className={`p-6 bg-black/40 backdrop-blur-3xl border border-white/10 ${isMobile ? 'rounded-t-[3rem]' : 'rounded-t-[2.5rem]'} border-b-0`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <BeakerIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xs font-black tracking-[0.5em] uppercase text-white/60">Database</h2>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              placeholder="Хайх..."
              className="w-full pl-12 pr-6 py-4 text-sm transition-all bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:bg-white/[0.08]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-b-[2.5rem] p-4 pt-0 space-y-3 custom-scrollbar">
          {filteredMolecules.map((mol) => (
            <button
              key={mol.id}
              onClick={() => { setSelected(mol); if(isMobile) setIsSidebarOpen(false); }}
              className={`w-full p-5 rounded-[1.8rem] text-left transition-all relative group border ${
                selected.id === mol.id ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-black tracking-tighter ${selected.id === mol.id ? 'text-emerald-400' : 'text-white'}`}>{mol.formula}</div>
                  <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold">{mol.name}</div>
                </div>
                {selected.id === mol.id && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 z-0">
          <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, isMobile ? 12 : 9]} fov={50} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1.5} />
            <ambientLight intensity={0.9} />
            <pointLight position={[10, 10, 10]} intensity={2.5} />
            <Suspense fallback={null}>
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <MoleculeModel atoms={selected.atoms} bonds={selected.bonds} /> 
              </Float>
              <ContactShadows position={[0, -3, 0]} opacity={0.5} scale={15} blur={3} far={5} />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={4} maxDistance={25} makeDefault autoRotate autoRotateSpeed={0.4} />
          </Canvas>
        </div>
        <div className="absolute bottom-0 left-0 z-10 w-full p-6 pointer-events-none lg:p-20 md:bottom-10">
          <div className="mx-auto duration-1000 pointer-events-auto max-w-7xl animate-in fade-in slide-in-from-bottom-20">
            <div className="flex flex-col items-start gap-4 mb-8 lg:flex-row lg:items-end lg:gap-12 lg:mb-12">
              <div className="relative">
                <h1 className="font-black leading-none tracking-tighter text-transparent text-[6rem] md:text-[10rem] lg:text-[14rem] bg-clip-text bg-gradient-to-b from-white via-white to-white/5">
                    {selected.formula}
                </h1>
                <div className="hidden md:block absolute w-8 h-8 lg:w-12 lg:h-12 border-t-[3px] border-r-[3px] -top-3 -right-3 lg:-top-6 lg:-right-6 border-emerald-500/40" />
              </div>
              
              <div className="flex flex-col gap-2 pb-2 lg:gap-6 lg:pb-10">
                <h2 className="text-3xl md:text-5xl font-black tracking-[0.1em] uppercase text-emerald-400">
                    {selected.name}
                </h2>
                <div className="flex flex-wrap gap-3 lg:gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 border bg-emerald-500/10 border-emerald-500/20 rounded-xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] lg:text-xs tracking-[0.2em] text-emerald-200 uppercase font-bold">Stable Structure</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 border bg-white/5 border-white/10 rounded-xl">
                        <span className="text-[9px] lg:text-xs tracking-[0.2em] text-gray-400 uppercase font-bold">{selected.atoms.length} Atoms detected</span>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="max-w-4xl">
                <p className="pl-6 lg:pl-12 text-sm md:text-xl lg:text-2xl font-light leading-relaxed border-l-[2px] lg:border-l-[3px] text-gray-300/80 border-emerald-500/40 italic">
                    {selected.description}
                </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full pointer-events-none h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 20px; }
      `}</style>
    </div>
  );
}
