'use client';

import React, { useRef, useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Text,
  Float,
  Stars,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { ELEMENTS } from '@/constants/element';
import { useFrame } from '@react-three/fiber';

function ElementBox({ symbol, name, number, category, position, onSelect, ele }: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const getColor = () => {
    switch (category) {
      case 'nonmetal': return '#60A5FA';
      case 'noble-gas': return '#78350F';
      case 'alkali-metal': return '#10B981';
      case 'alkaline-earth': return '#EF4444';
      case 'metalloid': return '#8b5cf6';
      case 'post-transition-metal': return '#D9F99D';
      case 'transition-metal': return '#eab308';
      case 'actinide': return '#db2777';
      case 'lanthanide': return '#14b8a6';
      case 'halogen': return '#FCE7F3';
      default: return '#94a3b8';
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(ele); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.15 : 1}
      >
        <boxGeometry args={[0.85, 0.85, 0.15]} />
        <meshStandardMaterial
          color={hovered ? getColor() : '#111827'}
          metalness={0.7}
          roughness={0.2}
          emissive={hovered ? getColor() : '#000'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
        <Text position={[0, 0, 0.08]} fontSize={0.35} color={hovered ? 'white' : getColor()} fontWeight="bold">{symbol}</Text>
        <Text position={[-0.3, 0.3, 0.08]} fontSize={0.1} color="white" fillOpacity={0.6}>{number}</Text>
        <Text position={[0, -0.25, 0.11]} fontSize={0.12} color="white" fillOpacity={hovered ? 1 : 0.5} maxWidth={0.8} textAlign="center">{name}</Text>
      </mesh>
      {hovered && <pointLight distance={2} intensity={5} color={getColor()} />}
    </group>
  );
}

export function BohrModel({ shellConfig }: { shellConfig: number[] }) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame((state) => { groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3; });
  return (
    <group ref={groupRef}>
      <mesh><sphereGeometry args={[0.5, 32, 32]} /><meshStandardMaterial color="#ff4d4d" emissive="#ff4d4d" emissiveIntensity={0.5} /></mesh>
      {shellConfig.map((electrons, index) => {
        const radius = (index + 1) * 1.2;
        return (
          <group key={index}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius, 0.01, 16, 100]} />
              <meshBasicMaterial color="white" opacity={0.1} transparent />
            </mesh>
            {[...Array(electrons)].map((_, i) => {
              const angle = (i / electrons) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={1} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

export default function PeriodicTable3D() {
  const router = useRouter();
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getShellConfig = (atomicNumber: number) => {
    const shells = [];
    let remaining = atomicNumber;
    const capacities = [2, 8, 18, 32, 18, 8];
    for (const capacity of capacities) {
      if (remaining <= 0) break;
      if (remaining > capacity) {
        shells.push(capacity);
        remaining -= capacity;
      } else {
        shells.push(remaining);
        remaining = 0;
      }
    }
    return shells;
  };

  return (
    <div className="h-screen w-full bg-[#020202] relative overflow-hidden text-white font-sans">
     
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 md:top-8 md:left-8 z-[100] flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl transition-all active:scale-95 shadow-2xl"
      >
        <span className="text-lg">←</span>
        <span className="text-[10px] md:text-xs font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase">Буцах</span>
      </button>

    
      <div className="absolute left-0 z-10 flex flex-col items-center w-full pointer-events-none top-6 md:top-10">
        <h1 className="text-xl md:text-3xl font-light tracking-[0.3em] md:tracking-[0.6em] uppercase mb-2">
          3D Үелэх систем
        </h1>
        <div className="h-[1px] w-24 md:w-48 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
      </div>

      <Canvas shadows gl={{ antialias: true }}>
       
        <PerspectiveCamera 
          makeDefault 
          position={isMobile ? [0, 0, 30] : [10, -5, 22]} 
          fov={isMobile ? 60 : 45} 
        />
        <ambientLight intensity={0.5} />
        <spotLight position={[20, 20, 20]} angle={0.15} penumbra={1} intensity={1.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            {/* Center the table more on mobile */}
            <group position={isMobile ? [-9, 3, 0] : [-9, 4, 0]}>
              {ELEMENTS.map((ele) => (
                <ElementBox
                  key={ele.number}
                  ele={ele}
                  onSelect={(el: any) => setSelectedElement(el)}
                  symbol={ele.symbol}
                  name={ele.name}
                  number={ele.number}
                  category={ele.category}
                  position={[ele.group, -ele.period, 0]}
                />
              ))}
            </group>
          </Float>
        </Suspense>

        <OrbitControls
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={isMobile ? 10 : 5}
          maxDistance={50}
        />
      </Canvas>
      {selectedElement && (
        <div className={`
          absolute z-[110] bg-black/95 backdrop-blur-3xl p-6 md:p-10 border-white/10 shadow-2xl transition-all duration-500 ease-in-out
          ${isMobile 
            ? 'left-0 bottom-0 w-full h-[70vh] border-t rounded-t-[40px] animate-in slide-in-from-bottom' 
            : 'right-0 top-0 h-full w-[400px] border-l animate-in slide-in-from-right'
          }
        `}>
          <button
            onClick={() => setSelectedElement(null)}
            className="absolute text-xl text-gray-500 transition-colors top-6 right-8 md:top-8 hover:text-white"
          >
            ✕
          </button>

          <div className="flex flex-col items-center mt-4 md:mt-12 md:items-start">
            <span className="px-3 py-1 text-[10px] uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              {selectedElement.category}
            </span>
            <h2 className="mt-2 mb-1 text-5xl italic font-bold tracking-tighter text-white uppercase md:mt-6 md:text-7xl">
              {selectedElement.symbol}
            </h2>
            <h3 className="mb-4 text-xl font-light text-gray-400 uppercase md:mb-8 md:text-2xl">
              {selectedElement.name}
            </h3>
          </div>
          <div className="relative w-full h-48 my-4 overflow-hidden border md:h-64 md:my-10 bg-white/5 rounded-3xl border-white/5">
            <Canvas camera={{ position: [0, 0, 7] }}>
              <ambientLight intensity={1.5} />
              <BohrModel shellConfig={getShellConfig(selectedElement.number)} />
              <OrbitControls enableZoom={false} autoRotate />
            </Canvas>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between pb-2 border-b md:pb-3 border-white/5">
              <span className="text-sm italic font-light text-gray-400 md:text-base">Атомын дугаар</span>
              <span className="font-mono text-lg md:text-xl">{selectedElement.number}</span>
            </div>
            <div className="flex justify-between pb-2 border-b md:pb-3 border-white/5">
              <span className="text-sm italic font-light text-gray-400 md:text-base">Атомын масс</span>
              <span className="font-mono text-lg md:text-xl">{selectedElement.mass} u</span>
            </div>
          </div>
        </div>
      )}
      <div className="absolute z-10 w-[95%] md:w-auto px-4 md:px-6 py-3 -translate-x-1/2 border rounded-2xl md:rounded-full bottom-6 md:bottom-10 left-1/2 bg-white/5 backdrop-blur-md border-white/10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 md:gap-10 min-w-max">
          <LegendItem color="bg-blue-400" label="Метал бус" />
          <LegendItem color="bg-emerald-500" label="Шүлтлэг метал" />
          <LegendItem color="bg-red-500" label="Газрын шүлтлэг метал" />
          <LegendItem color="bg-yellow-500" label="Шилжилтийн метал" />
          <LegendItem color="bg-cyan-500" label="Лантонойд" />
          <LegendItem color="bg-pink-600" label="Актинойд" />
          <LegendItem color="bg-lime-200" label="Метал" />
          <LegendItem color="bg-purple-500" label="Хагас метал" />
          <LegendItem color="bg-amber-900" label="Инертийн хий" />
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[8px] md:text-[9px] tracking-widest text-gray-400 uppercase font-bold">
        {label}
      </span>
    </div>
  );
}
