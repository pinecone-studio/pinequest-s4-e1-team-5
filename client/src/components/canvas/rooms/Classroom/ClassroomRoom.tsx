import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  solveTutorProblem,
  type TutorSolveResponse,
  type TutorSubject
} from '../../../../lib/api';

const CLASSROOM_BACKGROUND_PATH = '/assets/backgrounds/classroom-sketch.png';

type ClassroomRoomProps = {
  showRoom?: boolean;
  onReady?: () => void;
  isExiting?: boolean;
};

const SketchLine = ({
  points,
  color = '#1f1f1f'
}: {
  points: [number, number, number][];
  color?: string;
}) => {
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point)));
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} linewidth={1} />
    </line>
  );
};

const ClassroomFallback = () => (
  <group position={[0, 0, -9]}>
    <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[26, 18]} />
      <meshBasicMaterial color="#dedede" side={THREE.DoubleSide} />
    </mesh>

    <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[26, 18]} />
      <meshBasicMaterial color="#f2f2f2" side={THREE.DoubleSide} />
    </mesh>

    <mesh position={[0, 1.6, -9]}>
      <planeGeometry args={[26, 13]} />
      <meshBasicMaterial color="#eeeeee" side={THREE.DoubleSide} />
    </mesh>

    <gridHelper args={[22, 22, '#9f9f9f', '#c8c8c8']} position={[0, -2.95, 0]} />

    <group position={[0, 2.3, -8.85]}>
      <mesh>
        <planeGeometry args={[8.8, 3.8]} />
        <meshBasicMaterial color="#536a53" side={THREE.DoubleSide} />
      </mesh>

      <Text font="/fonts/CabinSketch-Bold.ttf" fontSize={0.58} color="#eeeeee" anchorX="center" anchorY="middle" position={[0, 0.55, 0.05]} maxWidth={7.8} textAlign="center">
        AI TUTOR
      </Text>

      <Text font="/fonts/CabinSketch-Regular.ttf" fontSize={0.28} color="#e6e6e6" anchorX="center" anchorY="middle" position={[0, -0.45, 0.05]} maxWidth={7}>
        click the board
      </Text>
    </group>

    <group position={[0, -2.2, -5.7]}>
      {[-4.2, -1.4, 1.4, 4.2].map((x, index) => (
        <group key={x} position={[x, 0, Math.sin(index) * 0.35]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.55, 0.18, 1.0]} />
            <meshBasicMaterial color="#d8d8d8" />
          </mesh>
          <mesh position={[-0.55, 0, 0.28]}>
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshBasicMaterial color="#252525" />
          </mesh>
          <mesh position={[0.55, 0, 0.28]}>
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshBasicMaterial color="#252525" />
          </mesh>
          <SketchLine points={[[-0.78, 0.72, 0.52], [0.72, 0.66, 0.52], [0.78, 0.47, 0.52], [-0.7, 0.5, 0.52], [-0.78, 0.72, 0.52]]} />
        </group>
      ))}
    </group>
  </group>
);

