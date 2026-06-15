import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useScene } from '../../../../context/SceneContext';
import PaperMaterial from '../Mathematic/PaperMaterial';
import { generateMathQuiz, type QuizQuestion } from '../../../../lib/api';
import {
  type TopicData,
  CARD_COUNT,
  CARD_H,
  CARD_W,
  GAP,
  PAPER_REF_Y,
} from './GeometryData';

const FONT = '/fonts/CabinSketch-Bold.ttf';
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const STATIC_PAINT = { value: 1.0 };
const STATIC_ORIGIN = { value: new THREE.Vector3(0, 0, 0) };

const TOPIC_ACCENT: Record<string, string> = {
  triangle:    '#d48c30',
  pythagorean: '#3870b8',
  circle:      '#38905a',
  rectangle:   '#b83850',
  trapezoid:   '#7838b8',
  sphere:      '#3898b8',
  cylinder:    '#b87838',
  coordinate:  '#589838',
};

type QuizState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'questions'; questions: QuizQuestion[]; idx: number; chosen: (number | null)[] }
  | { phase: 'error' };

export type GeometryCardHandle = {
  openCard: () => Promise<void>;
  closeCard: () => Promise<void>;
};

type Props = {
  index: number;
  topic: TopicData;
  frontTexture: THREE.Texture;
  backTexture: THREE.Texture;
  buttonTexture: THREE.Texture;
  clothespinTexture: THREE.Texture;
  total: number;
  currentScroll: React.MutableRefObject<number>;
  curve: THREE.CatmullRomCurve3;
  isSelected: boolean;
  scrollToIndex: (idx: number, cb: () => void) => void;
  onClick: (idx: number) => void;
};

