import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from './AudioManager';
import posthog from 'posthog-js';
const AchievementsContext = createContext();
export const ACHIEVEMENTS = {
  corridor_enter: {
    id: 'corridor_enter',
    label: 'Click a door to enter',
    title: 'Explorer'
  },
  corridor_explore: {
    id: 'corridor_explore',
    label: 'Scroll to explore the corridor',
    title: 'Wanderer'
  },
  about_fly: {
    id: 'about_fly',
    label: 'Scroll to fly through my story',
    title: 'Sky Walker'
  },
  studio_interact: {
    id: 'studio_interact',
    label: 'Drag to rotate and browse',
    title: 'Director'
  },
  gallery_inspect: {
    id: 'gallery_inspect',
    label: 'Click project to inspect',
    title: 'Art Critic'
  },
  contact_choose: {
    id: 'contact_choose',
    label: 'Find a contact method',
    title: 'Sociable'
  }
};
export const AchievementsProvider = ({
  children
}) => {
  const {
    playSound
  } = useAudio();
  const completedRef = useRef([]);
  const [completed, setCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem('itom_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(id => id !== 'corridor_enter');
        completedRef.current = [...filtered];
        return filtered;
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const audioCtxRef = useRef(null);
  const playUnlockChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state !== 'running') return;
      const gain = ctx.createGain();
      const osc = ctx.createOscillator();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    } catch (err) {}
  }, []);
  const [activePopup, setActivePopup] = useState(null);
  useEffect(() => {
    const toSave = completed.filter(id => id !== 'corridor_enter');
    localStorage.setItem('itom_achievements', JSON.stringify(toSave));
  }, [completed]);
  const showTutorial = useCallback(id => {
    if (ACHIEVEMENTS[id] && !completed.includes(id) && (!activePopup || activePopup.status === 'hiding')) {
      setTimeout(() => {
        setActivePopup({
          id,
          status: 'pending'
        });
      }, 50);
    }
  }, [completed, activePopup]);
  const unlockAchievement = useCallback(id => {
    if (!completedRef.current.includes(id)) {
      completedRef.current.push(id);
      setCompleted(prev => {
        const updated = [...prev, id];
        const toSave = updated.filter(item => item !== 'corridor_enter');
        localStorage.setItem('itom_achievements', JSON.stringify(toSave));
        return updated;
      });
      const achievementData = ACHIEVEMENTS[id];
      if (achievementData) {
        posthog.capture('achievement_unlocked', {
          achievement_id: id,
          achievement_title: achievementData.title
        });
      }
      playUnlockChime();
      setActivePopup(prev => {
        if (prev && prev.id === id) {
          setTimeout(() => {
            setActivePopup(p => p && p.id === id ? {
              ...p,
              status: 'hiding'
            } : p);
            setTimeout(() => {
              setActivePopup(p => p && p.id === id ? null : p);
            }, 500);
          }, 2000);
          return {
            ...prev,
            status: 'completed'
          };
        } else {
          setTimeout(() => {
            setActivePopup(p => p && p.id === id ? {
              ...p,
              status: 'hiding'
            } : p);
            setTimeout(() => {
              setActivePopup(p => p && p.id === id ? null : p);
            }, 500);
          }, 3000);
          return {
            id,
            status: 'completed'
          };
        }
      });
    }
  }, [playUnlockChime]);
  const hidePopup = useCallback(() => {
    if (activePopup && activePopup.status !== 'hiding') {
      setActivePopup(prev => prev ? {
        ...prev,
        status: 'hiding'
      } : null);
      setTimeout(() => {
        setActivePopup(null);
      }, 500);
    }
  }, [activePopup]);
  return <AchievementsContext.Provider value={{
    completed,
    activePopup,
    showTutorial,
    unlockAchievement,
    hidePopup
  }}>
            {children}
        </AchievementsContext.Provider>;
};
export const useAchievements = () => useContext(AchievementsContext);
