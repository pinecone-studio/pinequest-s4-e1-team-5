import { sql } from "../db";
import { openai } from "../openai";
import { verifyWithWolfram } from "./wolfram.service";

type Subject = "math" | "physics";

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

const SOLVE_SYSTEM_PROMPT = `
You are a math and physics AI tutor for school students.
Always answer in Mongolian.
Return short JSON only.
Extract: problem type, subject, grade, topic, given values, unknown value, formula, why the formula is used, steps, final answer.
Create a short wolframQuery for numerical verification. If not needed, use "none".
Keep the explanation simple and concise.
`;

const solveAnswerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    problemType: { type: "string" },
    subject: { type: "string", enum: ["math", "physics"] },
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

export async function solveTutorService(input: SolveTutorInput) {
  const { answer, usage } = await generateTutorSolveAnswer(input);

  let wolfram = {
    ok: false,
    query: answer.wolframQuery,
    result: "Wolfram not needed",
  };

  if (answer.wolframQuery && answer.wolframQuery !== "none") {
    wolfram = await verifyWithWolfram(answer.wolframQuery);
  }

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
      is_verified,
      openai_usage
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
      ${wolfram.ok},
      ${JSON.stringify(usage)}::jsonb
    )
    returning id
  `;

  return {
    solvedProblemId: rows[0].id,
    answer,
    verification: wolfram,
  };
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
          "You are a math and physics AI tutor. Always answer in Mongolian. Return short JSON only.",
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
          "You are a math and physics AI tutor. Always answer in Mongolian. Return short JSON only.",
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

function parseOutput<T>(text: string): T {
  if (!text) {
    throw new Error("OpenAI returned empty response");
  }

  return JSON.parse(text) as T;
}
