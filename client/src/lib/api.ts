export type TutorSubject = "math" | "physics" | "geometry" | "chemistry";

export type TutorSolveAnswer = {
  problemType: string;
  subject: TutorSubject;
  grade: number;
  topic: string;
  givenValues: string[];
  unknownValue: string;
  formulaUsed: string;
  whyFormula: string;
  solutionSteps: string[];
  finalAnswer: string;
  wolframQuery: string;
};

export type TutorSolveResponse = {
  solvedProblemId?: string | number;
  cacheHit: boolean;
  answer: TutorSolveAnswer;
  verification?: {
    ok: boolean;
    query: string;
    result: string;
  };
};

export type TutorSolveInput = {
  problem: string;
  grade: number;
  subject: TutorSubject;
};

export type StudioSearchItem = {
  id: string;
  platform: "youtube" | "blog" | "tiktok";
  title: string;
  description: string;
  image: string;
  paintedImage: string;
};

export type StudioTitleItem = Pick<
  StudioSearchItem,
  "id" | "platform" | "title"
>;

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function apiEndpoint(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json().catch(() => null)) as
      | { error?: unknown; message?: unknown; stage?: unknown }
      | null;
    const message =
      typeof body?.error === "string"
        ? body.error
        : typeof body?.message === "string"
          ? body.message
          : null;
    const stage = typeof body?.stage === "string" ? body.stage : null;

    if (message && stage) {
      return `${message} (${stage})`;
    }

    if (message) {
      return message;
    }
  }

  const errorText = await response.text().catch(() => "");
  return errorText || `API request failed with ${response.status}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiEndpoint(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export function solveTutorProblem(input: TutorSolveInput) {
  return apiFetch<TutorSolveResponse>("/api/tutor/solve", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function searchStudioContent(query: string) {
  return apiFetch<{ data: StudioSearchItem[] }>(
    `/api/studio/search?q=${encodeURIComponent(query)}`
  );
}

export function getStudioTitles() {
  return apiFetch<{ data: StudioTitleItem[] }>("/api/studio/titles");
}

export type FormulaRow = {
  id: string;
  subject: string;
  topic: string;
  pod_title: string;
  pod_content: string;
  wolfram_query: string;
  is_seeded: boolean;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

export type QuizResult = {
  gradeRange: string;
  subject: string;
  topic: string;
  questions: QuizQuestion[];
};

export function getMathFormulas() {
  return apiFetch<{ data: FormulaRow[] }>("/api/formulas?subject=math");
}

export function generateMathQuiz(topic: string, gradeRange = "6-9", count = 3) {
  return apiFetch<QuizResult>("/api/quiz", {
    method: "POST",
    body: JSON.stringify({ gradeRange, subject: "math", topic, count }),
  });
}
