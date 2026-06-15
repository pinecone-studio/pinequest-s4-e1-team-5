import { useState, Suspense, useEffect, useCallback, lazy } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Preload, useTexture, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import posthog from "posthog-js";

// Бүрэлдэхүүн хэсгүүдийг импортлох
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
import MathRoomAssistant from './components/ui/MathRoomAssistant';
import MathFormulaPanel from './components/ui/MathFormulaPanel';
import { AchievementsProvider } from './context/AchievementsContext';
import MathQuizPanel from './components/ui/MathQuizPanel';

import './styles/main.scss';
import { 
  ENTRANCE_TEXTURES, 
  CORRIDOR_TEXTURES, 
  UI_TEXTURES, 
  PRELOAD_ALL, 
  PRELOAD_LOADER, 
  ABOUT_TEXTURES, 
  IMAGE_ASSETS, 
  filterTexturesByDevice 
} from './config/texturePreloadList';

// 🔥 Experience-ийг зөвхөн ганцхан удаа энд зарлана
const Experience = lazy(() => import('./components/canvas/Experience'));

// PostHog Күлэгжүүлэлт / Идэвхжүүлэлт
if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
import Preloader from "./components/dom/Preloader";
import PaperTransition from "./components/dom/PaperTransition";
import { AudioProvider, useAudio } from "./context/AudioManager";
import { initAudio } from "./utils/audioManager";
import {
  PerformanceProvider,
  usePerformance,
} from "./context/PerformanceContext";
import { SceneProvider, useScene } from "./context/SceneContext";
import NavigationUI from "./components/ui/NavigationUI";
import GlobalOverlay from "./components/ui/GlobalOverlay";
import ScreenReaderOverlay from "./components/ui/ScreenReaderOverlay";
import CircuitCanvas from "./components/ui/CircuitCanvas";
import SchoolAssistant from "./components/ui/SchoolAssistant";
import MathRoomAssistant from "./components/ui/MathRoomAssistant";
import MathFormulaPanel from "./components/ui/MathFormulaPanel";
import { AchievementsProvider } from "./context/AchievementsContext";
import MathQuizPanel from "./components/ui/MathQuizPanel";

import "./styles/main.scss";
import {
  ENTRANCE_TEXTURES,
  CORRIDOR_TEXTURES,
  UI_TEXTURES,
  PRELOAD_ALL,
  PRELOAD_LOADER,
  ABOUT_TEXTURES,
  IMAGE_ASSETS,
  filterTexturesByDevice,
} from "./config/texturePreloadList";

// 🔥 Experience-ийг зөвхөн ганцхан удаа энд зарлана
const Experience = lazy(() => import("./components/canvas/Experience"));

// PostHog Күлэгжүүлэлт / Идэвхжүүлэлт
if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
}

// Хөтчийн зураг урьдчилж ачаалагч функц
const preloadBrowserImage = (path: string): void => {
  if (typeof window === "undefined") return;
  const img = new Image();
  img.src = path;
};

// Төхөөрөмж шалгах хувьсагчид
const isMobileDevice =
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
const supportsHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

// Текстуруудыг урьдчилж ачаалах логик
if (isMobileDevice) {
  const CORE_TEXTURES = [
    ...ENTRANCE_TEXTURES,
    ...CORRIDOR_TEXTURES,
    ...UI_TEXTURES,
    ...IMAGE_ASSETS,
  ];
  const filteredCore = filterTexturesByDevice(CORE_TEXTURES, supportsHover);
  const filteredAbout = filterTexturesByDevice(ABOUT_TEXTURES, supportsHover);
  filteredCore.forEach((path: string) => useTexture.preload(path));
  filteredAbout.forEach((path: string) => useTexture.preload(path));
} else {
  const filteredAll = filterTexturesByDevice(PRELOAD_ALL, supportsHover);
  const filteredLoader = filterTexturesByDevice(PRELOAD_LOADER, supportsHover);
  filteredAll.forEach((path: string) => useTexture.preload(path));
  filteredLoader.forEach((path: string) => useTexture.preload(path));
}

