import { sql } from "../db";
import { openai } from "../openai";
import { fetchWolframPods } from "./wolfram.service";

export type Subject = "math" | "physics" | "geometry" | "chemistry";

const WOLFRAM_QUERIES: Record<Subject, { topic: string; query: string }[]> = {
  math: [
    { topic: "Arithmetic", query: "sum of integers 1 to n" },
    { topic: "Algebra", query: "quadratic formula" },
    { topic: "Trigonometry", query: "sin^2(x) + cos^2(x)" },
    { topic: "Logarithm", query: "log(a*b) = log a + log b" },
    { topic: "Sequences and Series", query: "sum of geometric series" },
    { topic: "Probability", query: "binomial probability formula" },
    { topic: "Statistics", query: "standard deviation formula" },
    { topic: "Calculus", query: "derivative of x^n" },
  ],
  physics: [
    { topic: "Kinematics", query: "v = u + at" },
    { topic: "Dynamics", query: "F = ma" },
    { topic: "Energy and Work", query: "kinetic energy (1/2)mv^2" },
    { topic: "Thermodynamics", query: "PV = nRT" },
    { topic: "Electricity", query: "V = IR Ohm law" },
    { topic: "Magnetism", query: "magnetic force on moving charge" },
    { topic: "Waves and Optics", query: "v = f*lambda" },
    { topic: "Gravitation", query: "F = Gm1m2/r^2" },
  ],
  geometry: [
    { topic: "Triangles", query: "area of triangle (1/2)*base*height" },
    { topic: "Circles", query: "area of circle pi*r^2" },
    {
      topic: "Rectangles and Polygons",
      query: "area of rectangle length*width",
    },
    { topic: "Volume of Solids", query: "volume of sphere (4/3)*pi*r^3" },
    { topic: "Surface Area", query: "surface area of cylinder" },
    {
      topic: "Coordinate Geometry",
      query: "distance formula sqrt((x2-x1)^2+(y2-y1)^2)",
    },
    { topic: "Vectors", query: "dot product of vectors" },
  ],
  chemistry: [
    { topic: "Moles and Molar Mass", query: "moles = mass / molar mass" },
    { topic: "Gas Laws", query: "PV = nRT ideal gas" },
    { topic: "Concentration", query: "molarity = moles / liters" },
    { topic: "Reaction Rates", query: "rate = k[A]^m[B]^n" },
    { topic: "Thermochemistry", query: "delta H Hess law" },
    { topic: "Electrochemistry", query: "Faraday law Q = nF" },
    { topic: "Acids and Bases", query: "pH = -log[H+]" },
  ],
};

export async function seedFormulasForTopic(
  subject: Subject,
  topic: string,
): Promise<{ saved: number; skipped: number; error?: string }> {
  const entry = WOLFRAM_QUERIES[subject]?.find((e) => e.topic === topic);

  if (!entry) {
    return {
      saved: 0,
      skipped: 0,
      error: `Topic not found: ${subject}/${topic}`,
    };
  }

  console.log(`[formula] Seeding ${subject}/${topic} via Wolfram...`);

  const wolframResult = await fetchWolframPods(entry.query);

  if (!wolframResult.ok || wolframResult.pods.length === 0) {
    return {
      saved: 0,
      skipped: 0,
      error: wolframResult.error ?? "No pods returned",
    };
  }

  let saved = 0;
  let skipped = 0;

  for (const pod of wolframResult.pods) {
    if (!pod.title || pod.plaintext.trim().length < 3) {
      skipped++;
      continue;
    }

    try {
      await sql`
        insert into formulas (
          subject,
          topic,
          wolfram_query,
          pod_title,
          pod_content,
          is_seeded
        )
        values (
          ${subject},
          ${topic},
          ${entry.query},
          ${pod.title},
          ${pod.plaintext},
          true
        )
        on conflict (subject, topic, pod_title) do update set
          pod_content  = excluded.pod_content,
          wolfram_query = excluded.wolfram_query
      `;
      saved++;
    } catch (err) {
      console.error(`[formula] DB insert error for pod "${pod.title}":`, err);
      skipped++;
    }
  }

  console.log(
    `[formula] ${subject}/${topic}: ${saved} saved, ${skipped} skipped`,
  );
  return { saved, skipped };
}

