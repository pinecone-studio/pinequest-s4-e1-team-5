'use client'; 
import Experience from "@/src/experience/Experience";
"use client";

import { FormEvent, useMemo, useState } from "react";
import { SineCosineVisualizer } from "./components/SineConsineVisualizer";

type Subject = "math" | "physics" | "geometry" | "chemistry";
type Difficulty = "easy" | "medium" | "hard";
type ToolTab = "library" | "image" | "quiz" | "history";

type TutorSolveResponse = {
  cacheHit?: boolean;
  answer: TutorAnswer;
  verification: {
    ok: boolean;
    query: string;
    result: string;
    pods?: {
      title: string;
      plaintext: string;
    }[];
  };
};

type TutorAnswer = {
  problemType: string;
  subject: Subject;
  grade: number;
  topic: string;
  givenValues: string[];
  unknownValue: string;
  formulaUsed: string;
  whyFormula: string;
  solutionSteps: string[];
  finalAnswer: string;
};

type FormulaRow = {
  id?: string;
  subject?: Subject;
  topic?: string;
  pod_title?: string;
  pod_content?: string;
  wolfram_query?: string;
};

type FormulaResponse = {
  data: FormulaRow[];
};

type DetectedFormula = {
  name: string;
  formula: string;
  usageInProblem: string;
};

