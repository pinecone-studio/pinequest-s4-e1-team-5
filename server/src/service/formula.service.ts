import { sql } from "../db";
import { openai } from "../openai";
import { fetchWolframPods } from "./wolfram.service";

export type Subject = "math" | "physics" | "geometry" | "chemistry";

const WOLFRAM_QUERIES: Record<Subject, { topic: string; query: string }[]> = {
  math: [
    { topic: "Arithmetic", query: "sum of integers 1 to n" },
    { topic: "Percentages", query: "percentage formula" },
    { topic: "Fractions", query: "fraction division formula" },
    { topic: "Ratios and Proportions", query: "ratio proportion formula" },
    { topic: "Powers and Roots", query: "square root formula" },

    { topic: "Algebra", query: "quadratic formula" },
    { topic: "Linear Equations", query: "slope intercept form y = mx + b" },
    {
      topic: "Quadratic Equations",
      query: "quadratic formula x = (-b +- sqrt(b^2-4ac))/2a",
    },
    { topic: "Polynomial Equations", query: "polynomial roots formula" },
    { topic: "Inequalities", query: "absolute value inequality" },
    { topic: "Exponents", query: "exponent rules a^m * a^n" },
    { topic: "Factoring", query: "difference of squares a^2 - b^2" },
    { topic: "Systems of Equations", query: "Cramer rule system of equations" },

    { topic: "Trigonometry", query: "sin^2(x) + cos^2(x)" },
    {
      topic: "Trigonometric Identities",
      query: "double angle formula sin(2x)",
    },
    { topic: "Sine and Cosine Rule", query: "law of sines a/sin(A)" },
    {
      topic: "Inverse Trigonometry",
      query: "arcsin arccos arctan derivatives",
    },
    { topic: "Radians and Degrees", query: "radians to degrees conversion" },

    { topic: "Logarithm", query: "log(a*b) = log a + log b" },
    { topic: "Natural Logarithm", query: "natural logarithm e^x derivative" },
    { topic: "Change of Base", query: "change of base formula logarithm" },

    { topic: "Sequences and Series", query: "sum of geometric series" },
    { topic: "Arithmetic Sequence", query: "arithmetic sequence nth term" },
    { topic: "Geometric Sequence", query: "geometric sequence nth term" },
    { topic: "Binomial Theorem", query: "binomial theorem expansion" },
    { topic: "Fibonacci Sequence", query: "Fibonacci sequence formula" },

    { topic: "Probability", query: "binomial probability formula" },
    { topic: "Combinatorics", query: "combinations C(n,r) = n!/r!(n-r)!" },
    { topic: "Permutations", query: "permutations P(n,r) = n!/(n-r)!" },
    { topic: "Statistics", query: "standard deviation formula" },
    { topic: "Normal Distribution", query: "normal distribution formula" },
    { topic: "Mean Median Mode", query: "mean median mode formula" },
    { topic: "Variance", query: "variance formula statistics" },

    { topic: "Calculus", query: "derivative of x^n" },
    { topic: "Differentiation Rules", query: "product rule differentiation" },
    { topic: "Integration", query: "integral of x^n" },
    { topic: "Chain Rule", query: "chain rule derivative" },
    { topic: "Limits", query: "limit definition derivative" },
    { topic: "Taylor Series", query: "Taylor series expansion" },
    {
      topic: "Fundamental Theorem of Calculus",
      query: "fundamental theorem of calculus",
    },

    { topic: "Number Theory", query: "prime number theorem" },
    { topic: "Complex Numbers", query: "complex number modulus argument" },
    { topic: "Matrices", query: "matrix determinant formula" },
    { topic: "Matrix Operations", query: "matrix multiplication formula" },
    { topic: "Determinants", query: "2x2 matrix determinant ad-bc" },
  ],
  physics: [
    { topic: "Kinematics", query: "v = u + at" },
    { topic: "Projectile Motion", query: "projectile motion range formula" },
    { topic: "Circular Motion", query: "centripetal acceleration v^2/r" },
    { topic: "Dynamics", query: "F = ma" },
    { topic: "Friction", query: "friction force formula mu*N" },
    { topic: "Momentum", query: "momentum p = mv" },
    { topic: "Impulse", query: "impulse J = F*t" },
    { topic: "Torque", query: "torque = r * F * sin(theta)" },
    {
      topic: "Simple Harmonic Motion",
      query: "simple harmonic motion period formula",
    },

    { topic: "Energy and Work", query: "kinetic energy (1/2)mv^2" },
    { topic: "Potential Energy", query: "gravitational potential energy mgh" },
    { topic: "Power", query: "power P = W/t" },
    {
      topic: "Conservation of Energy",
      query: "conservation of mechanical energy",
    },
    {
      topic: "Elastic Potential Energy",
      query: "spring potential energy (1/2)kx^2",
    },

    { topic: "Thermodynamics", query: "PV = nRT" },
    {
      topic: "First Law of Thermodynamics",
      query: "first law thermodynamics delta U = Q - W",
    },
    {
      topic: "Second Law of Thermodynamics",
      query: "entropy formula thermodynamics",
    },
    { topic: "Heat Transfer", query: "heat conduction formula Q = mcT" },
    { topic: "Thermal Expansion", query: "linear thermal expansion formula" },
    { topic: "Carnot Efficiency", query: "Carnot engine efficiency formula" },

    { topic: "Electricity", query: "V = IR Ohm law" },
    { topic: "Electric Power", query: "electric power P = IV" },
    { topic: "Capacitance", query: "capacitance formula C = Q/V" },
    { topic: "Electric Field", query: "electric field E = F/q" },
    { topic: "Coulombs Law", query: "Coulomb law F = kq1q2/r^2" },
    {
      topic: "Resistors in Circuit",
      query: "resistors in series and parallel",
    },

    { topic: "Magnetism", query: "magnetic force on moving charge" },
    { topic: "Magnetic Flux", query: "magnetic flux formula Phi = B*A" },
    { topic: "Faraday Law", query: "Faraday law of induction EMF" },
    { topic: "Ampere Law", query: "Ampere law magnetic field" },

    { topic: "Waves and Optics", query: "v = f*lambda" },
    {
      topic: "Wave Interference",
      query: "constructive destructive interference",
    },
    { topic: "Doppler Effect", query: "Doppler effect formula" },
    { topic: "Snells Law", query: "Snell law n1*sin(t1) = n2*sin(t2)" },
    { topic: "Lens Formula", query: "thin lens formula 1/f = 1/v + 1/u" },

    { topic: "Gravitation", query: "F = Gm1m2/r^2" },
    { topic: "Orbital Motion", query: "orbital velocity formula" },
    { topic: "Escape Velocity", query: "escape velocity formula" },
    { topic: "Keplers Laws", query: "Kepler third law T^2 = r^3" },

    { topic: "Special Relativity", query: "Einstein mass energy E = mc^2" },
    { topic: "Photoelectric Effect", query: "photoelectric effect E = hf" },
    {
      topic: "De Broglie Wavelength",
      query: "de Broglie wavelength lambda = h/mv",
    },
    { topic: "Nuclear Physics", query: "radioactive decay formula" },
    { topic: "Fluid Mechanics", query: "Bernoulli equation fluid" },
    { topic: "Pressure", query: "pressure P = F/A" },
    { topic: "Buoyancy", query: "Archimedes principle buoyancy force" },
  ],
  geometry: [
    { topic: "Triangles", query: "area of triangle (1/2)*base*height" },
    {
      topic: "Pythagorean Theorem",
      query: "Pythagorean theorem a^2 + b^2 = c^2",
    },
    { topic: "Circles", query: "area of circle pi*r^2" },
    {
      topic: "Rectangles and Polygons",
      query: "area of rectangle length*width",
    },
    { topic: "Trapezoid", query: "area of trapezoid formula" },
    { topic: "Parallelogram", query: "area of parallelogram base*height" },
    { topic: "Regular Polygons", query: "area of regular polygon formula" },
    { topic: "Ellipse", query: "area of ellipse pi*a*b" },

    { topic: "Volume of Solids", query: "volume of sphere (4/3)*pi*r^3" },
    { topic: "Volume of Cylinder", query: "volume of cylinder pi*r^2*h" },
    { topic: "Volume of Cone", query: "volume of cone (1/3)*pi*r^2*h" },
    {
      topic: "Volume of Pyramid",
      query: "volume of pyramid (1/3)*base*height",
    },
    { topic: "Volume of Cube", query: "volume of cube a^3" },
    { topic: "Surface Area", query: "surface area of cylinder" },
    {
      topic: "Surface Area of Sphere",
      query: "surface area of sphere 4*pi*r^2",
    },
    { topic: "Surface Area of Cone", query: "surface area of cone pi*r*(r+l)" },

    {
      topic: "Coordinate Geometry",
      query: "distance formula sqrt((x2-x1)^2+(y2-y1)^2)",
    },
    { topic: "Midpoint Formula", query: "midpoint formula coordinates" },
    { topic: "Slope of a Line", query: "slope formula (y2-y1)/(x2-x1)" },
    { topic: "Equation of a Line", query: "equation of line slope intercept" },
    {
      topic: "Equation of Circle",
      query: "equation of circle (x-h)^2+(y-k)^2=r^2",
    },
    { topic: "Parabola", query: "parabola equation y = ax^2 + bx + c" },
    { topic: "Hyperbola", query: "hyperbola equation standard form" },

    { topic: "Vectors", query: "dot product of vectors" },
    { topic: "Cross Product", query: "cross product of vectors formula" },
    { topic: "Vector Magnitude", query: "magnitude of vector formula" },
    { topic: "Vector Projection", query: "vector projection formula" },

    { topic: "Angles and Lines", query: "supplementary complementary angles" },
    { topic: "Arc Length", query: "arc length formula r*theta" },
    { topic: "Sector Area", query: "area of sector (1/2)*r^2*theta" },
  ],
  chemistry: [
    { topic: "Moles and Molar Mass", query: "moles = mass / molar mass" },
    { topic: "Stoichiometry", query: "stoichiometry mole ratio" },
    {
      topic: "Empirical Formula",
      query: "empirical molecular formula chemistry",
    },
    {
      topic: "Percent Composition",
      query: "percent composition formula chemistry",
    },

    { topic: "Gas Laws", query: "PV = nRT ideal gas" },
    { topic: "Boyles Law", query: "Boyle law P1V1 = P2V2" },
    { topic: "Charles Law", query: "Charles law V1/T1 = V2/T2" },
    { topic: "Gay-Lussacs Law", query: "Gay-Lussac law P1/T1 = P2/T2" },
    { topic: "Combined Gas Law", query: "combined gas law P1V1/T1 = P2V2/T2" },
    { topic: "Daltons Law", query: "Dalton law partial pressure" },
    { topic: "Grahams Law", query: "Graham law of effusion" },

    { topic: "Concentration", query: "molarity = moles / liters" },
    { topic: "Dilution", query: "dilution formula M1V1 = M2V2" },
    {
      topic: "Colligative Properties",
      query: "boiling point elevation formula",
    },
    { topic: "Osmotic Pressure", query: "osmotic pressure formula pi = MRT" },

    { topic: "Reaction Rates", query: "rate = k[A]^m[B]^n" },
    { topic: "Half Life", query: "half life formula t1/2" },
    {
      topic: "Arrhenius Equation",
      query: "Arrhenius equation k = Ae^(-Ea/RT)",
    },

    { topic: "Thermochemistry", query: "delta H Hess law" },
    { topic: "Gibbs Free Energy", query: "Gibbs free energy G = H - TS" },
    { topic: "Entropy", query: "entropy formula delta S" },
    { topic: "Bond Enthalpy", query: "bond enthalpy calculation" },
    { topic: "Calorimetry", query: "heat capacity q = mc delta T" },

    { topic: "Electrochemistry", query: "Faraday law Q = nF" },
    { topic: "Nernst Equation", query: "Nernst equation cell potential" },
    { topic: "Standard Cell Potential", query: "standard electrode potential" },

    { topic: "Acids and Bases", query: "pH = -log[H+]" },
    { topic: "Buffer Solutions", query: "Henderson-Hasselbalch equation" },
    { topic: "Titration", query: "titration equivalence point formula" },
    { topic: "Ka and Kb", query: "acid dissociation constant Ka formula" },

    { topic: "Atomic Structure", query: "Bohr model energy levels hydrogen" },
    {
      topic: "Quantum Numbers",
      query: "quantum numbers electron configuration",
    },
    {
      topic: "Nuclear Chemistry",
      query: "radioactive decay formula chemistry",
    },
    { topic: "Isotopes", query: "atomic mass isotope formula" },
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
    "The student is in grade 1-5 (age 7-11). Use very simple language and basic formulas only.",
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

  const formulaContext =
    formulas.length > 0
      ? formulas.map((f) => `- ${f.pod_title}: ${f.pod_content}`).join("\n")
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
explanation must be 1-2 sentences in Mongolian.
Return JSON only.`,
      },
      {
        role: "user",
        content: `Subject: ${subject}
Topic: ${topic}
Grade range: ${gradeRange}
Available formulas:
${formulaContext}

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
    questions: parsed.questions,
  };
}