const ClassroomRoom = ({ showRoom, onReady }: ClassroomRoomProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [boardHovered, setBoardHovered] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [problem, setProblem] = useState('sin 1140°-ийн утгыг ол');
  const [subject, setSubject] = useState<TutorSubject>('math');
  const [grade, setGrade] = useState(11);
  const [tutorResult, setTutorResult] = useState<TutorSolveResponse | null>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    if (!showRoom) return;
    const readyTimer = window.setTimeout(() => onReady?.(), 120);
    return () => window.clearTimeout(readyTimer);
  }, [showRoom, onReady]);

  const handleChalkboardClick = () => {
    setPanelOpen(true);
  };

  const handleTutorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedProblem = problem.trim();
    if (!trimmedProblem || isSolving) {
      return;
    }

    setIsSolving(true);
    setTutorError(null);

    try {
      const result = await solveTutorProblem({
        problem: trimmedProblem,
        grade,
        subject
      });
      setTutorResult(result);
    } catch (error) {
      setTutorResult(null);
      setTutorError(
        error instanceof Error
          ? error.message
          : 'Backend-тэй холбогдох үед алдаа гарлаа.'
      );
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <group>
      {!imageFailed && (
        <Html fullscreen zIndexRange={[20, 0]}>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
              background: '#f5f5f2',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          >
            {/* Replace /assets/backgrounds/classroom-sketch.png to change the classroom background. */}
            <img
              src={CLASSROOM_BACKGROUND_PATH}
              alt=""
              draggable={false}
              onError={() => setImageFailed(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                zIndex: 0,
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />

            <button
              type="button"
              aria-label="Open AI tutor"
              onClick={handleChalkboardClick}
              onMouseEnter={() => setBoardHovered(true)}
              onMouseLeave={() => setBoardHovered(false)}
              style={{
                position: 'absolute',
                left: '27%',
                top: '18%',
                width: '46%',
                height: '28%',
                zIndex: 5,
                border: boardHovered ? '2px dashed rgba(30, 30, 30, 0.45)' : '2px dashed transparent',
                borderRadius: '4px',
                padding: 0,
                margin: 0,
                background: boardHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                boxShadow: boardHovered ? '0 0 0 1px rgba(255, 255, 255, 0.28) inset' : 'none',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '66%',
                top: '19%',
                zIndex: 6,
                transform: boardHovered ? 'rotate(1deg) translateY(-2px)' : 'rotate(-1deg)',
                padding: '0.45rem 0.65rem',
                color: '#232323',
                background: 'rgba(248, 248, 244, 0.86)',
                border: '1px solid rgba(35, 35, 35, 0.55)',
                boxShadow: '2px 3px 0 rgba(20, 20, 20, 0.14)',
                fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
                fontSize: 'clamp(0.72rem, 1.2vw, 0.95rem)',
                lineHeight: 1.05,
                pointerEvents: 'none',
                transition: 'transform 160ms ease, opacity 160ms ease'
              }}
            >
              <strong style={{ display: 'block', fontWeight: 700 }}>AI Tutor</strong>
              <span>Click the board</span>
            </div>

            {boardHovered && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '44%',
                  top: '47%',
                  zIndex: 6,
                  transform: 'rotate(1.5deg)',
                  padding: '0.35rem 0.55rem',
                  color: '#333',
                  background: 'rgba(250, 250, 247, 0.9)',
                  border: '1px solid rgba(40, 40, 40, 0.5)',
                  boxShadow: '1px 2px 0 rgba(0, 0, 0, 0.12)',
                  fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
                  fontSize: 'clamp(0.68rem, 1vw, 0.84rem)',
                  pointerEvents: 'none'
                }}
              >
                open tutor note
              </div>
            )}

            {panelOpen && (
              <div
                role="dialog"
                aria-modal="false"
                aria-label="AI Tutor"
                style={{
                  position: 'absolute',
                  right: 'clamp(1rem, 7vw, 7rem)',
                  bottom: 'clamp(5rem, 12vh, 8rem)',
                  zIndex: 12,
                  width: 'min(22rem, calc(100vw - 2rem))',
                  padding: '1rem 1.1rem',
                  color: '#202020',
                  background: 'rgba(250, 250, 246, 0.94)',
                  border: '1.5px solid rgba(30, 30, 30, 0.7)',
                  boxShadow: '4px 5px 0 rgba(20, 20, 20, 0.16)',
                  transform: 'rotate(-0.7deg)',
                  fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
                  pointerEvents: 'auto'
                }}
              >
                <h2 style={{ margin: '0 0 0.45rem', fontSize: '1.35rem', fontWeight: 700 }}>
                  AI Tutor
                </h2>
                <p style={{ margin: '0 0 0.8rem', fontSize: '1rem', lineHeight: 1.35 }}>
                  Энд бодлогоо оруулж, тайлбарлуулж болно.
                </p>
                <form onSubmit={handleTutorSubmit}>
                  <textarea
                    aria-label="Tutor problem"
                    value={problem}
                    onChange={event => setProblem(event.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      margin: '0 0 0.55rem',
                      padding: '0.5rem 0.6rem',
                      color: '#202020',
                      background: 'rgba(255, 255, 251, 0.86)',
                      border: '1px solid rgba(30, 30, 30, 0.55)',
                      boxShadow: '1px 1px 0 rgba(20, 20, 20, 0.1)',
                      font: 'inherit',
                      lineHeight: 1.25
                    }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 5rem',
                      gap: '0.45rem',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <select
                      aria-label="Subject"
                      value={subject}
                      onChange={event => setSubject(event.target.value as TutorSubject)}
                      style={{
                        minWidth: 0,
                        color: '#202020',
                        background: '#f7f7f3',
                        border: '1px solid rgba(30, 30, 30, 0.65)',
                        font: 'inherit'
                      }}
                    >
                      <option value="math">Math</option>
                      <option value="physics">Physics</option>
                      <option value="geometry">Geometry</option>
                      <option value="chemistry">Chemistry</option>
                    </select>
                    <input
                      aria-label="Grade"
                      min={1}
                      max={12}
                      type="number"
                      value={grade}
                      onChange={event => setGrade(Number(event.target.value) || 11)}
                      style={{
                        minWidth: 0,
                        color: '#202020',
                        background: '#f7f7f3',
                        border: '1px solid rgba(30, 30, 30, 0.65)',
                        font: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={isSolving}
                      style={{
                        padding: '0.35rem 0.75rem',
                        color: '#202020',
                        background: '#f7f7f3',
                        border: '1px solid rgba(30, 30, 30, 0.75)',
                        boxShadow: '2px 2px 0 rgba(20, 20, 20, 0.15)',
                        font: 'inherit',
                        cursor: isSolving ? 'wait' : 'pointer',
                        opacity: isSolving ? 0.7 : 1
                      }}
                    >
                      {isSolving ? 'Solving...' : 'Ask tutor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelOpen(false)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        color: '#202020',
                        background: '#f7f7f3',
                        border: '1px solid rgba(30, 30, 30, 0.75)',
                        boxShadow: '2px 2px 0 rgba(20, 20, 20, 0.15)',
                        font: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </form>

                {tutorError && (
                  <p
                    role="alert"
                    style={{
                      margin: '0.75rem 0 0',
                      color: '#7d2323',
                      fontSize: '0.88rem',
                      lineHeight: 1.25
                    }}
                  >
                    {tutorError}
                  </p>
                )}

                {tutorResult && (
                  <div
                    style={{
                      marginTop: '0.8rem',
                      maxHeight: '11rem',
                      overflowY: 'auto',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid rgba(30, 30, 30, 0.28)'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                      {tutorResult.answer.topic}
                    </strong>
                    <p style={{ margin: '0 0 0.45rem', fontSize: '0.92rem', lineHeight: 1.3 }}>
                      {tutorResult.answer.finalAnswer}
                    </p>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', lineHeight: 1.25 }}>
                      Томьёо: {tutorResult.answer.formulaUsed}
                    </p>
                    <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', lineHeight: 1.25 }}>
                      {tutorResult.answer.solutionSteps.slice(0, 3).map(step => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </Html>
      )}

      {imageFailed && <ClassroomFallback />}
    </group>
  );
};

export default ClassroomRoom;
