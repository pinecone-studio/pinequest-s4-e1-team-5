import { sql } from "../db";
import { openai } from "../openai";
import { fetchWolframPods, type WolframPod } from "./wolfram.service";

type Subject = "math" | "physics" | "geometry" | "chemistry";

type SolveTutorInput = {
  problem: string;
  grade: number;
  subject: Subject;
};

type ExampleInput = {
  originalProblem: string;
  topic: string;
  grade: number;
  subject: Subject;
};

type PracticeInput = {
  topic: string;
  grade: number;
  subject: Subject;
  difficulty: string;
};

type TutorSolveAnswer = {
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
  wolframQuery: string;
};

type SimilarExample = {
  problem: string;
  solutionSteps: string[];
  finalAnswer: string;
};

type PracticeProblem = {
  problem: string;
  answerHidden: string;
};

type WolframVerification = {
  ok: boolean;
  query: string;
  result: string;
  pods: WolframPod[];
};

type WolframMongolianResult = {
  summary: string;
  pods: WolframPod[];
};

let solvedProblemsSchemaPromise: Promise<void> | null = null;

const SOLVE_SYSTEM_PROMPT = `
You are a math, physics, geometry, and chemistry AI tutor for school students.
Always answer in Mongolian.
Return short JSON only.
Extract: problem type, subject, grade, topic, given values, unknown value, formula, why the formula is used, steps, final answer.
Create a short wolframQuery for numerical verification. If not needed, use "none".
Keep the explanation simple and concise.
The subject field must exactly match the subject selected by the user.
All human-readable fields must be Mongolian. Keep formulas and chemical symbols unchanged.
`;

const solveAnswerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    problemType: { type: "string" },
    subject: {
      type: "string",
      enum: ["math", "physics", "geometry", "chemistry"],
    },
    grade: { type: "number" },
    topic: { type: "string" },
    givenValues: {
      type: "array",
      items: { type: "string" },
    },
    unknownValue: { type: "string" },
    formulaUsed: { type: "string" },
    whyFormula: { type: "string" },
    solutionSteps: {
      type: "array",
      items: { type: "string" },
    },
    finalAnswer: { type: "string" },
    wolframQuery: { type: "string" },
  },
  required: [
    "problemType",
    "subject",
    "grade",
    "topic",
    "givenValues",
    "unknownValue",
    "formulaUsed",
    "whyFormula",
    "solutionSteps",
    "finalAnswer",
    "wolframQuery",
  ],
};

const exampleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    problem: { type: "string" },
    solutionSteps: {
      type: "array",
      items: { type: "string" },
    },
    finalAnswer: { type: "string" },
  },
  required: ["problem", "solutionSteps", "finalAnswer"],
};

const practiceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    problem: { type: "string" },
    answerHidden: { type: "string" },
  },
  required: ["problem", "answerHidden"],
};

const wolframMongolianSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    pods: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          plaintext: { type: "string" },
        },
        required: ["title", "plaintext"],
      },
    },
  },
  required: ["summary", "pods"],
};

export async function solveTutorService(input: SolveTutorInput) {
  await ensureSolvedProblemsSchema();

  const cached = await getCachedSolvedProblem(input);

  if (cached) {
    return {
      ...cached,
      cacheHit: true,
    };
  }

  const { answer: generatedAnswer, usage } = await generateTutorSolveAnswer(
    input,
  );
  const answer = await normalizeTutorAnswer(generatedAnswer, input);

  const wolfram = await getWolframVerification(answer.wolframQuery);

  const rows = await sql`
    insert into solved_problems (
      grade,
      subject,
      topic,
      original_problem,
      problem_type,
      given_values,
      unknown_value,
      formula_used,
      why_formula,
      solution_steps,
      final_answer,
      wolfram_query,
      wolfram_result,
      wolfram_pods,
      is_verified
    )
    values (
      ${answer.grade},
      ${answer.subject},
      ${answer.topic},
      ${input.problem},
      ${answer.problemType},
      ${JSON.stringify(answer.givenValues)}::jsonb,
      ${answer.unknownValue},
      ${answer.formulaUsed},
      ${answer.whyFormula},
      ${JSON.stringify(answer.solutionSteps)}::jsonb,
      ${answer.finalAnswer},
      ${answer.wolframQuery},
      ${wolfram.result},
      ${JSON.stringify(wolfram.pods)}::jsonb,
      ${wolfram.ok}
    )
    returning id
  `;

  return {
    solvedProblemId: rows[0].id,
    cacheHit: false,
    answer,
    verification: wolfram,
  };
}

