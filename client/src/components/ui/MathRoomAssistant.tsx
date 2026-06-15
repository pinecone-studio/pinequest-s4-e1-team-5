import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import '../../styles/MathRoomAssistant.scss';

const AVATAR_FRAMES = Array.from({ length: 9 }, (_, i) => `/textures/corridor/avatar_anim/${i + 1}.webp`);

const MathRoomAssistant = () => {
  const { currentRoom } = useScene();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLImageElement | null>(null);
  const frameIndex = useRef(0);
  const isReversing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRoom = useRef<string | null>(null);

  useEffect(() => {
    if (currentRoom === 'math' && prevRoom.current !== 'math') {
      setDismissed(false);
      setVisible(true);
    }
    if (currentRoom !== 'math') {
      setVisible(false);
    }
    prevRoom.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (visible && !dismissed && panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0, y: 30, scale: 0.92 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.4)'
      });
    }
  }, [visible, dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;
    timerRef.current = setInterval(() => {
      if (!frameRef.current) return;
      if (frameIndex.current >= 8) isReversing.current = true;
      if (frameIndex.current <= 0) isReversing.current = false;
      frameIndex.current += isReversing.current ? -1 : 1;
      frameRef.current.src = AVATAR_FRAMES[frameIndex.current];
    }, 1000 / 20);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible, dismissed]);

  const handleDismiss = () => {
    if (!panelRef.current) { setDismissed(true); return; }
    gsap.to(panelRef.current, {
      opacity: 0, y: 20, scale: 0.92, duration: 0.35, ease: 'power2.in',
      onComplete: () => setDismissed(true)
    });
  };

  if (!visible || dismissed) return null;

  return (
    <div className="math-assistant" role="dialog" aria-label="AI туслагч">
      <div className="math-assistant__stage" ref={panelRef}>
        <div className="math-assistant__avatar-wrap" aria-hidden="true">
          <img
            ref={frameRef}
            className="math-assistant__avatar"
            src={AVATAR_FRAMES[0]}
            alt=""
          />
        </div>
        <div className="math-assistant__content">
          <div className="math-assistant__bubble">
            <p className="math-assistant__eyebrow">AI туслагч</p>
            <h2>Танд юу гэж тусалах вэ?</h2>
            <p className="math-assistant__hint">
              ТОМЬЁ дарж томьёо харах, бодлого оруулах эсвэл зургаар шинжлүүлэх боломжтой.
            </p>
          </div>
          <button className="math-assistant__dismiss" onClick={handleDismiss} aria-label="Хаах">
            Ойлголоо ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathRoomAssistant;
