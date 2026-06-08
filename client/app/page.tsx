"use client";

import { FormEvent, useState } from "react";

type Subject = "math" | "physics" | "geometry" | "chemistry";

type TutorSolveResponse = {
  answer: {
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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Home() {
  const [problem, setProblem] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [result, setResult] = useState<TutorSolveResponse["answer"] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedProblem = problem.trim();
    if (!trimmedProblem) {
      setError("Бодлогоо бичнэ үү.");
      setResult(null);
      return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/tutor/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: trimmedProblem,
          grade: 11,
          subject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Томьёо олоход алдаа гарлаа.");
      }

      setResult((data as TutorSolveResponse).answer);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Сервертэй холбогдоход алдаа гарлаа.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col justify-center">
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-slate-500">
            Томьёо санал болгох туслах
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Бодлогоо бич. Ашиглах томьёог хар.
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {subjectOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSubject(option.value)}
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

          <button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "Шалгаж байна..." : "Томьёо харах"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <article className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap gap-2">
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
      </section>
    </main>
  );
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
