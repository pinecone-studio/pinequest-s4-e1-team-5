'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BeakerIcon,
  BookOpenIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function FormulaSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-[#020202] flex flex-col items-center justify-center relative overflow-x-hidden py-16 md:py-0 font-sans text-white">
    
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

   
      <button
        onClick={() => router.back()}
        className="absolute z-50 flex items-center gap-2 px-4 py-2 transition-all border shadow-2xl md:gap-3 md:px-6 md:py-3 top-4 left-4 md:top-8 md:left-8 bg-white/5 hover:bg-white/10 backdrop-blur-xl border-white/10 rounded-xl md:rounded-2xl group active:scale-95"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform md:w-5 md:h-5 group-hover:-translate-x-1" />
        <span className="text-[10px] md:text-xs font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase">
          Буцах
        </span>
      </button>

   
      <div className="z-10 px-6 mb-8 text-center duration-700 md:mb-16 animate-in fade-in zoom-in">
        <h1 className="text-2xl md:text-5xl font-light tracking-[0.4em] md:tracking-[0.8em] uppercase mb-4">
          Хими-Молекул
        </h1>
        <div className="h-[1px] w-32 md:w-64 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto" />
        <p className="mt-4 md:mt-6 text-[10px] md:text-xs tracking-widest text-gray-500 uppercase">
          Суралцах арга барилаа сонгоно уу
        </p>
      </div>

     
      <div className="z-10 flex flex-col w-full max-w-5xl gap-6 px-6 md:gap-8 md:flex-row">
  
        <Link href="/chemistry/formulas/library1" className="flex-1 group">
          <div className="h-full p-8 md:p-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-[30px] md:rounded-[40px] hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-500 flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-6 transition-transform duration-500 md:w-20 md:h-20 md:mb-8 rounded-2xl md:rounded-3xl bg-emerald-500/20 group-hover:scale-110">
              <BookOpenIcon className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
            </div>
            <h2 className="mb-3 text-xl font-bold tracking-tight md:mb-4 md:text-2xl">Молекул</h2>
            <p className="text-xs font-light leading-relaxed text-gray-400 md:text-sm">
              Бэлэн байгаа 3D молекулуудын бүтцийг судалж, тэдгээрийн химийн
              шинж чанарыг танин мэдэх.
            </p>
            <div className="flex items-center gap-2 mt-6 md:mt-8 text-[10px] md:text-xs font-bold tracking-widest uppercase transition-opacity opacity-0 text-emerald-400 group-hover:opacity-100">
              Үзэх <SparklesIcon className="w-4 h-4" />
            </div>
          </div>
        </Link>

      
        <Link href="/chemistry/formulas/lab" className="flex-1 group">
          <div className="h-full p-8 md:p-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-[30px] md:rounded-[40px] hover:bg-white/10 hover:border-blue-500/50 transition-all duration-500 flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-6 transition-transform duration-500 md:w-20 md:h-20 md:mb-8 rounded-2xl md:rounded-3xl bg-blue-500/20 group-hover:scale-110">
              <BeakerIcon className="w-8 h-8 text-blue-400 md:w-10 md:h-10" />
            </div>
            <h2 className="mb-3 text-xl font-bold tracking-tight md:mb-4 md:text-2xl">Туршилт</h2>
            <p className="text-xs font-light leading-relaxed text-gray-400 md:text-sm">
              Өөрийн молекулыг бүтээж, атомуудыг хооронд нь холбон туршилт хийх
              мөн химийн бодлогуудыг бодох.
            </p>
            <div className="flex items-center gap-2 mt-6 md:mt-8 text-[10px] md:text-xs font-bold tracking-widest text-blue-400 uppercase transition-opacity opacity-0 group-hover:opacity-100">
              Эхлэх <SparklesIcon className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

    
      <div className="mt-12 md:absolute md:bottom-10 text-[9px] md:text-[10px] text-gray-600 tracking-[0.3em] md:tracking-[0.4em] uppercase">
        Chemistry Module
      </div>
    </div>
  );
}
