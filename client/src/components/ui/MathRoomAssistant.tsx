import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import '../../styles/MathRoomAssistant.scss';

const MathRoomAssistant = () => {
  const { currentRoom } = useScene();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
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
        <div className="math-assistant__content">
        </div>
      </div>
    </div>
  );
};

export default MathRoomAssistant;
