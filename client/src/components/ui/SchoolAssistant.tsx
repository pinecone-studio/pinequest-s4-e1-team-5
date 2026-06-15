import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import '../../styles/SchoolAssistant.scss';

const LEVEL_OPTIONS = [
  {
    id: 'middle',
    number: '1',
    label: 'Дунд анги'
  },
  {
    id: 'high',
    number: '2',
    label: 'Ахлах анги'
  }
];

const SchoolAssistant = () => {
  const {
    schoolAssistantVisible,
    schoolAssistantPlacement,
    chooseSchoolLevel
  } = useScene();
  const panelRef = useRef<HTMLElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!schoolAssistantVisible || !panelRef.current) return;

    gsap.fromTo(panelRef.current, {
      opacity: 0,
      y: 18,
      scale: 0.9
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.68,
      ease: 'power3.out'
    });

    window.setTimeout(() => firstButtonRef.current?.focus(), 120);
  }, [schoolAssistantVisible]);

  if (!schoolAssistantVisible) {
    return null;
  }

  const sideClass = schoolAssistantPlacement?.side === 'right' ? 'school-assistant--right' : 'school-assistant--left';

  return <div className={`school-assistant ${sideClass}`} role="dialog" aria-modal="true" aria-labelledby="school-assistant-title">
      <section className="school-assistant__stage" ref={panelRef}>
        <div className="school-assistant__avatar-wrap" aria-hidden="true">
          <img className="school-assistant__avatar" src="/textures/corridor/avatar_anim/3.webp" alt="" />
        </div>

        <div className="school-assistant__content">
          <div className="school-assistant__bubble">
            <p className="school-assistant__eyebrow">AI assistant</p>
            <h2 id="school-assistant-title">Та хэддүгээр анги вэ?</h2>
            <p className="school-assistant__message">Өрөө рүү орохын өмнө түвшнээ сонгоорой.</p>
          </div>

          <div className="school-assistant__choices" aria-label="Ангийн түвшин сонгох">
            {LEVEL_OPTIONS.map((option, index) => <button
                key={option.id}
                ref={index === 0 ? firstButtonRef : null}
                type="button"
                className="school-assistant__choice"
                onClick={() => chooseSchoolLevel(option.id)}
              >
                <span className="school-assistant__choice-number">{option.number}</span>
                <span>{option.label}</span>
              </button>)}
          </div>
        </div>
      </section>
    </div>;
};

export default SchoolAssistant;
