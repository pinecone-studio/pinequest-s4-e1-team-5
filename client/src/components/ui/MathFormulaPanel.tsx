import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import {
  getFormulasBySubject,
  detectFormulasFromImage,
  solveProblem,
  type FormulaRow,
  type DetectFormulaResponse,
  type TutorSolveResult,
} from '../../lib/api';
import '../../styles/MathFormulaPanel.scss';

type Tab = 'formulas' | 'problem' | 'image';

const TOMYO_EVENT = 'pinequest:tomyo-open';

const MathFormulaPanel = () => {
  const { currentRoom } = useScene();
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [tab, setTab] = useState<Tab>('formulas');
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [formulasLoading, setFormulasLoading] = useState(false);
  const [formulasError, setFormulasError] = useState('');
  const [formulaSearch, setFormulaSearch] = useState('');

  const [problem, setProblem] = useState('');
  const [solveLoading, setSolveLoading] = useState(false);
  const [solveResult, setSolveResult] = useState<TutorSolveResult | null>(null);
  const [solveError, setSolveError] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectResult, setDetectResult] = useState<DetectFormulaResponse | null>(null);
  const [detectError, setDetectError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(TOMYO_EVENT, handler);
    return () => window.removeEventListener(TOMYO_EVENT, handler);
  }, []);

  useEffect(() => {
    if (currentRoom !== 'math') closePanel();
  }, [currentRoom]);

  useEffect(() => {
    if (open) {
      setAnimateIn(false);
      const t = setTimeout(() => setAnimateIn(true), 30);
      loadFormulas();
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (animateIn && panelRef.current) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.3)' }
      );
    }
  }, [animateIn]);

  const loadFormulas = async () => {
    setFormulasLoading(true);
    setFormulasError('');
    try {
      const res = await getFormulasBySubject('math');
      setFormulas(res.data);
    } catch (e: unknown) {
      setFormulas([]);
      setFormulasError(e instanceof Error ? e.message : 'Серверт холбогдож чадсангүй');
    } finally {
      setFormulasLoading(false);
    }
  };

  const closePanel = useCallback(() => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0, y: 30, scale: 0.95, duration: 0.3, ease: 'power2.in',
        onComplete: () => { setOpen(false); setAnimateIn(false); }
      });
    } else {
      setOpen(false);
    }
  }, []);

  const handleSolve = async () => {
    if (!problem.trim()) return;
    setSolveLoading(true);
    setSolveResult(null);
    setSolveError('');
    try {
      const result = await solveProblem(problem.trim(), 'math', 9);
      setSolveResult(result);
    } catch (e: unknown) {
      setSolveError(e instanceof Error ? e.message : 'Алдаа гарлаа');
    } finally {
      setSolveLoading(false);
    }
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
    setDetectResult(null);
    setDetectError('');
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!imageFile) return;
    setDetectLoading(true);
    setDetectResult(null);
    setDetectError('');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const mime = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp';
        try {
          const result = await detectFormulasFromImage(base64, mime);
          setDetectResult(result);
        } catch (err: unknown) {
          setDetectError(err instanceof Error ? err.message : 'Алдаа гарлаа');
        } finally {
          setDetectLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch {
      setDetectError('Зураг уншихад алдаа гарлаа');
      setDetectLoading(false);
    }
  };

  const groupedFormulas = formulas
    .filter(f =>
      formulaSearch === '' ||
      f.topic.toLowerCase().includes(formulaSearch.toLowerCase()) ||
      f.pod_title.toLowerCase().includes(formulaSearch.toLowerCase()) ||
      f.pod_content.toLowerCase().includes(formulaSearch.toLowerCase())
    )
    .reduce<Record<string, FormulaRow[]>>((acc, f) => {
      (acc[f.topic] ??= []).push(f);
      return acc;
    }, {});

  if (!open) return null;

  return (
    <div className="mfp-backdrop" onClick={e => { if (e.target === e.currentTarget) closePanel(); }}>
      <div className="mfp-panel" ref={panelRef} role="dialog" aria-label="Томьёоны самбар">
        <div className="mfp-svg-border" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 0 0 L 4 1 L 8 0 L 14 1 L 20 0 L 28 1 L 36 0 L 44 1 L 52 0 L 60 1 L 68 0 L 76 1 L 84 0 L 92 1 L 100 0 L 99 6 L 100 14 L 98 24 L 100 34 L 99 44 L 100 54 L 98 64 L 100 74 L 99 84 L 100 94 L 100 100 L 92 99 L 84 100 L 76 98 L 68 100 L 60 99 L 52 100 L 44 98 L 36 100 L 28 99 L 20 100 L 12 98 L 4 100 L 0 100 L 1 92 L 0 82 L 2 72 L 0 62 L 1 52 L 0 42 L 2 32 L 0 22 L 1 12 L 0 0 Z"
              fill="none" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="mfp-header">
          <div>
            <span className="mfp-eyebrow">Математик</span>
            <h2 className="mfp-title">Томьёоны самбар</h2>
          </div>
          <button className="mfp-close" onClick={closePanel} aria-label="Хаах">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="mfp-tabs" role="tablist">
          {([
            { id: 'formulas', label: 'Томьёо' },
            { id: 'problem', label: 'Бодлого' },
            { id: 'image', label: 'Зураг' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`mfp-tab${tab === t.id ? ' mfp-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mfp-body">
          {tab === 'formulas' && (
            <div className="mfp-formulas">
              <input
                className="mfp-search"
                type="text"
                placeholder="Хайх… (топик, нэр)"
                value={formulaSearch}
                onChange={e => setFormulaSearch(e.target.value)}
              />
              {formulasLoading ? (
                <div className="mfp-loader">Томьёо ачааллаж байна…</div>
              ) : formulasError ? (
                <div className="mfp-error">{formulasError}</div>
              ) : Object.keys(groupedFormulas).length === 0 ? (
                <div className="mfp-empty">Томьёо олдсонгүй</div>
              ) : (
                Object.entries(groupedFormulas).map(([topic, rows]) => (
                  <div key={topic} className="mfp-topic">
                    <h3 className="mfp-topic-title">{topic}</h3>
                    {rows.map(row => (
                      <div key={row.id} className="mfp-formula-card">
                        <div className="mfp-formula-name">{row.pod_title}</div>
                        <div className="mfp-formula-content">{row.pod_content}</div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'problem' && (
            <div className="mfp-problem">
              <label className="mfp-label" htmlFor="mfp-problem-input">
                Бодлогоо оруулна уу
              </label>
              <textarea
                id="mfp-problem-input"
                className="mfp-textarea"
                placeholder="Жишээ нь: 2x + 5 = 13, x-г ол"
                value={problem}
                onChange={e => setProblem(e.target.value)}
                rows={4}
              />
              <button
                className="mfp-btn"
                onClick={handleSolve}
                disabled={solveLoading || !problem.trim()}
              >
                {solveLoading ? 'Бодож байна…' : 'Бодох'}
              </button>

              {solveError && <div className="mfp-error">{solveError}</div>}

              {solveResult && (
                <div className="mfp-solve-result">
                  <div className="mfp-solve-row">
                    <span className="mfp-solve-label">Сэдэв:</span>
                    <span>{solveResult.topic}</span>
                  </div>
                  <div className="mfp-solve-row">
                    <span className="mfp-solve-label">Ашигласан томьёо:</span>
                    <span className="mfp-solve-formula">{solveResult.formulaUsed}</span>
                  </div>
                  <div className="mfp-solve-row">
                    <span className="mfp-solve-label">Яагаад:</span>
                    <span>{solveResult.whyFormula}</span>
                  </div>
                  <div className="mfp-solve-steps">
                    <span className="mfp-solve-label">Алхамууд:</span>
                    <ol>
                      {solveResult.solutionSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="mfp-solve-answer">
                    Хариу: <strong>{solveResult.finalAnswer}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'image' && (
            <div className="mfp-image">
              <p className="mfp-label">
                Бодлогын зургаа оруулна уу — AI томьёог нь тодорхойлно
              </p>

              <div
                className="mfp-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f && f.type.startsWith('image/')) handleImageChange(f);
                }}
              >
                {imagePreview ? (
                  <img className="mfp-preview" src={imagePreview} alt="Оруулсан зураг" />
                ) : (
                  <span className="mfp-dropzone-hint">
                    Зураг чирж оруулах эсвэл дарж сонгох
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleImageChange(f);
                }}
              />

              <button
                className="mfp-btn"
                onClick={handleDetect}
                disabled={detectLoading || !imageFile}
              >
                {detectLoading ? 'Шинжилж байна…' : 'Томьёо тодорхойлох'}
              </button>

              {detectError && <div className="mfp-error">{detectError}</div>}

              {detectResult && (
                <div className="mfp-detect-result">
                  {detectResult.explanation && (
                    <div className="mfp-detect-explanation">{detectResult.explanation}</div>
                  )}
                  {detectResult.results.map((item, i) => (
                    <div key={i} className="mfp-detect-item">
                      <div className="mfp-detect-name">{item.detected.name}</div>
                      <div className="mfp-detect-formula">{item.detected.formula}</div>
                      <div className="mfp-detect-usage">{item.detected.usageInProblem}</div>
                      {item.dbMatches.length > 0 && (
                        <div className="mfp-detect-matches">
                          <span className="mfp-detect-matches-label">DB-ээс:</span>
                          {item.dbMatches.map(m => (
                            <div key={m.id} className="mfp-formula-card mfp-formula-card--sm">
                              <div className="mfp-formula-name">{m.pod_title}</div>
                              <div className="mfp-formula-content">{m.pod_content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathFormulaPanel;
