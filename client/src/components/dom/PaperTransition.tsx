import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';
import '../../styles/Preloader.scss';
const TearLineSVG = ({
  svgPathData
}) => <svg className="preloader__overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style={{
  pointerEvents: 'none'
}}>
        <path d={svgPathData} fill="none" stroke="#1a1a1a" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
const PaperTransition = () => {
  const {
    teleportPhase,
    startTeleportTransition,
    finishPaperOpen,
    teleportTarget
  } = useScene();
  const {
    play
  } = useAudio();
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);
  const timelineRef = useRef(null);
  const tearPoints = useMemo(() => {
    const points = [];
    const segments = 12;
    points.push([50, 0]);
    for (let i = 1; i < segments; i++) {
      const y = i / segments * 100;
      const xOffset = (Math.random() - 0.5) * 6;
      const x = 50 + xOffset;
      points.push([x, y]);
    }
    points.push([50, 100]);
    return points;
  }, []);
  const svgPathData = useMemo(() => {
    return tearPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]} `).join(' ');
  }, [tearPoints]);
  const leftClipPoly = useMemo(() => {
    let poly = '0% 0%, ';
    tearPoints.forEach(p => {
      poly += `${p[0]}% ${p[1]}%, `;
    });
    poly += '0% 100%';
    return `polygon(${poly})`;
  }, [tearPoints]);
  const rightClipPoly = useMemo(() => {
    let poly = '100% 0%, ';
    poly += '100% 100%, ';
    [...tearPoints].reverse().forEach(p => {
      poly += `${p[0]}% ${p[1]}%, `;
    });
    return `polygon(${poly.slice(0, -2)})`;
  }, [tearPoints]);
  useEffect(() => {
    if (!leftHalfRef.current || !rightHalfRef.current || !containerRef.current) return;
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    if (teleportPhase === 'closing') {
      gsap.set(containerRef.current, {
        opacity: 1,
        display: 'block'
      });
      gsap.set(leftHalfRef.current, {
        xPercent: -100,
        rotation: -2
      });
      gsap.set(rightHalfRef.current, {
        xPercent: 100,
        rotation: 2
      });
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          startTeleportTransition();
        }
      });
      play('tear', {
        volume: 0.6
      });
      timelineRef.current.to(leftHalfRef.current, {
        xPercent: 0,
        rotation: 0,
        duration: 0.8,
        ease: "power2.inOut"
      }, 'close');
      timelineRef.current.to(rightHalfRef.current, {
        xPercent: 0,
        rotation: 0,
        duration: 0.8,
        ease: "power2.inOut"
      }, 'close');
    }
    if (teleportPhase === 'teleporting') {}
    if (teleportPhase === 'opening') {
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          finishPaperOpen();
        }
      });
      play('tear', {
        volume: 0.8
      });
      timelineRef.current.to(leftHalfRef.current, {
        xPercent: -100,
        rotation: -2,
        duration: 1.2,
        ease: "power3.inOut"
      }, 'tear');
      timelineRef.current.to(rightHalfRef.current, {
        xPercent: 100,
        rotation: 2,
        duration: 1.2,
        ease: "power3.inOut"
      }, 'tear');
      timelineRef.current.to(containerRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          gsap.set(containerRef.current, {
            display: 'none'
          });
        }
      }, '-=0.3');
    }
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [teleportPhase, startTeleportTransition, finishPaperOpen, play]);
  return <div className="preloader" ref={containerRef} style={{
    pointerEvents: 'none',
    display: 'none'
  }}>
            {}
            <div className="preloader__half preloader__half--left" ref={leftHalfRef} style={{
      clipPath: leftClipPoly
    }}>
                <TearLineSVG svgPathData={svgPathData} />
            </div>

            {}
            <div className="preloader__half preloader__half--right" ref={rightHalfRef} style={{
      clipPath: rightClipPoly
    }}>
                <TearLineSVG svgPathData={svgPathData} />
            </div>
        </div>;
};
export default PaperTransition;
