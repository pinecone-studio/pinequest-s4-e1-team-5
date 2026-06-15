import { useState, Suspense, useEffect, useCallback, useLayoutEffect, lazy } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import { Preload, useTexture, Text, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import Preloader from './components/dom/Preloader';
import PaperTransition from './components/dom/PaperTransition';
import { AudioProvider, useAudio } from './context/AudioManager';
import { initAudio } from './utils/audioManager';
import { PerformanceProvider, usePerformance } from './context/PerformanceContext';
import { SceneProvider, useScene } from './context/SceneContext';
import NavigationUI from './components/ui/NavigationUI';
import GlobalOverlay from './components/ui/GlobalOverlay';
import ScreenReaderOverlay from './components/ui/ScreenReaderOverlay';
import CircuitCanvas from './components/ui/CircuitCanvas';
import SchoolAssistant from './components/ui/SchoolAssistant';
import posthog from 'posthog-js';
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: 'identified_only'
});
const Experience = lazy(() => import('./components/canvas/Experience'));
import './styles/main.scss';
import { ENTRANCE_TEXTURES, CORRIDOR_TEXTURES, UI_TEXTURES, PRELOAD_ALL, PRELOAD_LOADER, ABOUT_TEXTURES, IMAGE_ASSETS, filterTexturesByDevice } from './config/texturePreloadList';
import { TextureLoader } from 'three';
const preloadBrowserImage = path => {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = path;
};
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
const isWeakCPU = typeof navigator.hardwareConcurrency !== 'undefined' && navigator.hardwareConcurrency <= 4;
const isLowRAM = typeof navigator.deviceMemory !== 'undefined' && navigator.deviceMemory <= 4;
const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 450;
const isLowEnd = isMobileDevice || isWeakCPU || isLowRAM || isSmallScreen;
const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
if (isLowEnd) {
  const CORE_TEXTURES = [...ENTRANCE_TEXTURES, ...CORRIDOR_TEXTURES, ...UI_TEXTURES, ...IMAGE_ASSETS];
  const filteredCore = filterTexturesByDevice(CORE_TEXTURES, supportsHover);
  const filteredAbout = filterTexturesByDevice(ABOUT_TEXTURES, supportsHover);
  filteredCore.forEach(path => useTexture.preload(path));
  filteredAbout.forEach(path => useLoader.preload(TextureLoader, path));
} else {
  const filteredAll = filterTexturesByDevice(PRELOAD_ALL, supportsHover);
  const filteredLoader = filterTexturesByDevice(PRELOAD_LOADER, supportsHover);
  filteredAll.forEach(path => useTexture.preload(path));
  filteredLoader.forEach(path => useLoader.preload(TextureLoader, path));
}
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff';
const GlobalAudioEnabler = () => {
  const {
    enableAudio
  } = useAudio();
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener('click', handleInteraction, {
      once: true
    });
    window.addEventListener('touchstart', handleInteraction, {
      once: true
    });
    window.addEventListener('keydown', handleInteraction, {
      once: true
    });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [enableAudio]);
  return null;
};
const PaperSceneBackground = () => {
  const {
    scene
  } = useThree();
  const texture = useTexture('/textures/paper-texture.webp');
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
    return () => {
      scene.background = null;
    };
  }, [scene, texture]);
  return null;
};
const PhysicsCircuitOverlay = () => {
  const { currentRoom } = useScene();
  const [shouldShowSimulator, setShouldShowSimulator] = useState(false);

  useEffect(() => {
    if (currentRoom !== 'physics') {
      setShouldShowSimulator(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldShowSimulator(true);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentRoom]);

  if (currentRoom !== 'physics') {
    return null;
  }

  return (
    <div
      className="physics-circuit-overlay"
      aria-label="Physics circuit simulator"
    >
      {shouldShowSimulator && <CircuitCanvas />}
    </div>
  );
};
function AppContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const {
    settings,
    downgradeTier,
    tier
  } = usePerformance();
  useEffect(() => {
    initAudio();
  }, []);
  const handleSceneReady = useCallback(() => {
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);
  return <AudioProvider>
      <SceneProvider>
        <GlobalAudioEnabler />
        <div className="app">
          {}
          <div className="canvas-wrapper">
            <Canvas camera={{
            position: [0, 0.2, 28],
            fov: 60,
            near: 0.1,
            far: 150
          }} gl={{
            antialias: settings.antialias,
            alpha: false,
            powerPreference: settings.powerPreference,
            localClippingEnabled: true,
            failIfMajorPerformanceCaveat: true
          }} dpr={settings.dpr} shadows={settings.shadows}>
              <color attach="background" args={['#fafafa']} />
              <fog attach="fog" args={['#fafafa', 15, 50]} />

              {}
              <PerformanceMonitor onDecline={() => downgradeTier()} flipflops={3} onFallback={() => downgradeTier()} />

              {}
              {}

              <Suspense fallback={null}>
                <Experience isLoaded={isLoaded} onSceneReady={handleSceneReady} performanceTier={tier} />
                <Preload all />
              </Suspense>
            </Canvas>
          </div>

          {}
          {isLoaded && <>
              <NavigationUI />
              <GlobalOverlay />
              <SchoolAssistant />
              <PaperTransition />
              <ScreenReaderOverlay />
              <PhysicsCircuitOverlay />
            </>}

          {}
          <Preloader ready={sceneReady} onComplete={() => setIsLoaded(true)} />
        </div>
      </SceneProvider>
    </AudioProvider>;
}
import { AchievementsProvider } from './context/AchievementsContext';
export default function App() {
  useEffect(() => {
    const filteredImages = filterTexturesByDevice(IMAGE_ASSETS, supportsHover);
    filteredImages.forEach(path => preloadBrowserImage(path));
  }, []);
  return <PerformanceProvider>
      <AchievementsProvider>
        <AppContent />
      </AchievementsProvider>
    </PerformanceProvider>;
}
