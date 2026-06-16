import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';
import { setMusicVolume, getMusicVolume } from '../../utils/audioManager';
import { useAchievements } from '../../context/AchievementsContext';
import '../../styles/NavigationUI.scss';
const ROOMS = [{
  id: 'physics',
  label: 'Physics',
  x: 43,
  y: 38
}, {
  id: 'math',
  label: 'Mathematic',
  x: 43,
  y: 72
}, {
  id: 'geometry',
  label: 'Geometry',
  x: 57,
  y: 25
}, {
  id: 'chemistry',
  label: 'Chemistry',
  x: 57,
  y: 55
}];
const PIN_START_POSITION = {
  x: 50.5,
  y: 97
};
const NavigationUI = () => {
  const {
    currentRoom,
    isInRoom,
    requestExit,
    hasEntered,
    teleportTo,
    isTeleporting,
    schoolAssistantVisible
  } = useScene();
  const {
    isMuted,
    toggleMute,
    globalVolume,
    setGlobalVolume
  } = useAudio();
  const {
    showTutorial,
    unlockAchievement
  } = useAchievements();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [bgmVol, setBgmVol] = useState(0.3);
  const [isUIHidden, setIsUIHidden] = useState(false);
  const mapPanelRef = useRef();
  const mapCloseRef = useRef();
  useEffect(() => {
    const handleInspectChange = e => {
      setIsUIHidden(e.detail);
      if (e.detail) {
        setIsMenuOpen(false);
        setIsAudioMenuOpen(false);
      }
    };
    window.addEventListener('inspectChange', handleInspectChange);
    return () => window.removeEventListener('inspectChange', handleInspectChange);
  }, []);
  const paintedMapsRefs = {
    physics: useRef(),
    math: useRef(),
    geometry: useRef(),
    chemistry: useRef()
  };
  useEffect(() => {
    if (paintedMapsRefs.physics.current) {
      gsap.to(paintedMapsRefs.physics.current, {
        clipPath: hoveredRoom === 'physics' || currentRoom === 'physics' ? 'polygon(10% 20%, 40% 20%, 40% 55%, 10% 55%)' : 'polygon(10% 20%, 10% 20%, 10% 55%, 10% 55%)',
        duration: 0.5,
        ease: "power2.out"
      });
    }
    if (paintedMapsRefs.math.current) {
      gsap.to(paintedMapsRefs.math.current, {
        clipPath: hoveredRoom === 'math' || currentRoom === 'math' ? 'polygon(10% 57%, 40% 57%, 40% 92%, 10% 92%)' : 'polygon(10% 57%, 10% 57%, 10% 92%, 10% 92%)',
        duration: 0.5,
        ease: "power2.out"
      });
    }
    if (paintedMapsRefs.geometry.current) {
      gsap.to(paintedMapsRefs.geometry.current, {
        clipPath: hoveredRoom === 'geometry' || currentRoom === 'geometry' ? 'polygon(60% 10%, 95% 10%, 95% 35%, 60% 35%)' : 'polygon(95% 10%, 95% 10%, 95% 35%, 95% 35%)',
        duration: 0.5,
        ease: "power2.out"
      });
    }
    if (paintedMapsRefs.chemistry.current) {
      gsap.to(paintedMapsRefs.chemistry.current, {
        clipPath: hoveredRoom === 'chemistry' || currentRoom === 'chemistry' ? 'polygon(60% 41%, 85% 41%, 85% 81%, 60% 81%)' : 'polygon(85% 41%, 85% 41%, 85% 81%, 85% 81%)',
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [hoveredRoom, currentRoom]);
  useEffect(() => {
    setBgmVol(getMusicVolume());
    const handleMusicVolumeChange = e => {
      setBgmVol(e.detail);
    };
    window.addEventListener('musicVolumeChanged', handleMusicVolumeChange);
    return () => window.removeEventListener('musicVolumeChanged', handleMusicVolumeChange);
  }, []);
  const handleBgmChange = val => {
    setBgmVol(val);
    setMusicVolume(val);
  };
  useEffect(() => {
    if (!hasEntered && !isTeleporting && !schoolAssistantVisible) {
      showTutorial('corridor_enter');
    } else if (hasEntered && !isTeleporting && !isInRoom) {
      showTutorial('corridor_explore');
    }
  }, [hasEntered, isTeleporting, isInRoom, schoolAssistantVisible, showTutorial]);
  useEffect(() => {
    if (isInRoom || isTeleporting) {
      setIsMenuOpen(false);
      setIsAudioMenuOpen(false);
      setIsExiting(false);
    }
  }, [isInRoom, isTeleporting]);
  useEffect(() => {
    if (!isInRoom) {
      setIsExiting(false);
    }
  }, [isInRoom]);
  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => mapCloseRef.current?.focus(), 100);
    }
  }, [isMenuOpen]);
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isAudioMenuOpen) setIsAudioMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, isAudioMenuOpen]);
  const handleMapKeyDown = e => {
    if (e.key !== 'Tab' || !mapPanelRef.current) return;
    const focusable = mapPanelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  const handleRoomClick = roomId => {
    if (roomId === currentRoom || isTeleporting) return;
    setIsMenuOpen(false);
    setIsAudioMenuOpen(false);
    teleportTo(roomId);
  };
  const handleBackClick = () => {
    setIsExiting(true);
    requestExit();
  };
  return <div className="navigation-ui">
            {}
            {hasEntered && isInRoom && <button className={`nav-btn back-btn ${isExiting ? 'exiting' : ''}`} onClick={handleBackClick} aria-label="Back to corridor">
                    <svg viewBox="0 0 24 24" className="icon-back">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>}

            {}
            {hasEntered && <div className={`nav-controls ${isMenuOpen || isAudioMenuOpen ? 'menu-open' : ''} ${isUIHidden ? 'ui-hidden' : ''}`}>
                    {}
                    <button className={`nav-btn hamburger-btn ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
                        <div className="hamburger-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                    {}
                    <button className={`nav-btn audio-btn ${isAudioMenuOpen ? 'open' : ''}`} onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)} aria-label="Audio Settings" aria-expanded={isAudioMenuOpen}>
                        {isMuted ? <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg> : <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <path d="M15 9a5 5 0 0 1 0 6" />
                                <path d="M18 5a9 9 0 0 1 0 14" />
                            </svg>}
                    </button>
                </div>}

            {}
            {hasEntered && <div className={`map-panel ${isMenuOpen ? 'open' : ''}`} inert={!isMenuOpen ? true : undefined} ref={mapPanelRef} onKeyDown={handleMapKeyDown} role="dialog" aria-label="Map">
                    {}
                    <svg className="map-border-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}>
                        <path d="M 0 0 L 100 0 L 100 0 L 99 3 L 100 6 L 98 10 L 100 14 L 99 18 L 100 22 L 98 26 L 100 30 L 99 35 L 100 40 L 98 45 L 100 50 L 99 55 L 100 60 L 98 65 L 100 70 L 99 75 L 100 80 L 98 85 L 100 90 L 99 95 L 100 100 L 96 99 L 92 100 L 88 98 L 84 100 L 80 99 L 76 100 L 72 98 L 68 100 L 64 99 L 60 100 L 56 98 L 52 100 L 48 99 L 44 100 L 40 98 L 36 100 L 32 99 L 28 100 L 24 98 L 20 100 L 16 99 L 12 100 L 8 98 L 4 100 L 0 99 L 0.5 99.5 L 1 95 L 0 90 L 2 85 L 0 80 L 1 75 L 0 70 L 2 65 L 0 60 L 1 55 L 0 50 L 2 45 L 0 40 L 1 35 L 0 30 L 2 26 L 0 22 L 1 18 L 0 14 L 2 10 L 0 6 L 1 3 L 0 0 Z" fill="none" stroke="#1a1a1a" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>

                    <div className="map-content-clipped">
                        <div className="map-header">
                            <h3>MAP</h3>
                            <button ref={mapCloseRef} className="close-btn" onClick={() => setIsMenuOpen(false)} aria-label="Close map">
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="map-container">
                            {}
                            <img src="/images/map.webp" alt="Portfolio Map" className="map-image" />

                            {}
                            <img ref={paintedMapsRefs.physics} src="/images/map_about_painted.webp" alt="" className="painted-map-layer" style={{
            clipPath: 'polygon(10% 20%, 10% 20%, 10% 55%, 10% 55%)'
          }} />
                            <img ref={paintedMapsRefs.math} src="/images/map_gallery_painted.webp" alt="" className="painted-map-layer" style={{
            clipPath: 'polygon(10% 57%, 10% 57%, 10% 92%, 10% 92%)'
          }} />
                            <img ref={paintedMapsRefs.geometry} src="/images/map_contact_painted.webp" alt="" className="painted-map-layer" style={{
            clipPath: 'polygon(95% 10%, 95% 10%, 95% 35%, 95% 35%)'
          }} />
                            <img ref={paintedMapsRefs.chemistry} src="/images/map_studio_painted.webp" alt="" className="painted-map-layer" style={{
            clipPath: 'polygon(85% 41%, 85% 41%, 85% 81%, 85% 81%)'
          }} />

                            {}
                            <button type="button" className="map-hover-zone zone-physics" onMouseEnter={() => setHoveredRoom('physics')} onMouseLeave={() => setHoveredRoom(null)} onFocus={() => setHoveredRoom('physics')} onBlur={() => setHoveredRoom(null)} onClick={() => handleRoomClick('physics')} aria-label="Физикийн өрөө" />
                            <button type="button" className="map-hover-zone zone-math" onMouseEnter={() => setHoveredRoom('math')} onMouseLeave={() => setHoveredRoom(null)} onFocus={() => setHoveredRoom('math')} onBlur={() => setHoveredRoom(null)} onClick={() => handleRoomClick('math')} aria-label="Математикийн өрөө" />
                            <button type="button" className="map-hover-zone zone-geometry" onMouseEnter={() => setHoveredRoom('geometry')} onMouseLeave={() => setHoveredRoom(null)} onFocus={() => setHoveredRoom('geometry')} onBlur={() => setHoveredRoom(null)} onClick={() => handleRoomClick('geometry')} aria-label="Геометрийн өрөө" />
                            <button type="button" className="map-hover-zone zone-chemistry" onMouseEnter={() => setHoveredRoom('chemistry')} onMouseLeave={() => setHoveredRoom(null)} onFocus={() => setHoveredRoom('chemistry')} onBlur={() => setHoveredRoom(null)} onClick={() => handleRoomClick('chemistry')} aria-label="Химийн өрөө" />

                            {}
                            <div className="map-room-label about">PHYSICS</div>
                            <div className="map-room-label gallery">MATHEMATICS</div>
                            <div className="map-room-label contact">GEOMETRY</div>
                            <div className="map-room-label studio">CHEMISTRY</div>

                            {}
                            {ROOMS.map(room => <button key={room.id} className={`pin-slot ${currentRoom === room.id ? 'active' : ''} ${hoveredRoom === room.id ? 'hovered' : ''}`} style={{
            left: `${room.x}%`,
            top: `${room.y}%`
          }} onClick={() => handleRoomClick(room.id)} onMouseEnter={() => setHoveredRoom(room.id)} onMouseLeave={() => setHoveredRoom(null)} title={room.label}>
                                    <img src="/images/pin-slot.webp" alt="" className="slot-image" />
                                </button>)}

                            {}
                            <div className="pin-marker" style={{
            left: `${hoveredRoom ? ROOMS.find(r => r.id === hoveredRoom)?.x || PIN_START_POSITION.x : currentRoom && isInRoom ? ROOMS.find(r => r.id === currentRoom)?.x || PIN_START_POSITION.x : PIN_START_POSITION.x}%`,
            top: `${hoveredRoom ? ROOMS.find(r => r.id === hoveredRoom)?.y || PIN_START_POSITION.y : currentRoom && isInRoom ? ROOMS.find(r => r.id === currentRoom)?.y || PIN_START_POSITION.y : PIN_START_POSITION.y}%`
          }}>
                                <img src="/images/pin.webp" alt="You are here" className="pin-image" />
                            </div>
                        </div>
                    </div>
                </div>}

            {}
            {hasEntered && <div className={`audio-panel ${isAudioMenuOpen ? 'open' : ''}`} inert={!isAudioMenuOpen ? true : undefined}>
                    <div className="audio-card">
                        <div className="audio-header">
                            <h3>AUDIO SETTINGS</h3>
                            <button className="close-btn" onClick={() => setIsAudioMenuOpen(false)} aria-label="Close audio settings">
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="audio-sliders-container">
                            <div className="slider-group">
                                <div className="slider-label">
                                    <span>Music</span>
                                    <span>{Math.round(bgmVol * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={bgmVol} onChange={e => handleBgmChange(parseFloat(e.target.value))} className="paper-slider" aria-label="Music volume" aria-valuetext={`${Math.round(bgmVol * 100)} percent`} />
                            </div>
                            <div className="slider-group">
                                <div className="slider-label">
                                    <span>SFX</span>
                                    <span>{Math.round(globalVolume * 100)}%</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.01" value={globalVolume} onChange={e => setGlobalVolume(parseFloat(e.target.value))} className="paper-slider" aria-label="SFX volume" aria-valuetext={`${Math.round(globalVolume * 100)} percent`} />
                            </div>
                        </div>
                    </div>
                </div>}

            {}
            {(isMenuOpen || isAudioMenuOpen) && <div className="menu-overlay" onClick={() => {
      setIsMenuOpen(false);
      setIsAudioMenuOpen(false);
    }} />}
        </div>;
};
export default NavigationUI;
