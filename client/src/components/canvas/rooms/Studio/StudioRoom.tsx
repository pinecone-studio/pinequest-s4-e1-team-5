import { useEffect, useRef } from 'react';
import { Html, PositionalAudio } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useScene } from '../../../../context/SceneContext';
import { useAchievements } from '../../../../context/AchievementsContext';
import { useAudio } from '../../../../context/AudioManager';
import { usePaintMaterial } from '../Gallery/usePaintMaterial';
import CircuitStudioLab from './CircuitStudioLab';

const STUDIO_PAINT_CONFIG = {
  dirX: 0.0,
  dirY: -1.0,
  dirZ: 0.0,
  startDist: -10.0,
  endDist: 10.0,
  noiseAxes: 'xz'
};

export const AUDIO_SETTINGS = {
  volume: 0.55,
  distance: 2,
  rolloff: 1.0
};

const StudioRoom = ({ showRoom, onReady, isExiting, isWarmup }) => {
  const groupRef = useRef();
  const audioRef = useRef();
  const hasSignaledReady = useRef(false);
  const frameCount = useRef(0);
  const { isTeleporting } = useScene();
  const { showTutorial, hidePopup } = useAchievements();
  const { globalVolume, isMuted } = useAudio();
  const { animatePaint, resetPaint, uniformsData: paintUniforms, updateRoomOrigin } =
    usePaintMaterial(STUDIO_PAINT_CONFIG);
  const effectiveVolume = isMuted ? 0 : AUDIO_SETTINGS.volume * globalVolume;

  useEffect(() => {
    if (audioRef.current && audioRef.current.setVolume) {
      audioRef.current.setVolume(effectiveVolume);
    }
  }, [effectiveVolume]);

  useEffect(() => {
    if (isExiting || isTeleporting) {
      hidePopup();
    }
  }, [isExiting, isTeleporting, hidePopup]);

  useEffect(() => {
    if (showRoom && !isWarmup && !isTeleporting) {
      resetPaint();
      animatePaint(0.2, 1.8);
    } else {
      paintUniforms.uPaintProgress.value = 1.0;
    }
  }, [showRoom, isWarmup, isTeleporting]);

  useFrame(() => {
    updateRoomOrigin(groupRef);

    if (hasSignaledReady.current) {
      return;
    }

    frameCount.current++;

    if (frameCount.current >= 3) {
      hasSignaledReady.current = true;
      onReady?.();

      if (!isWarmup) {
        setTimeout(() => showTutorial('studio_interact'), 1200);
      }
    }
  });

  const shouldShowLab = showRoom && !isWarmup && !isExiting && !isTeleporting;

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      {!isWarmup ? (
        <PositionalAudio
          ref={audioRef}
          url="/sounds/szummonitorow.mp3"
          distanceModel="exponential"
          refDistance={AUDIO_SETTINGS.distance}
          rolloffFactor={AUDIO_SETTINGS.rolloff}
          loop
          autoplay
          volume={effectiveVolume}
        />
      ) : null}

      {shouldShowLab ? (
        <Html fullscreen zIndexRange={[1400, 0]}>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none'
            }}
          >
            <CircuitStudioLab />
          </div>
        </Html>
      ) : null}
    </group>
  );
};

export default StudioRoom;
