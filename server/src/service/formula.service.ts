import { sql } from "../db";
import { openai } from "../openai";
import { fetchWolframPods } from "./wolfram.service";

export type Subject = "math" | "physics" | "geometry" | "chemistry";

type FormulaIdentifyResult = {
  formulas: IdentifiedFormula[];
  explanation: string;
};

type IdentifiedFormula = {
  name: string;
  formula: string;
  usageInProblem: string;
};

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
    // Хоосон эсвэл хэт богино pod-ыг орхино
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
      // Rate limit-аас зайлсхийхийн тулд жаахан хүлээнэ
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

const IDENTIFY_SCHEMA = {
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

export async function identifyFormulasFromImage(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<FormulaIdentifyResult> {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 800,
    input: [
      {
        role: "system",
        content: `You are a school math and physics tutor.
The student will upload an image of a problem.
Your job is to identify exactly which formulas are needed to solve it.
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
- formula: томьёоны тэмдэглэгээ 
- usageInProblem: энэ бодлогод яагаад ашиглагддагийг товч тайлбарла (Монголоор)
Мөн explanation-д бодлогын товч дүн шинжилгээ бич.`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "formula_identify",
        strict: true,
        schema: IDENTIFY_SCHEMA,
      },
    },
  });

  console.log("[formula] OpenAI vision usage:", response.usage);

  return JSON.parse(response.output_text) as FormulaIdentifyResult;
}