// Аудио идэвхжүүлэгч
const GlobalAudioEnabler = (): null => {
  const { enableAudio } = useAudio();
  useEffect(() => {
    const handleInteraction = () => enableAudio();
    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [enableAudio]);
  return null;
};

// Арын фон, манан, болон дулаан гэрэлтүүлэг тохируулагч
const SceneStyling = (): JSX.Element => {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog('#f6f3e8', 20, 65);
    scene.fog = new THREE.Fog("#f6f3e8", 20, 65);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.7} color="#fffbee" />
      <directionalLight
        position={[5, 15, 5]}
        intensity={0.6}
        color="#ffeaa7"
        castShadow
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} color="#fab1a0" />
    </>
  );
};

// Физикийн лаб-ын Overlay
const PhysicsCircuitOverlay = (): JSX.Element | null => {
  const { currentRoom } = useScene();
  const [shouldShowSimulator, setShouldShowSimulator] =
    useState<boolean>(false);

  useEffect(() => {
    if (currentRoom !== "physics") {
      setShouldShowSimulator(false);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setShouldShowSimulator(true);
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [currentRoom]);

  if (currentRoom !== "physics") return null;

  return (
    <div
      className="physics-circuit-overlay"
      aria-label="Physics circuit simulator"
    >
      {shouldShowSimulator && <CircuitCanvas />}
    </div>
  );
};

// Үндсэн апп-ын дотор тал
function AppContent(): JSX.Element {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [sceneReady, setSceneReady] = useState<boolean>(false);
  const { settings, downgradeTier, tier } = usePerformance();

  useEffect(() => {
    initAudio();
  }, []);

  const handleSceneReady = useCallback(() => {
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);

  return (
    <AudioProvider>
      <SceneProvider>
        <GlobalAudioEnabler />
        <div className="app">
          <div className="canvas-wrapper">
            <Canvas
              camera={{ position: [0, 0.2, 28], fov: 60, near: 0.1, far: 150 }}
              gl={{
                antialias: settings.antialias,
                alpha: false,
                powerPreference: settings.powerPreference,
                localClippingEnabled: true,
                failIfMajorPerformanceCaveat: true,
              }}
              dpr={settings.dpr}
              shadows={settings.shadows}
            >
              <color attach="background" args={['#f6f3e8']} />
              <color attach="background" args={["#f6f3e8"]} />
              <SceneStyling />

              <PerformanceMonitor
                onDecline={() => downgradeTier()}
                flipflops={3}
                onFallback={() => downgradeTier()}
              />

              <Suspense fallback={null}>
                <Experience
                  isLoaded={isLoaded}
                  onSceneReady={handleSceneReady}
                  performanceTier={tier}
                />
                <Preload all />
              </Suspense>
            </Canvas>
          </div>

          {isLoaded && (
            <>
              <NavigationUI />
              <GlobalOverlay />
              <SchoolAssistant />
              <MathRoomAssistant />
              <MathFormulaPanel />
              <MathQuizPanel />
              <PaperTransition />
              <ScreenReaderOverlay />
              <PhysicsCircuitOverlay />
            </>
          )}

          <Preloader ready={sceneReady} onComplete={() => setIsLoaded(true)} />
        </div>
      </SceneProvider>
    </AudioProvider>
  );
}

// Хамгийн гадна талын экспорт
export default function App(): JSX.Element {
  useEffect(() => {
    const filteredImages = filterTexturesByDevice(IMAGE_ASSETS, supportsHover);
    filteredImages.forEach((path: string) => preloadBrowserImage(path));
  }, []);

  return (
    <PerformanceProvider>
      <AchievementsProvider>
        <AppContent />
      </AchievementsProvider>
    </PerformanceProvider>
  );
}
