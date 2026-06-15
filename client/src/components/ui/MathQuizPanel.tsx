import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import { generateMathQuiz, type QuizResult } from '../../lib/api';
import '../../styles/MathQuizPanel.scss';

const QUIZ_EVENT = 'pinequest:quiz-open';

const TOPICS_BY_GRADE: Record<string, { label: string; apiTopic: string }[]> = {
  '6-9': [
    { label: 'Алгебр', apiTopic: 'Algebra' },
    { label: 'Геометр', apiTopic: 'Geometry' },
    { label: 'Арифметик', apiTopic: 'Arithmetic' },
    { label: 'Функц', apiTopic: 'Functions' },
    { label: 'Магадлал', apiTopic: 'Probability' },
  ],
  '10-12': [
    { label: 'Тригонометр', apiTopic: 'Trigonometry' },
    { label: 'Дифференциал', apiTopic: 'Calculus' },
    { label: 'Вектор', apiTopic: 'Vectors' },
    { label: 'Комплекс тоо', apiTopic: 'Complex Numbers' },
    { label: 'Статистик', apiTopic: 'Statistics' },
  ],
};

type Phase = 'topic' | 'loading' | 'quiz' | 'result';

const MathQuizPanel = () => {
  const { currentRoom, schoolLevel } = useScene();
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>('topic');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState('');

  const gradeRange = schoolLevel === 'high' ? '10-12' : '6-9';
  const topics = TOPICS_BY_GRADE[gradeRange];

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(QUIZ_EVENT, handler);
    return () => window.removeEventListener(QUIZ_EVENT, handler);
  }, []);

  useEffect(() => {
    if (currentRoom !== 'math') closePanel();
  }, [currentRoom]);

  useEffect(() => {
    if (open) {
      setAnimateIn(false);
      setPhase('topic');
      setQuizResult(null);
      setCurrentQ(0);
      setSelected(null);
      setAnswers([]);
      setShowExplanation(false);
      setError('');
      const t = setTimeout(() => setAnimateIn(true), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (animateIn && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.3)' }
      );
    }
  }, [animateIn]);

  const closePanel = useCallback(() => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0, y: 30, scale: 0.95, duration: 0.3, ease: 'power2.in',
        onComplete: () => { setOpen(false); setAnimateIn(false); },
      });
    } else {
      setOpen(false);
    }
  }, []);

  const handleSelectTopic = async (apiTopic: string) => {
    setPhase('loading');
    setError('');
    try {
      const result = await generateMathQuiz(apiTopic, gradeRange, 5);
      setQuizResult(result);
      setAnswers(new Array(result.questions.length).fill(null));
      setCurrentQ(0);
      setSelected(null);
      setShowExplanation(false);
      setPhase('quiz');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Алдаа гарлаа');
      setPhase('topic');
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (!quizResult) return;
    if (currentQ < quizResult.questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setPhase('result');
    }
  };

  const score = quizResult
    ? answers.filter((a, i) => a === quizResult.questions[i]?.correctIndex).length
    : 0;

  if (!open) return null;

  const currentQuestion = quizResult?.questions[currentQ];

  return (
    <div className="mqp-backdrop" onClick={e => { if (e.target === e.currentTarget) closePanel(); }}>
      <div className="mqp-panel" ref={panelRef} role="dialog" aria-label="AI Квиз">
        <div className="mqp-svg-border" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 0 0 L 4 1 L 8 0 L 14 1 L 20 0 L 28 1 L 36 0 L 44 1 L 52 0 L 60 1 L 68 0 L 76 1 L 84 0 L 92 1 L 100 0 L 99 6 L 100 14 L 98 24 L 100 34 L 99 44 L 100 54 L 98 64 L 100 74 L 99 84 L 100 94 L 100 100 L 92 99 L 84 100 L 76 98 L 68 100 L 60 99 L 52 100 L 44 98 L 36 100 L 28 99 L 20 100 L 12 98 L 4 100 L 0 100 L 1 92 L 0 82 L 2 72 L 0 62 L 1 52 L 0 42 L 2 32 L 0 22 L 1 12 L 0 0 Z"
              fill="none" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="mqp-header">
          <div>
            <span className="mqp-eyebrow">Математик · {gradeRange}-р анги</span>
            <h2 className="mqp-title">AI Квиз</h2>
          </div>
          <button className="mqp-close" onClick={closePanel} aria-label="Хаах">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mqp-body">
          {phase === 'topic' && (
            <div className="mqp-topics">
              <p className="mqp-subtitle">Сэдэв сонгоно уу</p>
              {error && <div className="mqp-error">{error}</div>}
              <div className="mqp-topic-grid">
                {topics.map(t => (
                  <button key={t.apiTopic} className="mqp-topic-btn" onClick={() => handleSelectTopic(t.apiTopic)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'loading' && (
            <div className="mqp-loading">
              <div className="mqp-spinner" />
              <p>Асуулт бэлтгэж байна…</p>
            </div>
          )}

          {phase === 'quiz' && currentQuestion && (
            <div className="mqp-quiz">
              <div className="mqp-progress">
                <span className="mqp-progress-label">{currentQ + 1} / {quizResult!.questions.length}</span>
                <div className="mqp-progress-bar">
                  <div
                    className="mqp-progress-fill"
                    style={{ width: `${((currentQ + 1) / quizResult!.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mqp-question">{currentQuestion.question}</div>

              <div className="mqp-options">
                {currentQuestion.options.map((opt, i) => {
                  let cls = 'mqp-option';
                  if (selected !== null) {
                    if (i === currentQuestion.correctIndex) cls += ' mqp-option--correct';
                    else if (i === selected) cls += ' mqp-option--wrong';
                    else cls += ' mqp-option--dimmed';
                  }
                  return (
                    <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={selected !== null}>
                      <span className="mqp-option-letter">{String.fromCharCode(65 + i)}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mqp-explanation">
                  <strong>Тайлбар:</strong> {currentQuestion.explanation}
                </div>
              )}

              {selected !== null && (
                <button className="mqp-btn" onClick={handleNext}>
                  {currentQ < quizResult!.questions.length - 1 ? 'Дараах →' : 'Дүн харах'}
                </button>
              )}
            </div>
          )}

          {phase === 'result' && quizResult && (
            <div className="mqp-result">
              <div className="mqp-score">
                <span className="mqp-score-num">{score}</span>
                <span className="mqp-score-denom"> / {quizResult.questions.length}</span>
              </div>
              <p className="mqp-score-msg">
                {score === quizResult.questions.length
                  ? 'Маш сайн! Бүгдийг зөв бодлоо!'
                  : score >= Math.ceil(quizResult.questions.length * 0.7)
                  ? 'Сайн хийлээ!'
                  : 'Дахин оролдоод үзээрэй!'}
              </p>
              <button className="mqp-btn" onClick={() => { setPhase('topic'); setQuizResult(null); }}>
                Дахин тоглох
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathQuizPanel;