type DetectResponse = {
  explanation: string;
  results: {
    detected: DetectedFormula;
    dbMatches: FormulaRow[];
  }[];
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type QuizResponse = {
  gradeRange: "1-5" | "6-9" | "10-12";
  subject: Subject;
  topic: string;
  questions: QuizQuestion[];
};

type ExampleResponse = {
  example: {
    problem: string;
    solutionSteps: string[];
    finalAnswer: string;
  };
};

type PracticeResponse = {
  practice: {
    problem: string;
    answerHidden: string;
  };
};

type HistoryRow = {
  id?: string;
  subject?: Subject;
  topic?: string;
  original_problem?: string;
  formula_used?: string;
  final_answer?: string;
  created_at?: string;
};

type HistoryResponse = {
  data: HistoryRow[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Home() {
  const [problem, setProblem] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [result, setResult] = useState<TutorAnswer | null>(null);
  const [verification, setVerification] = useState<
    TutorSolveResponse["verification"] | null
  >(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<ToolTab>("library");
  const [formulaQuery, setFormulaQuery] = useState("");
  const [formulas, setFormulas] = useState<FormulaRow[]>([]);
  const [formulaStatus, setFormulaStatus] = useState("");
  const [isFormulaLoading, setIsFormulaLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [detectResult, setDetectResult] = useState<DetectResponse | null>(null);
  const [detectStatus, setDetectStatus] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState(5);
  const [gradeRange, setGradeRange] =
    useState<QuizResponse["gradeRange"]>("10-12");
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {},
  );
  const [quizStatus, setQuizStatus] = useState("");
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  const [example, setExample] = useState<ExampleResponse["example"] | null>(
    null,
  );
  const [practice, setPractice] = useState<PracticeResponse["practice"] | null>(
    null,
  );
  const [helperStatus, setHelperStatus] = useState("");
  const [isHelperLoading, setIsHelperLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyStatus, setHistoryStatus] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const currentTopic = result?.topic || formulas[0]?.topic || "";
  const visibleTopic = quizTopic || currentTopic;

  async function loadFormulasBySubject(nextSubject: Subject) {
    setIsFormulaLoading(true);
    setFormulaStatus("");

    try {
      const data = await requestJson<FormulaResponse>(
        `/api/formulas?subject=${encodeURIComponent(nextSubject)}`,
      );
      setFormulas(data.data ?? []);
      if ((data.data ?? []).length === 0) {
        setFormulaStatus(
          "Энэ хичээлийн formula DB хоосон байна. Server дээр seed/migration хийгдсэн эсэхийг шалгана.",
        );
      }
    } catch (requestError) {
      setFormulaStatus(
        getErrorMessage(requestError, "Томьёоны сан уншихад алдаа гарлаа."),
      );
      setFormulas([]);
    } finally {
      setIsFormulaLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedProblem = problem.trim();
    if (!trimmedProblem) {
      setError("Бодлогоо бичнэ үү.");
      setResult(null);
      setVerification(null);
      setCacheHit(false);
      return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);
    setVerification(null);
    setCacheHit(false);

    try {
      const tutorData = await requestJson<TutorSolveResponse>(
        "/api/tutor/solve",
        {
          method: "POST",
          body: JSON.stringify({
            problem: trimmedProblem,
            grade: 11,
            subject,
          }),
        },
      );

      setResult(tutorData.answer);
      setVerification(tutorData.verification);
      setCacheHit(Boolean(tutorData.cacheHit));
      setQuizTopic(tutorData.answer.topic);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Сервертэй холбогдоход алдаа гарлаа."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFormulaSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = formulaQuery.trim();
    if (!query) {
      await loadFormulasBySubject(subject);
      return;
    }

    setIsFormulaLoading(true);
    setFormulaStatus("");

    try {
      const data = await requestJson<FormulaResponse>(
        `/api/formulas?q=${encodeURIComponent(query)}`,
      );
      setFormulas(data.data ?? []);
      if ((data.data ?? []).length === 0) {
        setFormulaStatus("Ийм нэртэй томьёо DB дээр олдсонгүй.");
      }
    } catch (requestError) {
      setFormulaStatus(
        getErrorMessage(requestError, "Хайлт хийхэд алдаа гарлаа."),
      );
    } finally {
      setIsFormulaLoading(false);
    }
  }

  async function handleImageChange(file: File | null) {
    setDetectResult(null);
    setDetectStatus("");
    setImageBase64("");

    if (!file) {
      setImagePreview("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setDetectStatus("Зөвхөн JPG, PNG эсвэл WEBP зураг оруулна уу.");
      setImagePreview("");
      return;
    }

    setImageMimeType(file.type);
    const dataUrl = await readFileAsDataUrl(file);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl.split(",")[1] ?? "");
  }

  async function handleDetectImage() {
    if (!imageBase64) {
      setDetectStatus("Эхлээд бодлогын зураг оруулна уу.");
      return;
    }

    setIsDetecting(true);
    setDetectStatus("");
    setDetectResult(null);

    try {
      const data = await requestJson<DetectResponse>("/api/formulas/detect", {
        method: "POST",
        body: JSON.stringify({
          image: imageBase64,
          mimeType: imageMimeType,
        }),
      });
      setDetectResult(data);
      if (!data.results?.length) {
        setDetectStatus("Зургаас томьёо танигдсангүй.");
      }
    } catch (requestError) {
      setDetectStatus(
        getErrorMessage(requestError, "Зургаар томьёо танихад алдаа гарлаа."),
      );
    } finally {
      setIsDetecting(false);
    }
  }

  async function handleGenerateQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topic = visibleTopic.trim();

    if (!topic) {
      setQuizStatus("Сорил үүсгэх topic оруулна уу.");
      return;
    }

    setIsQuizLoading(true);
    setQuizStatus("");
    setQuiz(null);
    setSelectedAnswers({});

    try {
      const data = await requestJson<QuizResponse>("/api/quiz", {
        method: "POST",
        body: JSON.stringify({
          gradeRange,
          subject,
          topic,
          count: quizCount,
        }),
      });
      setQuiz(data);
    } catch (requestError) {
      setQuizStatus(
        getErrorMessage(
          requestError,
          "Сорил үүсгэхэд алдаа гарлаа. Backend quiz schema-г шалгах хэрэгтэй байж магадгүй.",
        ),
      );
    } finally {
      setIsQuizLoading(false);
    }
  }

  async function handleGenerateExample() {
    const trimmedProblem = problem.trim();
    if (!trimmedProblem) {
      setHelperStatus("Жишээ үүсгэхийн тулд эхлээд бодлого бичнэ үү.");
      return;
    }

    setIsHelperLoading(true);
    setHelperStatus("");
    setExample(null);

    try {
      const data = await requestJson<ExampleResponse>("/api/tutor/example", {
        method: "POST",
        body: JSON.stringify({
          originalProblem: trimmedProblem,
          topic: result?.topic ?? "",
          grade: 11,
          subject,
        }),
      });
      setExample(data.example);
    } catch (requestError) {
      setHelperStatus(
        getErrorMessage(requestError, "Төстэй жишээ үүсгэхэд алдаа гарлаа."),
      );
    } finally {
      setIsHelperLoading(false);
    }
  }

  async function handleGeneratePractice() {
    const topic = visibleTopic.trim();
    if (!topic) {
      setHelperStatus("Дасгал үүсгэх topic хэрэгтэй.");
      return;
    }

    setIsHelperLoading(true);
    setHelperStatus("");
    setPractice(null);

    try {
      const data = await requestJson<PracticeResponse>("/api/tutor/practice", {
        method: "POST",
        body: JSON.stringify({
          topic,
          grade: 11,
          subject,
          difficulty,
        }),
      });
      setPractice(data.practice);
    } catch (requestError) {
      setHelperStatus(
        getErrorMessage(requestError, "Дасгал үүсгэхэд алдаа гарлаа."),
      );
    } finally {
      setIsHelperLoading(false);
    }
  }

  async function loadHistory() {
    setIsHistoryLoading(true);
    setHistoryStatus("");

    try {
      const data = await requestJson<HistoryResponse>("/api/tutor/history");
      setHistory(data.data ?? []);
      if ((data.data ?? []).length === 0) {
        setHistoryStatus("Одоогоор хадгалагдсан бодлого алга.");
      }
    } catch (requestError) {
      setHistoryStatus(
        getErrorMessage(requestError, "Түүх уншихад алдаа гарлаа."),
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }

  const groupedFormulas = useMemo(() => {
    return formulas.reduce<Record<string, FormulaRow[]>>((groups, formula) => {
      const topic = formula.topic || "Ерөнхий";
      groups[topic] ??= [];
      groups[topic].push(formula);
      return groups;
    }, {});
  }, [formulas]);

  const answeredQuizCount = Object.keys(selectedAnswers).length;
  const quizScore = useMemo(() => {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce((score, question, index) => {
      return selectedAnswers[index] === question.correctIndex
        ? score + 1
        : score;
    }, 0);
  }, [quiz, selectedAnswers]);

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Experience />
    </main>
  );
}
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-10 text-slate-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-500">
                Томьёо санал болгох туслах
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Бодлогоо бич. Ашиглах томьёог хар.
              </h1>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-slate-500">Үндсэн хайлт</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Бодлогоос томьёо санал болгох
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {subjectOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSubject(option.value);
                  void loadFormulasBySubject(option.value);
                }}
                className={`h-11 rounded-full border px-3 text-sm font-medium transition ${
                  subject === option.value
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder="Жишээ: Бие 20 м/с хурдтай 5 секунд явбал ямар томьёо ашиглах вэ?"
            className="min-h-36 w-full resize-none rounded-3xl border border-slate-200 bg-white px-5 py-4 text-base leading-7 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Шалгаж байна..." : "Томьёо харах"}
            </button>
            <button
              type="button"
              onClick={handleGenerateExample}
              disabled={isHelperLoading}
              className="h-12 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Төстэй жишээ
            </button>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              className="h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="easy">Амархан</option>
              <option value="medium">Дунд</option>
              <option value="hard">Хүнд</option>
            </select>
            <button
              type="button"
              onClick={handleGeneratePractice}
              disabled={isHelperLoading}
              className="h-12 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Дасгал авах
            </button>
          </div>
        </form>

        {(error || helperStatus) && (
          <StatusMessage tone="error" message={error || helperStatus} />
        )}

        {(example || practice) && (
          <section className="mx-auto grid w-full max-w-2xl gap-4 md:grid-cols-2">
            {example && (
              <InfoCard title="Төстэй жишээ" body={example.problem}>
                <StepList steps={example.solutionSteps} />
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  Хариу: {example.finalAnswer}
                </p>
              </InfoCard>
            )}
            {practice && (
              <InfoCard title="Шинэ дасгал" body={practice.problem}>
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Нууц хариу: {practice.answerHidden}
                </p>
              </InfoCard>
            )}
          </section>
        )}

        <ToolPanel
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === "history" && history.length === 0) {
              void loadHistory();
            }
          }}
        />

        {activeTab === "library" && (
          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Томьёоны сан
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  хадгалагдсан томьёонууд
                </h2>
              </div>
              <form onSubmit={handleFormulaSearch} className="flex gap-2">
                <input
                  value={formulaQuery}
                  onChange={(event) => setFormulaQuery(event.target.value)}
                  placeholder="Томьёо хайх..."
                  className="h-11 min-w-0 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
                <button
                  type="submit"
                  className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
                >
                  Хайх
                </button>
                <button
                  type="button"
                  onClick={() => void loadFormulasBySubject(subject)}
                  className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  Сан унших
                </button>
              </form>
            </div>

            {formulaStatus && <StatusMessage message={formulaStatus} />}
            {isFormulaLoading ? (
              <p className="text-sm text-slate-500">Уншиж байна...</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(groupedFormulas).map(([topic, items]) => (
                  <article
                    key={topic}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-950">{topic}</h3>
                      <button
                        type="button"
                        onClick={() => setQuizTopic(topic)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        Сорилын topic болгох
                      </button>
                    </div>
                    <div className="space-y-3">
                      {items.slice(0, 4).map((formula, index) => (
                        <FormulaCard
                          key={formula.id ?? `${topic}-${index}`}
                          formula={formula}
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "image" && (
          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Зургаар таних
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Бодлогын зургаас хэрэгтэй томьёог олно
                </h2>

                <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-slate-400">
                  <span className="text-sm font-semibold text-slate-900">
                    Зураг сонгох
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Бодлогоо тод, бүтнээр нь оруулаарай
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) =>
                      void handleImageChange(event.target.files?.[0] ?? null)
                    }
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDetectImage}
                  disabled={isDetecting || !imageBase64}
                  className="mt-4 h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isDetecting ? "Таньж байна..." : "Зургаар томьёо таних"}
                </button>
              </div>

              <div className="space-y-4">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Оруулсан бодлогын зураг"
                    className="max-h-80 w-full rounded-3xl border border-slate-200 object-contain"
                  />
                ) : (
                  <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                    Зургийн preview энд гарна
                  </div>
                )}

                {detectStatus && <StatusMessage tone="error" message={detectStatus} />}
                {detectResult && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Дүн шинжилгээ
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {detectResult.explanation}
                    </p>
                    <div className="mt-4 space-y-3">
                      {detectResult.results.map((item, index) => (
                        <article
                          key={`${item.detected.formula}-${index}`}
                          className="rounded-2xl bg-white p-4"
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {item.detected.name}
                          </p>
                          <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 font-mono text-sm">
                            {item.detected.formula}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.detected.usageInProblem}
                          </p>
                          {item.dbMatches.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                DB дээрээс олдсон
                              </p>
                              {item.dbMatches.slice(0, 2).map((formula, matchIndex) => (
                                <FormulaCard
                                  key={formula.id ?? `${index}-${matchIndex}`}
                                  formula={formula}
                                />
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "quiz" && (
          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-medium text-slate-500">Сорил</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Томьёоны мэдлэг шалгах quiz
                  </h2>
                </div>
                {quiz && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm">
                    <p className="font-semibold text-slate-950">
                      Оноо: {quizScore}/{quiz.questions.length}
                    </p>
                    <p className="text-slate-500">
                      Хариулсан: {answeredQuizCount}/{quiz.questions.length}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleGenerateQuiz}
              className="grid gap-3 rounded-3xl bg-slate-50 p-4 md:grid-cols-[1fr_150px_130px_auto]"
            >
              <input
                value={quizTopic}
                onChange={(event) => setQuizTopic(event.target.value)}
                placeholder={currentTopic || "Topic бичих: Trigonometry"}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400"
              />
              <select
                value={gradeRange}
                onChange={(event) =>
                  setGradeRange(event.target.value as QuizResponse["gradeRange"])
                }
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm"
              >
                <option value="1-5">1-5 анги</option>
                <option value="6-9">6-9 анги</option>
                <option value="10-12">10-12 анги</option>
              </select>
              <select
                value={quizCount}
                onChange={(event) => setQuizCount(Number(event.target.value))}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm"
              >
                {[3, 5, 7, 10].map((count) => (
                  <option key={count} value={count}>
                    {count} асуулт
                  </option>
                ))}
              </select>
              <button
                disabled={isQuizLoading}
                className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                {isQuizLoading ? "Үүсгэж байна..." : "Quiz үүсгэх"}
              </button>
            </form>

            {quizStatus && <StatusMessage tone="error" message={quizStatus} />}
            {quiz && (
              <div className="mt-5 space-y-4">
                {quiz.questions.map((question, questionIndex) => (
                  <article
                    key={`${question.question}-${questionIndex}`}
                    className="rounded-3xl border border-slate-200 p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {questionIndex + 1}
                      </span>
                      <p className="pt-1 font-semibold leading-7 text-slate-950">
                        {question.question}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected =
                          selectedAnswers[questionIndex] === optionIndex;
                        const isAnswered =
                          selectedAnswers[questionIndex] !== undefined;
                        const isCorrect = question.correctIndex === optionIndex;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((current) => ({
                                ...current,
                                [questionIndex]: optionIndex,
                              }))
                            }
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              isSelected && isCorrect
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : isSelected
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : isAnswered && isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <span className="font-semibold">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>{" "}
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {selectedAnswers[questionIndex] !== undefined && (
                      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                        <p className="mb-1 font-semibold text-slate-900">
                          {selectedAnswers[questionIndex] === question.correctIndex
                            ? "Зөв байна"
                            : `Зөв хариу: ${String.fromCharCode(
                                65 + question.correctIndex,
                              )}`}
                        </p>
                        <p>{question.explanation}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Түүх</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  хадгалагдсан бодлогууд
                </h2>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                disabled={isHistoryLoading}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
              >
                Шинэчлэх
              </button>
            </div>
            {historyStatus && <StatusMessage message={historyStatus} />}
            <div className="space-y-3">
              {history.map((row, index) => (
                <article
                  key={row.id ?? index}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {subjectLabels[row.subject ?? "math"]}
                    </span>
                    {row.topic && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {row.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-950">
                    {row.original_problem}
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-700">
                    {row.formula_used}
                  </p>
                  {row.final_answer && (
                    <p className="mt-2 text-sm text-slate-600">
                      Хариу: {row.final_answer}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {subject === "math" && <SineCosineVisualizer />}

        {error && <StatusMessage tone="error" message={error} />}

        {result && (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  cacheHit
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {cacheHit ? "DB-ээс авсан" : "Шинээр үүсгэсэн"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {subjectLabels[result.subject]}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {result.topic}
              </span>
            </div>

            <p className="mb-2 text-sm font-medium text-slate-500">
              Ашиглах томьёо
            </p>
            <p className="rounded-2xl bg-slate-50 px-4 py-4 font-mono text-xl font-semibold text-slate-950">
              {result.formulaUsed}
            </p>

            <p className="mt-5 text-sm font-medium text-slate-500">
              Яагаад энэ томьёо вэ?
            </p>
            <p className="mt-2 leading-7 text-slate-700">{result.whyFormula}</p>

            {result.givenValues.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-500">
                  Өгөгдсөн утгууд
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.givenValues.map((value) => (
                    <span
                      key={value}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-5 text-sm text-slate-500">
              Олох зүйл:{" "}
              <span className="font-medium text-slate-800">
                {result.unknownValue}
              </span>
            </p>
          </article>
        )}

        {verification && (
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Wolfram</p>
                <p className="mt-1 break-all font-mono text-sm text-slate-700">
                  {verification.query || "none"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  verification.ok
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {verification.ok ? "Wolfram OK" : "Wolfram байхгүй"}
              </span>
            </div>

            {verification.pods && verification.pods.length > 0 ? (
              <div className="space-y-3">
                {verification.pods.slice(0, 4).map((pod) => (
                  <section
                    key={`${pod.title}-${pod.plaintext}`}
                    className="rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <p className="mb-1 text-sm font-semibold text-slate-900">
                      {pod.title}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {pod.plaintext}
                    </p>
                  </section>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {verification.result}
              </p>
            )}
          </article>
        )}
      </section>
    </main>
  );
}

function ToolPanel({
  activeTab,
  setActiveTab,
}: {
  activeTab: ToolTab;
  setActiveTab: (tab: ToolTab) => void;
}) {
  return (
    <nav className="grid gap-3 rounded-4xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {toolTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => setActiveTab(tab.value)}
          className={`rounded-3xl border p-4 text-left transition ${
            activeTab === tab.value
              ? "border-slate-950 bg-slate-950 text-white"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
          }`}
        >
          <span
            className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              activeTab === tab.value
                ? "bg-white text-slate-950"
                : "bg-white text-slate-500"
            }`}
          >
            {tab.step}
          </span>
          <span className="block text-sm font-semibold">{tab.label}</span>
          <span
            className={`mt-1 block text-xs leading-5 ${
              activeTab === tab.value ? "text-slate-200" : "text-slate-500"
            }`}
          >
            {tab.description}
          </span>
        </button>
      ))}
    </nav>
  );
}

function GuideStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
        {number}
      </div>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
    </div>
  );
}

function FormulaCard({ formula }: { formula: FormulaRow }) {
  return (
    <section className="rounded-2xl bg-white px-4 py-3">
      <p className="text-sm font-semibold text-slate-950">
        {formula.pod_title ?? "Томьёо"}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {formula.pod_content ?? "Агуулга хоосон байна."}
      </p>
      {formula.wolfram_query && (
        <p className="mt-2 break-all font-mono text-xs text-slate-400">
          {formula.wolfram_query}
        </p>
      )}
    </section>
  );
}

function InfoCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-800">{body}</p>
      {children}
    </article>
  );
}

function StepList({ steps }: { steps: string[] }) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ol className="mt-4 space-y-2">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-2 text-sm leading-6 text-slate-700">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function StatusMessage({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={`mx-auto w-full max-w-5xl rounded-2xl border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {message}
    </div>
  );
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : "API request failed";
    throw new Error(message);
  }

  return data as T;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Зураг уншихад алдаа гарлаа."));
    reader.readAsDataURL(file);
  });
}

const subjectOptions: { value: Subject; label: string }[] = [
  { value: "math", label: "Математик" },
  { value: "physics", label: "Физик" },
  { value: "geometry", label: "Геометр" },
  { value: "chemistry", label: "Хими" },
];

const subjectLabels: Record<Subject, string> = {
  math: "Математик",
  physics: "Физик",
  geometry: "Геометр",
  chemistry: "Хими",
};

const toolTabs: {
  value: ToolTab;
  label: string;
  description: string;
  step: string;
}[] = [
  {
    value: "library",
    label: "Томьёоны сан",
    description: "хадгалагдсан томьёо хайж, topic сонгоно.",
    step: "01",
  },
  {
    value: "image",
    label: "Зургаар таних",
    description: "Бодлогын зургаас хэрэгтэй томьёог танина.",
    step: "02",
  },
  {
    value: "quiz",
    label: "Сорил",
    description: "Сонгосон topic-оор тест үүсгэж өөрийгөө шалгана.",
    step: "03",
  },
  {
    value: "history",
    label: "Түүх",
    description: "Өмнө хадгалсан бодлого, томьёо, хариуг харна.",
    step: "04",
  },
];
