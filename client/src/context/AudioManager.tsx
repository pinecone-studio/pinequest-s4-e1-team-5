import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
const AudioContext = createContext({
  isMuted: false,
  toggleMute: () => {},
  play: () => {},
  enableAudio: () => {},
  audioEnabled: false,
  globalVolume: 0.5,
  setGlobalVolume: () => {}
});
export const useAudio = () => useContext(AudioContext);
export const AudioProvider = ({
  children
}) => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('audio_muted');
    return saved === 'true';
  });
  const [globalVolume, setGlobalVolume] = useState(() => {
    const saved = localStorage.getItem('audio_volume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const activeSounds = useRef({});
  useEffect(() => {
    localStorage.setItem('audio_muted', isMuted);
    localStorage.setItem('audio_volume', globalVolume);
    Object.values(activeSounds.current).forEach(audio => {
      if (audio) {
        audio.muted = isMuted;
        const base = audio._baseVolume !== undefined ? audio._baseVolume : 1.0;
        let targetVol = base * globalVolume;
        audio.volume = Math.max(0, Math.min(1, targetVol));
      }
    });
  }, [isMuted, globalVolume]);
  const toggleMute = () => setIsMuted(prev => !prev);
  const enhancedSetGlobalVolume = useCallback(vol => {
    if (typeof vol === 'function') {
      setGlobalVolume(prev => {
        const newVol = vol(prev);
        if (newVol > 0) setIsMuted(false);
        return newVol;
      });
    } else {
      setGlobalVolume(vol);
      if (vol > 0) setIsMuted(false);
    }
  }, []);
  const enableAudio = useCallback(() => {
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
  }, [audioEnabled]);
  const play = useCallback((soundName, {
    loop = false,
    volume = 1.0
  } = {}) => {
    const soundPaths = {
      'szumwiatru': '/sounds/szumwiatru.mp3',
      'szummiasta': '/sounds/szummiasta.mp3',
      'uchyleniedrzwi': '/sounds/uchyleniedrzwi.mp3',
      'otwarciedrzwi': '/sounds/otwarciedrzwi.mp3',
      'zamknieciedrzwi': '/sounds/zamknieciedrzwi.mp3'
    };
    const path = soundPaths[soundName] || `/sounds/${soundName}.mp3`;
    const audio = new Audio(path);
    audio.loop = loop;
    audio._baseVolume = volume;
    audio.muted = isMuted;
    let targetVol = volume * globalVolume;
    audio.volume = Math.max(0, Math.min(1, targetVol));
    if (activeSounds.current[soundName]) {
      activeSounds.current[soundName].pause();
    }
    activeSounds.current[soundName] = audio;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError') {} else if (error.name === 'NotSupportedError' || error.message.includes('404')) {} else {}
      });
    }
    return {
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        delete activeSounds.current[soundName];
      },
      fade: (duration = 1000) => {
        audio.pause();
        delete activeSounds.current[soundName];
      }
    };
  }, [isMuted, globalVolume]);
  return <AudioContext.Provider value={{
    isMuted,
    toggleMute,
    globalVolume,
    setGlobalVolume: enhancedSetGlobalVolume,
    play,
    enableAudio,
    audioEnabled
  }}>
            {children}
        </AudioContext.Provider>;
};
