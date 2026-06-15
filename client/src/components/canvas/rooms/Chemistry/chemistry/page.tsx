'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { BeakerIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

const SelectionPage = () => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[url('/screen.png')] text-white font-sans selection:bg-emerald-500/30 bg-cover bg-center bg-no-repeat overflow-x-hidden">
      <Header />
      
      <nav className="flex items-center justify-center px-6 py-4 border-b md:px-12 md:py-6 border-white/5 backdrop-blur-sm">
        <div className="text-xl md:text-2xl font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase italic">
          Хими
        </div>
        {/* <div className="flex text-[10px] md:text-xs tracking-widest text-gray-400 uppercase gap-6 md:gap-20 lg:gap-60 ">
          <Link
            href="/chemistry/elementss"
            className="transition-colors hover:text-white text-emerald-400"
          >
            Үелэх систем
          </Link>
          <Link
            href="/chemistry/formulas"
            className="text-blue-400 transition-colors hover:text-white"
          >
            ЛАБОРАТОРИ
          </Link>
        </div> */}
      </nav>

      <main className="relative flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-250px)] lg:h-[calc(100vh-180px)] px-6 md:px-10 py-10 lg:py-0 gap-8 lg:gap-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] bg-emerald-500/10 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] bg-blue-500/10 rounded-full blur-[80px] lg:blur-[120px] pointer-events-none" />

     
        <motion.div
          onClick={() => handleNavigation('/chemistry/elementss')}
          whileHover={{ y: -5, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full max-w-[450px] h-[380px] md:h-[500px] lg:h-[550px] rounded-[24px] md:rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-10 cursor-pointer overflow-hidden z-10"
        >
          <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-br from-emerald-500/10 to-transparent group-hover:opacity-100" />
          <span className="text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] text-emerald-400 mb-4 md:mb-6 uppercase font-bold">
            Хэсэг 01
          </span>
          <h2 className="mb-8 font-serif text-5xl font-medium tracking-tighter uppercase md:mb-12 md:text-7xl">
            Үзэх
          </h2>

          <button className="flex items-center gap-3 bg-white/5 border border-emerald-500/30 px-6 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs tracking-[0.2em] uppercase hover:bg-emerald-500 hover:text-black transition-all duration-300">
            Үелэх систем{' '}
            <span className="transition-transform group-hover:translate-x-2">
              →
            </span>
          </button>
        </motion.div>

      
        <motion.div
          onClick={() => handleNavigation('/chemistry/formulas')}
          whileHover={{ y: -5, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full max-w-[450px] h-[380px] md:h-[500px] lg:h-[550px] rounded-[24px] md:rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-10 cursor-pointer overflow-hidden z-10"
        >
          <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:opacity-100" />
          <span className="text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] text-blue-400 mb-4 md:mb-6 uppercase font-bold">
            Хэсэг 02
          </span>
          <h2 className="mb-8 font-serif text-5xl font-medium tracking-tighter uppercase md:mb-12 md:text-7xl">
            Бодох
          </h2>

          <button className="flex items-center gap-3 bg-white/5 border border-blue-500/30 px-6 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs tracking-[0.2em] uppercase hover:bg-blue-500 hover:text-black transition-all duration-300">
            ЛАБОРАТОРИ <BeakerIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </main>
      <footer className="w-full py-6 md:py-8 bg-black/20 lg:bg-transparent lg:fixed lg:bottom-0">
        <div className="hidden max-w-xl px-6 py-3 mx-auto text-center border rounded-full md:px-10 bg-white/5 backdrop-blur-md border-white/10 md:block">
          <p className="text-[9px] md:text-[10px] tracking-[0.2em] text-gray-500 uppercase leading-relaxed">
            Таны сонголт: Химийн элементүүдийг танин мэдэх эсвэл химийн томьёог эзэмших
          </p>
        </div>

        <div className="flex justify-center gap-12 mt-0 md:gap-16 md:mt-6">
          <Link href="/chemistry/elementss">
            <ToolbarIcon
              Icon={TableCellsIcon}
              label="ҮЗЭХ"
              active
              color="text-emerald-500"
            />
          </Link>
          <Link href="/chemistry/formulas">
            <ToolbarIcon Icon={BeakerIcon} label="БОДОХ" />
          </Link>
        </div>
      </footer>
    </div>
  );
};

const ToolbarIcon = ({ Icon, label, active, color }: any) => (
  <div className={`flex flex-col items-center gap-2 cursor-pointer group p-2`}>
    <Icon
      className={`w-5 h-5 md:w-6 md:h-6 ${active ? color : 'text-gray-600'} group-hover:text-white transition-colors`}
    />
    <span
      className={`text-[8px] md:text-[9px] tracking-widest font-bold ${active ? 'text-white' : 'text-gray-700'}`}
    >
      {label}
    </span>
  </div>
);

export default SelectionPage;
