import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useScene } from '../../../../context/SceneContext';
import { generateMathQuiz, type QuizQuestion } from '../../../../lib/api';
import type { TopicData } from './PhysicsData';

const FONT = '/fonts/CabinSketch-Bold.ttf';
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export const CARD_W = 1.52;
export const CARD_H = 2.35;

const PINK = '#e040a0';
const PINK_BRIGHT = '#ff5ab8';
const DARK_BG = '#06000f';

const TOPIC_ACCENT: Record<string, string> = {
  newton:       '#ff4da6',
  kinematics_v: '#c060e0',
  kinematics_s: '#e040a0',
  energy_k:     '#ff6090',
  energy_p:     '#d060c0',
  ohm:          '#b040e0',
  wave:         '#e870c0',
  gravity:      '#ff3080',
};

type QuizState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'questions'; questions: QuizQuestion[]; idx: number; chosen: (number | null)[] }
  | { phase: 'error' };

export type PhysicsCardHandle = {
  openCard: () => Promise<void>;
  closeCard: () => Promise<void>;
};

type Props = {
  index: number;
  topic: TopicData;
  isSelected: boolean;
  onClick: (idx: number) => void;
};

const Border = memo(({ accent }: { accent: string }) => {
  const hw = CARD_W / 2;
  const hh = CARD_H / 2;
  const z = 0.002;
  const T = 0.018; // thickness
  return (
    <group>
      <mesh position={[0,  hh - T / 2, z]}><planeGeometry args={[CARD_W, T]} /><meshBasicMaterial color={accent} /></mesh>
      <mesh position={[0, -hh + T / 2, z]}><planeGeometry args={[CARD_W, T]} /><meshBasicMaterial color={accent} /></mesh>
      <mesh position={[-hw + T / 2, 0, z]}><planeGeometry args={[T, CARD_H]} /><meshBasicMaterial color={accent} /></mesh>
      <mesh position={[ hw - T / 2, 0, z]}><planeGeometry args={[T, CARD_H]} /><meshBasicMaterial color={accent} /></mesh>
    </group>
  );
});
Border.displayName = 'Border';