const GeometryCard = memo(
  forwardRef<GeometryCardHandle, Props>(
    (
      {
        index,
        topic,
        frontTexture,
        backTexture,
        buttonTexture,
        clothespinTexture,
        total,
        currentScroll,
        curve,
        isSelected,
        scrollToIndex,
        onClick,
      },
      ref,
    ) => {
      const cardRef = useRef<THREE.Group>(null!);
      const paperRef = useRef<THREE.Group>(null!);
      const materialRef = useRef<any>(null);
      const [isAnimating, setIsAnimating] = useState(false);
      const [quiz, setQuiz] = useState<QuizState>({ phase: 'idle' });
      const swayOffset = useRef(Math.random() * 100);
      const swaySpeed = useRef(0.22 + Math.random() * 0.18);

      const { openOverlay } = useScene();

      useImperativeHandle(ref, () => ({
        openCard: () =>
          new Promise<void>((resolve) => {
            setIsAnimating(true);
            scrollToIndex(index, () => {
              const isMobile = window.innerWidth < 768;
              const parentPos = cardRef.current.position;
              const tX = -parentPos.x;
              const tY = (isMobile ? -0.2 : 0.1) - parentPos.y;
              const tZ = (isMobile ? 0.5 : 1.6) - parentPos.z;

              const tl = gsap.timeline({
                onComplete: () => { setIsAnimating(false); resolve(); },
              });

              tl.to(cardRef.current.rotation, { x: 0, y: 0, z: 0, duration: 0.25, ease: 'power2.out' }, 0);
              if (materialRef.current) materialRef.current.bend = 0;

              tl.to(paperRef.current.position, { y: PAPER_REF_Y - 0.42, duration: 0.15, ease: 'power2.out' });
              tl.to(paperRef.current.rotation, { x: 0.42, z: -0.04, duration: 0.15, ease: 'power2.out' }, '<');
              if (materialRef.current) tl.to(materialRef.current, { bend: 0.8, duration: 0.15, ease: 'power2.out' }, '<');

              tl.to(paperRef.current.position, { y: PAPER_REF_Y + 1.5, x: tX * 0.2, z: tZ * 0.2, duration: 0.4, ease: 'power1.out' });
              // 🔥 FIX: Y тэнхлэгээр эргүүлж ард талыг харуулна
              tl.to(paperRef.current.rotation, { x: 0, y: Math.PI, z: 0, duration: 0.4, ease: 'power1.inOut' }, '<');
              if (materialRef.current) tl.to(materialRef.current, { bend: -0.3, duration: 0.4, ease: 'power1.inOut' }, '<');

              tl.to(paperRef.current.position, { y: tY, x: tX, z: tZ, duration: 0.4, ease: 'power3.out' });
              tl.to(paperRef.current.rotation, { x: 0, y: Math.PI, z: 0, duration: 0.4, ease: 'power3.out' }, '<');
              if (materialRef.current) tl.to(materialRef.current, { bend: 0, duration: 0.5, ease: 'power2.out' }, '<');
              tl.to(paperRef.current.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3, ease: 'sine.out' }, '-=0.4');
            });
          }),

        closeCard: () =>
          new Promise<void>((resolve) => {
            setIsAnimating(true);
            setQuiz({ phase: 'idle' });
            const tl = gsap.timeline({
              onComplete: () => { setIsAnimating(false); resolve(); },
            });
            tl.to(paperRef.current.position, { y: PAPER_REF_Y + 0.55, x: 0, z: 0.9, duration: 0.35, ease: 'power2.in' });
            tl.to(paperRef.current.rotation, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power2.in' }, '<');
            tl.to(paperRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'sine.inOut' }, '<');
            if (materialRef.current) tl.to(materialRef.current, { bend: 0.6, duration: 0.3, ease: 'power2.in' }, '<');
            tl.to(paperRef.current.position, { y: PAPER_REF_Y, x: 0, z: 0, duration: 0.25, ease: 'power3.out' });
            tl.to(paperRef.current.rotation, { x: 0, y: 0, z: 0, duration: 0.25, ease: 'power3.out' }, '<');
            if (materialRef.current) tl.to(materialRef.current, { bend: 0, duration: 0.3, ease: 'power2.out' }, '<');
          }),
      }));

      useFrame((state) => {
        if (!cardRef.current || isAnimating || isSelected) return;

        const totalWidth = total * GAP;
        const rawX = index * GAP - currentScroll.current;
        const half = totalWidth / 2;
        const displayX = ((((rawX + half) % totalWidth) + totalWidth) % totalWidth) - half;

        const rangeX = 13;
        const u = THREE.MathUtils.clamp((displayX + rangeX) / (rangeX * 2), 0, 1);
        const pt = curve.getPointAt(u);

        cardRef.current.position.set(pt.x, pt.y, pt.z);

        const t = state.clock.getElapsedTime();
        cardRef.current.rotation.z = Math.sin(t * swaySpeed.current + swayOffset.current) * 0.04;

        const dist = Math.abs(displayX);
        cardRef.current.scale.setScalar(THREE.MathUtils.clamp(1 - dist / 55, 0.65, 1));
      });

      const startQuiz = useCallback(async () => {
        setQuiz({ phase: 'loading' });
        try {
          const res = await generateMathQuiz(topic.apiTopic, '6-9', 3);
          setQuiz({
            phase: 'questions',
            questions: res.questions,
            idx: 0,
            chosen: new Array(res.questions.length).fill(null),
          });
        } catch {
          setQuiz({ phase: 'error' });
        }
      }, [topic.apiTopic]);

      const chooseOption = useCallback(
        (oi: number) => {
          if (quiz.phase !== 'questions' || quiz.chosen[quiz.idx] !== null) return;
          const updated = [...quiz.chosen];
          updated[quiz.idx] = oi;
          setQuiz({ ...quiz, chosen: updated });
        },
        [quiz],
      );

      const nextQuestion = useCallback(() => {
        if (quiz.phase !== 'questions') return;
        if (quiz.idx < quiz.questions.length - 1) setQuiz({ ...quiz, idx: quiz.idx + 1 });
        else setQuiz({ phase: 'idle' });
      }, [quiz]);

      const handleInteractive = useCallback(() => {
        openOverlay({
          title: topic.title,
          description: topic.fullDetail,
          platformConfig: { label: 'ГЕОМЕТР' },
        });
      }, [openOverlay, topic]);

      const setCursor = (val: string) => { document.body.style.cursor = val; };

      const accent = TOPIC_ACCENT[topic.id] ?? '#c8a040';
      const backOpacity = isSelected ? 1 : 0;
      const q = quiz.phase === 'questions' ? quiz.questions[quiz.idx] : null;
      const qChosen = quiz.phase === 'questions' ? quiz.chosen[quiz.idx] : null;
      const isLastQ = quiz.phase === 'questions' && quiz.idx === quiz.questions.length - 1;

      return (
        <group
          ref={cardRef}
          onClick={(e) => { e.stopPropagation(); onClick(index); }}
          onPointerEnter={() => { if (!isSelected && !isAnimating) setCursor('pointer'); }}
          onPointerLeave={() => setCursor('auto')}
        >
          {/* Clothespin */}
          <mesh position={[0, -0.05, 0.08]} rotation={[0, 0, Math.PI]}>
            <planeGeometry args={[0.28, 0.18]} />
            <meshBasicMaterial color="#ffffff" map={clothespinTexture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
          </mesh>

          <group ref={paperRef} position={[0, PAPER_REF_Y, 0]}>
            <mesh>
              <planeGeometry args={[CARD_W, CARD_H, 16, 16]} />
              <PaperMaterial
                ref={materialRef}
                color="#ffffff"
                map={frontTexture}
                mapBack={backTexture}
                side={THREE.DoubleSide}
                roughness={0.6}
                paintProgress={STATIC_PAINT}
                roomOrigin={STATIC_ORIGIN}
              />
            </mesh>

            {/* ── FRONT face ── */}
            <mesh position={[0, 1.13, 0.01]}>
              <planeGeometry args={[CARD_W, 0.1]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>

            <Text
              position={[0, 0.90, 0.01]}
              fontSize={0.132}
              color="#1a1a1a"
              font={FONT}
              anchorX="center"
              anchorY="middle"
              maxWidth={1.3}
              textAlign="center"
              fillOpacity={isSelected ? 0 : 1}
            >
              {topic.title}
            </Text>

            <mesh position={[0, 0.77, 0.01]}>
              <planeGeometry args={[0.88, 0.004]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>

            <mesh position={[0, 0.28, 0.01]}>
              <planeGeometry args={[1.32, 0.58]} />
              <meshBasicMaterial color="#fdf6e0" transparent opacity={isSelected ? 0 : 0.92} depthWrite={!isSelected} />
            </mesh>
            <mesh position={[0, 0.572, 0.013]}>
              <planeGeometry args={[1.32, 0.009]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>
            <mesh position={[0, -0.012, 0.013]}>
              <planeGeometry args={[1.32, 0.005]} />
              <meshBasicMaterial color="#c8a040" depthWrite={!isSelected} />
            </mesh>
            <mesh position={[-0.636, 0.28, 0.013]}>
              <planeGeometry args={[0.014, 0.58]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>
            <mesh position={[0.636, 0.28, 0.013]}>
              <planeGeometry args={[0.004, 0.58]} />
              <meshBasicMaterial color="#c8a040" depthWrite={!isSelected} />
            </mesh>
            <mesh position={[0.52, 0.022, 0.014]}>
              <planeGeometry args={[0.18, 0.007]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>
            <mesh position={[0.614, 0.07, 0.014]}>
              <planeGeometry args={[0.007, 0.1]} />
              <meshBasicMaterial color={accent} depthWrite={!isSelected} />
            </mesh>

            <Text
              position={[-0.50, 0.524, 0.015]}
              fontSize={0.048}
              color={accent}
              font={FONT}
              anchorX="left"
              anchorY="middle"
              letterSpacing={0.07}
              fillOpacity={isSelected ? 0 : 1}
            >
              ТОМЬЁО
            </Text>

            <Text
              position={[0, 0.255, 0.015]}
              fontSize={0.148}
              color="#111111"
              font={FONT}
              anchorX="center"
              anchorY="middle"
              maxWidth={1.14}
              textAlign="center"
              overflowWrap="break-word"
              lineHeight={1.3}
              fillOpacity={isSelected ? 0 : 1}
            >
              {topic.formula}
            </Text>

            <Text
              position={[0, -0.50, 0.01]}
              fontSize={0.072}
              color="#555555"
              font={FONT}
              anchorX="center"
              anchorY="middle"
              maxWidth={1.22}
              textAlign="center"
              lineHeight={1.55}
              fillOpacity={isSelected ? 0 : 1}
            >
              {topic.shortDetail}
            </Text>

            <Text
              position={[0, -1.02, 0.01]}
              fontSize={0.054}
              color="#aaaaaa"
              font={FONT}
              anchorX="center"
              anchorY="middle"
              fillOpacity={isSelected ? 0 : 1}
            >
              дарж дэлгэрэнгүй үзнэ үү
            </Text>

            {/* ── 🔥 FIX: BACK FACE ЗАССАН ХЕСЭГ ── */}
            {isSelected && (
              <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.015]} renderOrder={50}>
                
                {/* Section 1: Interactive */}
                <group position={[0, 0.98, 0]}>
                  <mesh
                    onClick={(e) => { e.stopPropagation(); handleInteractive(); }}
                    onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                    onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}
                  >
                    <planeGeometry args={[1.1, 1.1 / 3.613]} />
                    <meshBasicMaterial color="#ffffff" map={buttonTexture} transparent alphaTest={0.05} side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <Text
                    position={[0, 0, 0.01]}
                    fontSize={0.088}
                    color="#1c1c1c"
                    font={FONT}
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={backOpacity}
                    depthTest={false}
                  >
                    INTERACTIVE
                  </Text>
                </group>

                {/* Divider 1 */}
                <mesh position={[0, 0.74, 0]}>
                  <planeGeometry args={[1.3, 0.003]} />
                  <meshBasicMaterial color="#cccccc" side={THREE.DoubleSide} depthTest={false} />
                </mesh>

                {/* Section 2: Full explanation */}
                <group position={[0, -0.50, 0]}>
                  <Text
                    position={[0, 0.32, 0.01]}
                    fontSize={0.050}
                    color="#5080b8"
                    font={FONT}
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.07}
                    fillOpacity={backOpacity}
                    depthTest={false}
                  >
                    ТОМЬЁОНЫ ТАЙЛБАР
                  </Text>

                 
                  <mesh position={[0, 0.282, 0]}>
                    <planeGeometry args={[1.25, 0.006]} />
                    <meshBasicMaterial color="#5080b8" side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <mesh position={[0, -0.162, 0]}>
                    <planeGeometry args={[1.25, 0.003]} />
                    <meshBasicMaterial color="#9ab0cc" side={THREE.DoubleSide} depthTest={false} />
                  </mesh>
                  <mesh position={[-0.600, 0.06, 0]}>
                    <planeGeometry args={[0.010, 0.44]} />
                    <meshBasicMaterial color="#5080b8" side={THREE.DoubleSide} depthTest={false} />
                  </mesh>

                  <Text
                    position={[-0.54, 0.26, 0.01]}
                    fontSize={0.046}
                    color="#2a3a55"
                    font={FONT}
                    anchorX="left"
                    anchorY="top"
                    maxWidth={1.18}
                    textAlign="left"
                    lineHeight={1.24}
                    fillOpacity={backOpacity}
                    clipRect={[-0.56, -0.44, 0.56, 0.02]}
                    depthTest={false}
                  >
                    {topic.fullDetail}
                  </Text>
                </group>

                {/* Divider 2 */}
                <mesh position={[0, -0.25, 0]}>
                  <planeGeometry args={[1.3, 0.003]} />
                  <meshBasicMaterial color="#cccccc" side={THREE.DoubleSide} depthTest={false} />
                </mesh>

           {/* Section 3: AI Quiz */}
               <group position={[0, -1.15, 0]}>
                 

                  {quiz.phase === 'idle' && (
                    <group>
                      <mesh
                        position={[0, 0.18, 0]}
                        onClick={(e) => { e.stopPropagation(); startQuiz(); }}
                        onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                        onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}
                      >
                        <planeGeometry args={[0.92, 0.14]} />
                        <meshBasicMaterial color="#ddeedd" transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} />
                      </mesh>
                      <Text position={[0, 0.18, 0.01]} fontSize={0.075} color="#2a5a2a" font={FONT} anchorX="center" anchorY="middle" fillOpacity={backOpacity} depthTest={false}>
                        Ai Quiz
                        
                      </Text>
                    </group>
                  )}

                  {quiz.phase === 'loading' && (
                    <Text position={[0, 0.18, 0.01]} fontSize={0.072} color="#888888" font={FONT} anchorX="center" anchorY="middle" fillOpacity={backOpacity} depthTest={false}>
                      Ачааллаж байна...
                    </Text>
                  )}

                  {quiz.phase === 'error' && (
                    <Text position={[0, 0.18, 0.01]} fontSize={0.065} color="#aa3333" font={FONT} anchorX="center" anchorY="middle" maxWidth={1.2} textAlign="center" fillOpacity={backOpacity} depthTest={false}>
                      Алдаа гарлаа. Дахин дарна уу.
                    </Text>
                  )}

                  {quiz.phase === 'questions' && q && (
                    <group>
                      {/* Асуултыг дахиж доошлуулсан хэсэг */}
                      <Text
                        position={[0, 0.26, 0.01]}
                        fontSize={0.056}
                        color="#111111"
                        font={FONT}
                        anchorX="center"
                        anchorY="top"
                        maxWidth={1.25}
                        textAlign="center"
                        lineHeight={1.3}
                        fillOpacity={backOpacity}
                        depthTest={false}
                      >
                        {q.question}
                      </Text>

                      {/* Сонголтуудыг доошлуулав */}
                      <group position={[0, -0.04, 0]}>
                        {q.options.map((opt, oi) => {
                          const yPos = -oi * 0.105;
                          const hasAnswered = qChosen !== null;
                          const isCorrect = oi === q.correctIndex;
                          const isChosen = qChosen === oi;
                          const bgColor = !hasAnswered ? '#f0f0f0' : isCorrect ? '#cceebb' : isChosen ? '#eecccc' : '#f0f0f0';
                          return (
                            <group key={oi} position={[0, yPos, 0]}>
                              <mesh
                                onClick={(e) => { if (!hasAnswered) { e.stopPropagation(); chooseOption(oi); } }}
                                onPointerEnter={(e) => { if (!hasAnswered) { e.stopPropagation(); setCursor('pointer'); } }}
                                onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}
                              >
                                <planeGeometry args={[1.25, 0.09]} />
                                <meshBasicMaterial color={bgColor} transparent opacity={0.88} side={THREE.DoubleSide} depthTest={false} />
                              </mesh>
                              <Text
                                position={[-0.56, 0, 0.01]}
                                fontSize={0.044}
                                color="#333333"
                                font={FONT}
                                anchorX="left"
                                anchorY="middle"
                                maxWidth={1.18}
                                fillOpacity={backOpacity}
                                depthTest={false}
                              >
                                {OPTION_LABELS[oi]}. {opt}
                              </Text>
                            </group>
                          );
                        })}
                      </group>

                      {/* Дараах / Дуусгах товчлуурыг хамгийн доор нь байрлуулав */}
                      {qChosen !== null && (
                        <group position={[0, -0.48, 0]}>
                          <mesh
                            onClick={(e) => { e.stopPropagation(); nextQuestion(); }}
                            onPointerEnter={(e) => { e.stopPropagation(); setCursor('pointer'); }}
                            onPointerLeave={(e) => { e.stopPropagation(); setCursor('auto'); }}
                          >
                            <planeGeometry args={[0.65, 0.11]} />
                            <meshBasicMaterial color="#dde8f4" transparent opacity={0.88} side={THREE.DoubleSide} depthTest={false} />
                          </mesh>
                          <Text position={[0, 0, 0.01]} fontSize={0.056} color="#334466" font={FONT} anchorX="center" anchorY="middle" fillOpacity={backOpacity} depthTest={false}>
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
    },
  ),
);

GeometryCard.displayName = 'GeometryCard';
export default GeometryCard;