async function ensureSolvedProblemsSchema() {
  solvedProblemsSchemaPromise ??= (async () => {
    await sql`
      create table if not exists solved_problems (
        id               uuid primary key default gen_random_uuid(),
        grade            integer not null,
        subject          text    not null,
        topic            text    not null,
        original_problem text    not null,
        problem_type     text    not null,
        given_values     jsonb   not null default '[]'::jsonb,
        unknown_value    text    not null,
        formula_used     text    not null,
        why_formula      text    not null,
        solution_steps   jsonb   not null default '[]'::jsonb,
        final_answer     text    not null,
        wolfram_query    text    not null,
        wolfram_result   text    not null,
        wolfram_pods     jsonb   not null default '[]'::jsonb,
        is_verified      boolean not null default false,
        created_at       timestamptz not null default now()
      )
    `;

    await sql`
      alter table solved_problems
      add column if not exists wolfram_pods jsonb not null default '[]'::jsonb
    `;

    await sql`
      create index if not exists solved_problems_created_at_idx
      on solved_problems (created_at desc)
    `;

    await sql`
      create index if not exists solved_problems_subject_idx
      on solved_problems (subject)
    `;

    await sql`
      create index if not exists solved_problems_topic_idx
      on solved_problems (topic)
    `;

    await sql`
      create index if not exists solved_problems_problem_cache_idx
      on solved_problems (subject, lower(btrim(original_problem)))
    `;
  })();

  return solvedProblemsSchemaPromise;
}

async function getCachedSolvedProblem(input: SolveTutorInput) {
  const rows = await sql`
    select *
    from solved_problems
    where subject = ${input.subject}
      and lower(btrim(original_problem)) = lower(btrim(${input.problem}))
    order by created_at desc
    limit 1
  `;

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    solvedProblemId: row.id,
    answer: {
      problemType: row.problem_type,
      subject: row.subject as Subject,
      grade: row.grade,
      topic: row.topic,
      givenValues: parseJsonField<string[]>(row.given_values, []),
      unknownValue: row.unknown_value,
      formulaUsed: row.formula_used,
      whyFormula: row.why_formula,
      solutionSteps: parseJsonField<string[]>(row.solution_steps, []),
      finalAnswer: row.final_answer,
      wolframQuery: row.wolfram_query,
    },
    verification: {
      ok: Boolean(row.is_verified),
      query: row.wolfram_query,
      result: row.wolfram_result,
      pods: parseJsonField<WolframPod[]>(row.wolfram_pods, []),
    },
  };
}

async function getWolframVerification(
  wolframQuery: string,
): Promise<WolframVerification> {
  if (!wolframQuery || wolframQuery === "none") {
    return {
      ok: false,
      query: wolframQuery,
      result: "Wolfram not needed",
      pods: [],
    };
  }

  const wolfram = await fetchWolframPods(wolframQuery);

  if (!wolfram.ok) {
    return {
      ok: false,
      query: wolfram.query,
      result: wolfram.error ?? "Wolfram returned no result",
      pods: [],
    };
  }

  const translated = await translateWolframResultToMongolian(wolfram.pods);

  return {
    ok: true,
    query: wolfram.query,
    result: translated.summary,
    pods: translated.pods,
  };
}