const PhysicsCard = memo(
  forwardRef<PhysicsCardHandle, Props>(({ index, topic, isSelected, onClick }, ref) => {
    const paperRef = useRef<THREE.Group>(null!);
    const [isAnimating, setIsAnimating] = useState(false);
    const [quiz, setQuiz] = useState<QuizState>({ phase: 'idle' });
    const [paramValues, setParamValues] = useState<number[]>(() =>
      topic.interactive?.params.map((p) => p.default) || []
    );
    const { openOverlay } = useScene();

    useImperativeHandle(ref, () => ({
      openCard: () =>
        new Promise<void>((resolve) => {
          setIsAnimating(true);
          gsap.to(paperRef.current.rotation, {
            y: Math.PI,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: () => { setIsAnimating(false); resolve(); },
          });
        }),
      closeCard: () =>
        new Promise<void>((resolve) => {
          setIsAnimating(true);
          setQuiz({ phase: 'idle' });
          setParamValues(topic.interactive?.params.map((p) => p.default) || []);
          gsap.to(paperRef.current.rotation, {
            y: 0,
            duration: 0.38,
            ease: 'power2.inOut',
            onComplete: () => { setIsAnimating(false); resolve(); },
          });
        }),
    }));

    const startQuiz = useCallback(async () => {
      setQuiz({ phase: 'loading' });
      try {
        const res = await generateMathQuiz(topic.apiTopic, '6-9', 3);
        setQuiz({ phase: 'questions', questions: res.questions, idx: 0, chosen: new Array(res.questions.length).fill(null) });
      } catch {
        setQuiz({ phase: 'error' });
      }
    }, [topic.apiTopic]);

    const chooseOption = useCallback((oi: number) => {
      if (quiz.phase !== 'questions' || quiz.chosen[quiz.idx] !== null) return;
      const updated = [...quiz.chosen];
      updated[quiz.idx] = oi;
      setQuiz({ ...quiz, chosen: updated });
    }, [quiz]);

    const nextQuestion = useCallback(() => {
      if (quiz.phase !== 'questions') return;
      if (quiz.idx < quiz.questions.length - 1) setQuiz({ ...quiz, idx: quiz.idx + 1 });
      else setQuiz({ phase: 'idle' });
    }, [quiz]);

    const handleInteractive = useCallback(() => {
      openOverlay({ title: topic.title, description: topic.fullDetail, platformConfig: { label: 'ФИЗИК' }, topicData: topic });
    }, [openOverlay, topic]);

    const handleSliderClick = useCallback((paramIdx: number, step: number) => {
      if (!topic.interactive) return;
      const p = topic.interactive.params[paramIdx];
      setParamValues((prev) => {
        const next = [...prev];
        next[paramIdx] = Math.round(THREE.MathUtils.clamp(next[paramIdx] + step, p.min, p.max) * 10) / 10;
        return next;
      });
    }, [topic.interactive]);

    const setCursor = (v: string) => { document.body.style.cursor = v; };
    const accent = TOPIC_ACCENT[topic.id] ?? PINK;
    const bOp = isSelected ? 1 : 0;

    const calcResult = topic.interactive
      ? topic.interactive.calculate(paramValues[0] || 0, paramValues[1] || 0, paramValues[2] || 0).toFixed(2)
      : '0';

    const q = quiz.phase === 'questions' ? quiz.questions[quiz.idx] : null;
    const qChosen = quiz.phase === 'questions' ? quiz.chosen[quiz.idx] : null;
    const isLastQ = quiz.phase === 'questions' && quiz.idx === quiz.questions.length - 1;

    return (
      <group
        onClick={(e) => { e.stopPropagation(); onClick(index); }}
        onPointerEnter={() => { if (!isSelected && !isAnimating) setCursor('pointer'); }}
        onPointerLeave={() => setCursor('auto')}
      >
        <group ref={paperRef}>

          {/* ── Card base ─────────────────────────────────────────────── */}
          <mesh>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshBasicMaterial color={DARK_BG} transparent opacity={0.96} side={THREE.DoubleSide} />
          </mesh>
          <Border accent={accent} />

          {/* ── Accent stripe ─────────────────────────────────────────── */}
          <mesh position={[0, CARD_H / 2 - 0.06, 0.003]}>
            <planeGeometry args={[CARD_W, 0.1]} />
            <meshBasicMaterial color={accent} transparent opacity={isSelected ? 0 : 1} />
          </mesh>

          {/* ── FRONT ─────────────────────────────────────────────────── */}
          <Text position={[0, 0.78, 0.005]} fontSize={0.098} color={accent} font={FONT}
            anchorX="center" anchorY="middle" maxWidth={1.35} textAlign="center"
            fillOpacity={isSelected ? 0 : 1} letterSpacing={0.04}>
            {topic.title}
          </Text>

          {/* Formula box */}
          <mesh position={[0, 0.17, 0.003]}>
            <planeGeometry args={[1.32, 0.52]} />
            <meshBasicMaterial color="#12002a" transparent opacity={isSelected ? 0 : 0.85} />
          </mesh>
          <mesh position={[0, 0.43, 0.004]}><planeGeometry args={[1.32, 0.008]} /><meshBasicMaterial color={accent} transparent opacity={isSelected ? 0 : 1} /></mesh>
          <mesh position={[0, -0.09, 0.004]}><planeGeometry args={[1.32, 0.005]} /><meshBasicMaterial color={accent} transparent opacity={isSelected ? 0 : 0.6} /></mesh>

          <Text position={[-0.55, 0.40, 0.006]} fontSize={0.042} color={accent} font={FONT}
            anchorX="left" anchorY="middle" letterSpacing={0.06} fillOpacity={isSelected ? 0 : 0.8}>
            ТОМЬЁО
          </Text>
          <Text position={[0, 0.165, 0.006]} fontSize={0.155} color="#ffffff" font={FONT}
            anchorX="center" anchorY="middle" maxWidth={1.2} textAlign="center"
            overflowWrap="break-word" lineHeight={1.25} fillOpacity={isSelected ? 0 : 1}>
            {topic.formula}
          </Text>

          <Text position={[0, -0.47, 0.005]} fontSize={0.068} color="#cc88b8" font={FONT}
            anchorX="center" anchorY="middle" maxWidth={1.28} textAlign="center" lineHeight={1.5}
            fillOpacity={isSelected ? 0 : 1}>
            {topic.shortDetail}
          </Text>

          <Text position={[0, -0.98, 0.005]} fontSize={0.05} color="#6a2a5a" font={FONT}
            anchorX="center" anchorY="middle" fillOpacity={isSelected ? 0 : 1}>
            дарж дэлгэрэнгүй үзнэ үү
          </Text>

          {/* ── BACK ──────────────────────────────────────────────────── */}
          {isSelected && (
            <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.004]} renderOrder={50}>

              {/* Back base */}
              <mesh renderOrder={49}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                <meshBasicMaterial color="#0a001e" transparent opacity={0.97} side={THREE.DoubleSide} depthTest={false} />
              </mesh>
              <Border accent={accent} />

              {/* Section 1 – Interactive button */}
              <group position={[0, 0.98, 0]}>
                <mesh onClick={(e) => { e.stopPropagation(); handleInteractive(); }}
                  onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                  onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                  <planeGeometry args={[1.1, 0.16]} />
                  <meshBasicMaterial color="#1a0038" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                </mesh>
                <mesh position={[0, 0, 0.001]}>
                  <planeGeometry args={[1.1, 0.016]} />
                  <meshBasicMaterial color={accent} depthTest={false} />
                </mesh>
                <mesh position={[0, -0.072, 0.001]}>
                  <planeGeometry args={[1.1, 0.016]} />
                  <meshBasicMaterial color={accent} depthTest={false} />
                </mesh>
                <Text position={[0, -0.036, 0.003]} fontSize={0.068} color={accent} font={FONT}
                  anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>
                  Интерактив
                </Text>
              </group>

              {/* Interactive controls */}
              {topic.interactive && (
                <group position={[0, 0.58, 0]}>
                  {topic.interactive.params.map((p, pi) => {
                    const yOff = -pi * 0.145;
                    const cur = paramValues[pi] ?? p.default;
                    return (
                      <group key={p.name} position={[0, yOff, 0]}>
                        <Text position={[-0.54, 0, 0.002]} fontSize={0.044} color="#cc88b8" font={FONT}
                          anchorX="left" anchorY="middle" maxWidth={0.44} fillOpacity={bOp} depthTest={false}>
                          {p.label}: {cur}
                        </Text>
                        {/* minus */}
                        <group position={[-0.04, 0, 0.002]}>
                          <mesh onClick={(e) => { e.stopPropagation(); handleSliderClick(pi, -1); }}
                            onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                            onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                            <planeGeometry args={[0.082, 0.072]} />
                            <meshBasicMaterial color="#3a0030" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                          </mesh>
                          <Text position={[0, 0, 0.002]} fontSize={0.05} color={accent} font={FONT} anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>-</Text>
                        </group>
                        {/* plus */}
                        <group position={[0.08, 0, 0.002]}>
                          <mesh onClick={(e) => { e.stopPropagation(); handleSliderClick(pi, 1); }}
                            onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                            onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                            <planeGeometry args={[0.082, 0.072]} />
                            <meshBasicMaterial color="#1a002e" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                          </mesh>
                          <Text position={[0, 0, 0.002]} fontSize={0.05} color={PINK_BRIGHT} font={FONT} anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>+</Text>
                        </group>
                      </group>
                    );
                  })}
                  {/* Result */}
                  <group position={[0, -topic.interactive.params.length * 0.145 - 0.06, 0.002]}>
                    <mesh>
                      <planeGeometry args={[1.1, 0.09]} />
                      <meshBasicMaterial color="#12002a" transparent opacity={0.88} side={THREE.DoubleSide} depthTest={false} />
                    </mesh>
                    <Text position={[0, 0, 0.002]} fontSize={0.052} color={PINK_BRIGHT} font={FONT}
                      anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>
                      Хариу: {calcResult} {topic.interactive.unit}
                    </Text>
                  </group>
                </group>
              )}

              {/* Divider */}
              <mesh position={[0, 0.21, 0.001]}>
                <planeGeometry args={[1.3, 0.004]} />
                <meshBasicMaterial color={accent} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
              </mesh>

              {/* Section 2 – Explanation */}
              <group position={[0, -0.36, 0]}>
                <Text position={[0, 0.16, 0.002]} fontSize={0.048} color={accent} font={FONT}
                  anchorX="center" anchorY="middle" letterSpacing={0.06} fillOpacity={bOp} depthTest={false}>
                  ТОМЬЁОНЫ ТАЙЛБАР
                </Text>
                <mesh position={[0, 0.12, 0.001]}><planeGeometry args={[1.25, 0.005]} /><meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.DoubleSide} depthTest={false} /></mesh>
                <mesh position={[-0.598, -0.10, 0.001]}><planeGeometry args={[0.008, 0.44]} /><meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.DoubleSide} depthTest={false} /></mesh>
                <Text position={[-0.54, 0.08, 0.002]} fontSize={0.044} color="#cc88b8" font={FONT}
                  anchorX="left" anchorY="top" maxWidth={1.14} textAlign="left" lineHeight={1.28}
                  fillOpacity={bOp} clipRect={[-0.56, -0.30, 0.56, 0.10]} depthTest={false}>
                  {topic.fullDetail}
                </Text>
              </group>

              {/* Divider */}
              <mesh position={[0, -0.44, 0.001]}>
                <planeGeometry args={[1.3, 0.004]} />
                <meshBasicMaterial color={accent} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
              </mesh>

              {/* Section 3 – AI Quiz */}
              <group position={[0, -1.07, 0]}>
                {quiz.phase === 'idle' && (
                  <group>
                    <mesh onClick={(e) => { e.stopPropagation(); startQuiz(); }}
                      onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                      onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                      <planeGeometry args={[1.1, 0.15]} />
                      <meshBasicMaterial color="#1a002e" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                    </mesh>
                    <mesh position={[0, 0, 0.001]}><planeGeometry args={[1.1, 0.015]} /><meshBasicMaterial color={accent} depthTest={false} /></mesh>
                    <mesh position={[0, -0.068, 0.001]}><planeGeometry args={[1.1, 0.015]} /><meshBasicMaterial color={accent} depthTest={false} /></mesh>
                    <Text position={[0, -0.034, 0.002]} fontSize={0.092} color={accent} font={FONT}
                      anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>
                      AI Quiz  →
                    </Text>
                  </group>
                )}
                {quiz.phase === 'loading' && (
                  <Text position={[0, 0, 0.002]} fontSize={0.068} color="#886688" font={FONT} anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>
                    Ачааллаж байна...
                  </Text>
                )}
                {quiz.phase === 'error' && (
                  <Text position={[0, 0, 0.002]} fontSize={0.062} color="#cc4488" font={FONT} anchorX="center" anchorY="middle" maxWidth={1.2} textAlign="center" fillOpacity={bOp} depthTest={false}>
                    Алдаа гарлаа. Дахин дарна уу.
                  </Text>
                )}
                {quiz.phase === 'questions' && q && (
                  <group>
                    <Text position={[0, 0.26, 0.002]} fontSize={0.054} color="#eeccee" font={FONT}
                      anchorX="center" anchorY="top" maxWidth={1.25} textAlign="center" lineHeight={1.3}
                      fillOpacity={bOp} depthTest={false}>
                      {q.question}
                    </Text>
                    <group position={[0, -0.04, 0]}>
                      {q.options.map((opt, oi) => {
                        const yPos = -oi * 0.105;
                        const has = qChosen !== null;
                        const isC = oi === q.correctIndex;
                        const isCh = qChosen === oi;
                        const bg = !has ? '#180028' : isC ? '#0a2a0a' : isCh ? '#2a0a18' : '#180028';
                        return (
                          <group key={oi} position={[0, yPos, 0]}>
                            <mesh
                              onClick={(e) => { if (!has) { e.stopPropagation(); chooseOption(oi); } }}
                              onPointerEnter={(e) => { if (!has) { e.stopPropagation(); setCursor('pointer'); } }}
                              onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                              <planeGeometry args={[1.25, 0.09]} />
                              <meshBasicMaterial color={bg} transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                            </mesh>
                            <Text position={[-0.56, 0, 0.002]} fontSize={0.042} color={has && isC ? '#88ff88' : has && isCh ? '#ff8888' : '#cc88b8'} font={FONT}
                              anchorX="left" anchorY="middle" maxWidth={1.18} fillOpacity={bOp} depthTest={false}>
                              {OPTION_LABELS[oi]}. {opt}
                            </Text>
                          </group>
                        );
                      })}
                    </group>
                    {qChosen !== null && (
                      <group position={[0, -0.48, 0]}>
                        <mesh onClick={(e) => { e.stopPropagation(); nextQuestion(); }}
                          onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                          onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}>
                          <planeGeometry args={[0.68, 0.12]} />
                          <meshBasicMaterial color="#1a0038" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                        </mesh>
                        <Text position={[0, 0, 0.002]} fontSize={0.054} color={accent} font={FONT} anchorX="center" anchorY="middle" fillOpacity={bOp} depthTest={false}>
                          {isLastQ ? 'Дуусгах ✓' : 'Дараах →'}
                        </Text>
                      </group>
                    )}
                  </group>
                )}
              </group>
            </group>
          )}
        </group>
      </group>
    );
  }),
);

PhysicsCard.displayName = 'PhysicsCard';
export default PhysicsCard;