export async function seedAllFormulas(): Promise<void> {
  const subjects = Object.keys(WOLFRAM_QUERIES) as Subject[];

  for (const subject of subjects) {
    for (const { topic } of WOLFRAM_QUERIES[subject]) {
      await seedFormulasForTopic(subject, topic);

      await new Promise((r) => setTimeout(r, 800));
    }
  }

  console.log("[formula] All subjects seeded.");
}

export async function getFormulasBySubject(subject: Subject) {
  const rows = await sql`
    select *
    from formulas
    where subject = ${subject}
    order by topic, pod_title
  `;
  return rows;
}

export async function getFormulasBySubjectAndTopic(
  subject: Subject,
  topic: string,
) {
  const rows = await sql`
    select *
    from formulas
    where subject = ${subject}
      and topic   = ${topic}
    order by pod_title
  `;
  return rows;
}

export async function searchFormulas(query: string) {
  const like = `%${query}%`;
  const rows = await sql`
    select *
    from formulas
    where pod_title   ilike ${like}
       or pod_content ilike ${like}
       or topic       ilike ${like}
    order by subject, topic, pod_title
    limit 50
  `;
  return rows;
}

export async function getFormulaTopics() {
  const rows = await sql`
    select subject, topic, count(*) as pod_count
    from formulas
    group by subject, topic
    order by subject, topic
  `;
  return rows;
}

type FormulaInput = {
  subject: Subject;
  topic: string;
  pod_title: string;
  pod_content: string;
  wolfram_query?: string;
};

export async function createFormula(input: FormulaInput) {
  const rows = await sql`
    insert into formulas (subject, topic, wolfram_query, pod_title, pod_content, is_seeded)
    values (
      ${input.subject},
      ${input.topic},
      ${input.wolfram_query ?? "manual"},
      ${input.pod_title},
      ${input.pod_content},
      false
    )
    on conflict (subject, topic, pod_title) do update set
      pod_content   = excluded.pod_content,
      wolfram_query = excluded.wolfram_query
    returning *
  `;
  return rows[0];
}

export async function createManyFormulas(
  inputs: FormulaInput[],
): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;

  for (const input of inputs) {
    try {
      if (
        !input.subject ||
        !input.topic ||
        !input.pod_title ||
        !input.pod_content
      ) {
        skipped++;
        continue;
      }
      await createFormula(input);
      saved++;
    } catch (err) {
      console.error("[formula] bulk insert error:", err);
      skipped++;
    }
  }

  return { saved, skipped };
}

export async function updateFormula(
  id: string,
  fields: Partial<
    Pick<FormulaInput, "topic" | "pod_title" | "pod_content" | "wolfram_query">
  >,
) {
  const rows = await sql`
    update formulas
    set
      topic         = coalesce(${fields.topic ?? null}, topic),
      pod_title     = coalesce(${fields.pod_title ?? null}, pod_title),
      pod_content   = coalesce(${fields.pod_content ?? null}, pod_content),
      wolfram_query = coalesce(${fields.wolfram_query ?? null}, wolfram_query)
    where id = ${id}::uuid
    returning *
  `;
  return rows[0];
}

export async function deleteFormula(id: string) {
  await sql`
    delete from formulas
    where id = ${id}::uuid
  `;
}

const DETECT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    formulas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          formula: { type: "string" },
          usageInProblem: { type: "string" },
        },
        required: ["name", "formula", "usageInProblem"],
      },
    },
    explanation: { type: "string" },
  },
  required: ["formulas", "explanation"],
};

type DetectedFormula = {
  name: string;
  formula: string;
  usageInProblem: string;
};

type DetectedFormulaWithDB = {
  detected: DetectedFormula;
  dbMatches: any[];
};

type DetectAndFetchResult = {
  explanation: string;
  results: DetectedFormulaWithDB[];
};