async function translateWolframResultToMongolian(
  pods: WolframPod[],
): Promise<WolframMongolianResult> {
  if (pods.length === 0) {
    return {
      summary: "Wolfram уншигдах үр дүн буцаасангүй.",
      pods: [],
    };
  }

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 500,
    input: [
      {
        role: "system",
        content:
          "You translate WolframAlpha math, physics, geometry, and chemistry results into concise Mongolian. Preserve formulas, symbols, units, and chemical notation exactly. Return JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({ pods: pods.slice(0, 6) }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "wolfram_mongolian_result",
        strict: true,
        schema: wolframMongolianSchema,
      },
    },
  });

  console.log("OpenAI usage:", response.usage);

  return parseOutput<WolframMongolianResult>(response.output_text);
}

export async function getTutorHistoryService() {
  const rows = await sql`
    select *
    from solved_problems
    order by created_at desc
    limit 20
  `;

  return rows;
}

export async function generateExampleService(input: ExampleInput) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 500,
    input: [
      {
        role: "system",
        content:
          "You are a math, physics, geometry, and chemistry AI tutor. Always answer in Mongolian. Return short JSON only.",
      },
      {
        role: "user",
        content: `Generate one similar example.
Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}
Original problem: ${input.originalProblem}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "similar_example",
        strict: true,
        schema: exampleSchema,
      },
    },
  });

  console.log("OpenAI usage:", response.usage);

  return {
    example: parseOutput<SimilarExample>(response.output_text),
    usage: response.usage,
  };
}

export async function generatePracticeService(input: PracticeInput) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 350,
    input: [
      {
        role: "system",
        content:
          "You are a math, physics, geometry, and chemistry AI tutor. Always answer in Mongolian. Return short JSON only.",
      },
      {
        role: "user",
        content: `Generate one practice problem.
Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}
Difficulty: ${input.difficulty}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "practice_problem",
        strict: true,
        schema: practiceSchema,
      },
    },
  });

  console.log("OpenAI usage:", response.usage);

  return {
    practice: parseOutput<PracticeProblem>(response.output_text),
    usage: response.usage,
  };
}

async function generateTutorSolveAnswer(input: SolveTutorInput) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 700,
    input: [
      {
        role: "system",
        content: SOLVE_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Grade: ${input.grade}
Subject: ${input.subject}
Return subject exactly as: ${input.subject}
Problem: ${input.problem}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "tutor_solve_answer",
        strict: true,
        schema: solveAnswerSchema,
      },
    },
  });

  console.log("OpenAI usage:", response.usage);

  return {
    answer: parseOutput<TutorSolveAnswer>(response.output_text),
    usage: response.usage,
  };
}

async function normalizeTutorAnswer(
  answer: TutorSolveAnswer,
  input: SolveTutorInput,
): Promise<TutorSolveAnswer> {
  const visibleText = [
    answer.problemType,
    answer.topic,
    answer.unknownValue,
    answer.formulaUsed,
    answer.whyFormula,
    ...answer.givenValues,
    ...answer.solutionSteps,
    answer.finalAnswer,
  ].join(" ");

  if (!containsMostlyEnglish(visibleText) && answer.subject === input.subject) {
    return answer;
  }

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 700,
    input: [
      {
        role: "system",
        content:
          "Convert this tutor JSON to Mongolian. Preserve formulas, numbers, units, and chemical symbols. The subject must exactly match the provided subject. Return the same JSON schema only.",
      },
      {
        role: "user",
        content: `Subject: ${input.subject}
JSON: ${JSON.stringify(answer)}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "tutor_solve_answer_mn",
        strict: true,
        schema: solveAnswerSchema,
      },
    },
  });

  console.log("OpenAI usage:", response.usage);

  return parseOutput<TutorSolveAnswer>(response.output_text);
}

function containsMostlyEnglish(text: string) {
  const latin = (text.match(/[a-z]/gi) ?? []).length;
  const cyrillic = (text.match(/[а-яөүё]/gi) ?? []).length;

  return latin > 25 && latin > cyrillic;
}

function parseOutput<T>(text: string): T {
  if (!text) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(text) as T;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}