export async function detectAndFetchFormulas(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<DetectAndFetchResult> {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 800,
    input: [
      {
        role: "system",
        content: `You are a school math and physics tutor.
The student will upload an image of a problem.
Identify exactly which formulas are needed to solve it.
Always respond in Mongolian.
Return JSON only.`,
      },
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`,
            detail: "auto",
          },
          {
            type: "input_text",
            text: `Энэ бодлогыг бодоход ямар томьёо(нууд) хэрэгтэй вэ?
Томьёо бүрт:
- name: томьёоны нэр (Монголоор)
- formula: томьёоны тэмдэглэгээ (LaTeX)
- usageInProblem: энэ бодлогод яагаад ашиглагддагийг товч тайлбарла (Монголоор)
Мөн explanation-д бодлогын товч дүн шинжилгээ бич.`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "formula_detect",
        strict: true,
        schema: DETECT_SCHEMA,
      },
    },
  });

  console.log("[formula] OpenAI vision usage:", response.usage);

  const identified = JSON.parse(response.output_text) as {
    formulas: DetectedFormula[];
    explanation: string;
  };

  const results: DetectedFormulaWithDB[] = [];

  for (const f of identified.formulas) {
    const rows = await sql`
      select *
      from formulas
      where pod_title   ilike ${"%" + f.name + "%"}
         or pod_content ilike ${"%" + f.formula + "%"}
      order by subject, topic
      limit 5
    `;

    results.push({ detected: f, dbMatches: rows });
  }

  return { explanation: identified.explanation, results };
}

type GradeRange = "1-5" | "6-9" | "10-12";

type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

type QuizResult = {
  gradeRange: GradeRange;
  subject: string;
  topic: string;
  questions: QuizQuestion[];
};

const QUIZ_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4,
          },
          correctIndex: { type: "number" },
          explanation: { type: "string" },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  required: ["questions"],
};

const GRADE_PROMPTS: Record<GradeRange, string> = {
  "1-5":
    "The student is in grade 1-5 (age 6-11). Use very simple language and basic formulas only.",
  "6-9":
    "The student is in grade 6-9 (age 12-15). Use intermediate level formulas and concepts.",
  "10-12":
    "The student is in grade 10-12 (age 16-18). Use advanced formulas and deeper concepts.",
};

export async function generateQuizService(
  gradeRange: GradeRange,
  subject: Subject,
  topic: string,
  count: number = 5,
): Promise<QuizResult> {
  const formulas = await getFormulasBySubjectAndTopic(subject, topic);

  const formulasContext =
    formulas.length > 0
      ? formulas.map((f) => `-${f.pod_title}:${f.pod_content}`).join("\n")
      : `General ${subject} formulas for ${topic}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 1500,
    input: [
      {
        role: "system",
        content: `You are a school math and science quiz generator.
${GRADE_PROMPTS[gradeRange]}
Always respond in Mongolian.
Generate quiz questions ONLY about formulas — not calculations.
Question types (mix them):
  - "Энэ томьёог хэн нээсэн бэ / ямар хуулиас гардаг вэ?"
  - "Энэ бодлогыг бодоход ямар томьёо ашиглах вэ?"
  - "Энэ томьёон дахь тэмдэглэгээ юуг илэрхийлэх вэ?"
Each question must have exactly 4 options (a, b, c, d).
correctIndex is 0-based (0=a, 1=b, 2=c, 3=d).
Vary the correct answer position. Do not always put the correct option first.
explanation must be 1-2 sentences in Mongolian.
Return JSON only.`,
      },
      {
        role: "user",
        content: `subject:${subject}
                  topic:${topic}
                  Grade range: ${gradeRange}
                  Available formulas:${formulasContext}
        
                  Generate ${count} quiz questions based on these formulas.`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "quiz_result",
        strict: true,
        schema: QUIZ_SCHEMA,
      },
    },
  });

  console.log("[quiz] OpenAI usage:", response.usage);

  const parsed = JSON.parse(response.output_text) as {
    questions: QuizQuestion[];
  };

  return {
    gradeRange,
    subject,
    topic,
    questions: parsed.questions.map(shuffleQuizQuestion),
  };
}

function shuffleQuizQuestion(question: QuizQuestion): QuizQuestion {
  const normalizedOptions = question.options.slice(0, 4);
  const safeCorrectIndex =
    question.correctIndex >= 0 &&
    question.correctIndex < normalizedOptions.length
      ? question.correctIndex
      : 0;
  const shuffled = normalizedOptions
    .map((option, index) => ({
      option,
      isCorrect: index === safeCorrectIndex,
      sort: Math.random(),
    }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ option, isCorrect }) => ({ option, isCorrect }));
  const nextCorrectIndex = shuffled.findIndex((entry) => entry.isCorrect);

  return {
    ...question,
    options: shuffled.map((entry) => entry.option) as [
      string,
      string,
      string,
      string,
    ],
    correctIndex: nextCorrectIndex >= 0 ? nextCorrectIndex : 0,
  };
}
