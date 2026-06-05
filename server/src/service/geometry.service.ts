import { openai } from "../openai";
import { verifyWithWolfram } from "./wolfram.service";

export type GeometryTopic =
  | "Angles"
  | "Triangles"
  | "Circles"
  | "Area and Perimeter"
  | "Coordinate Geometry"
  | "Pythagorean Theorem";

export type ShapeType = "triangle" | "circle" | "rectangle" | "line-angle";

type GeometrySolveInput = {
  problem: string;
  grade: number;
};

type DiagramPoint = {
  id: string;
  x: number;
  y: number;
};

type DiagramLabel = {
  text: string;
  x: number;
  y: number;
};

type AngleMark = {
  vertex: string;
  value: string;
};

type SideLabel = {
  from: string;
  to: string;
  value: string;
};

export type GeometryDiagram = {
  type: ShapeType;
  points: DiagramPoint[];
  labels: DiagramLabel[];
  angleMarks: AngleMark[];
  sideLabels: SideLabel[];
  circle?: {
    cx: number;
    cy: number;
    r: number;
    label?: string;
  };
};

export type GeometrySolveAnswer = {
  topic: GeometryTopic;
  shapeType: ShapeType;
  givenValues: string[];
  unknown: string;
  formulaUsed: string;
  whyFormula: string;
  solutionSteps: string[];
  finalAnswer: string;
  wolframQuery: string;
  diagram: GeometryDiagram;
};

export type GeometryVerification = {
  ok: boolean;
  query: string;
  result: string;
};

export const GEOMETRY_FORMULAS: Record<
  GeometryTopic,
  { name: string; formula: string; use: string }[]
> = {
  Angles: [
    {
      name: "Шулуун өнцгийн нийлбэр",
      formula: "a + b = 180°",
      use: "Нэг шулуун дээрх хөрш өнцгүүдийг олоход хэрэглэнэ.",
    },
    {
      name: "Гурвалжны өнцгийн нийлбэр",
      formula: "A + B + C = 180°",
      use: "Гурвалжны дутуу өнцгийг олоход хэрэглэнэ.",
    },
  ],
  Triangles: [
    {
      name: "Гурвалжны талбай",
      formula: "S = (a × h) / 2",
      use: "Суурь ба өндөр өгөгдвөл талбайг олно.",
    },
    {
      name: "Гурвалжны периметр",
      formula: "P = a + b + c",
      use: "Гурван талын уртыг нэмнэ.",
    },
  ],
  Circles: [
    {
      name: "Тойргийн талбай",
      formula: "S = πr²",
      use: "Радиус өгөгдвөл тойргийн талбайг олно.",
    },
    {
      name: "Тойргийн урт",
      formula: "C = 2πr",
      use: "Радиус өгөгдвөл хүрээний уртыг олно.",
    },
  ],
  "Area and Perimeter": [
    {
      name: "Тэгш өнцөгтийн талбай",
      formula: "S = a × b",
      use: "Урт ба өргөн өгөгдвөл талбайг олно.",
    },
    {
      name: "Тэгш өнцөгтийн периметр",
      formula: "P = 2(a + b)",
      use: "Урт ба өргөнийг хоёр дахин нэмнэ.",
    },
  ],
  "Coordinate Geometry": [
    {
      name: "Хоёр цэгийн зай",
      formula: "d = √((x₂ - x₁)² + (y₂ - y₁)²)",
      use: "Координаттай хоёр цэгийн хоорондын зайг олно.",
    },
    {
      name: "Дундаж цэг",
      formula: "M = ((x₁+x₂)/2, (y₁+y₂)/2)",
      use: "Хоёр цэгийн гол цэгийг олно.",
    },
  ],
  "Pythagorean Theorem": [
    {
      name: "Пифагорын теорем",
      formula: "c² = a² + b²",
      use: "Тэгш өнцөгт гурвалжны гипотенузыг олоход хэрэглэнэ.",
    },
  ],
};

const diagramPointSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["id", "x", "y"],
};

const diagramLabelSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
  },
  required: ["text", "x", "y"],
};

const angleMarkSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vertex: { type: "string" },
    value: { type: "string" },
  },
  required: ["vertex", "value"],
};

const sideLabelSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    from: { type: "string" },
    to: { type: "string" },
    value: { type: "string" },
  },
  required: ["from", "to", "value"],
};

const geometrySolveSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topic: {
      type: "string",
      enum: [
        "Angles",
        "Triangles",
        "Circles",
        "Area and Perimeter",
        "Coordinate Geometry",
        "Pythagorean Theorem",
      ],
    },
    shapeType: {
      type: "string",
      enum: ["triangle", "circle", "rectangle", "line-angle"],
    },
    givenValues: {
      type: "array",
      items: { type: "string" },
    },
    unknown: { type: "string" },
    formulaUsed: { type: "string" },
    whyFormula: { type: "string" },
    solutionSteps: {
      type: "array",
      items: { type: "string" },
    },
    finalAnswer: { type: "string" },
    wolframQuery: { type: "string" },
    diagram: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          enum: ["triangle", "circle", "rectangle", "line-angle"],
        },
        points: {
          type: "array",
          items: diagramPointSchema,
        },
        labels: {
          type: "array",
          items: diagramLabelSchema,
        },
        angleMarks: {
          type: "array",
          items: angleMarkSchema,
        },
        sideLabels: {
          type: "array",
          items: sideLabelSchema,
        },
        circle: {
          type: "object",
          additionalProperties: false,
          properties: {
            cx: { type: "number" },
            cy: { type: "number" },
            r: { type: "number" },
            label: { type: "string" },
          },
          required: ["cx", "cy", "r", "label"],
        },
      },
      required: ["type", "points", "labels", "angleMarks", "sideLabels", "circle"],
    },
  },
  required: [
    "topic",
    "shapeType",
    "givenValues",
    "unknown",
    "formulaUsed",
    "whyFormula",
    "solutionSteps",
    "finalAnswer",
    "wolframQuery",
    "diagram",
  ],
};

const GEOMETRY_SYSTEM_PROMPT = `
You are an AI geometry tutor for school students.
Always answer in Mongolian.
Return strict JSON only. Do not use markdown.
Keep explanations simple and suitable for the student's grade.
Choose one topic from: Angles, Triangles, Circles, Area and Perimeter, Coordinate Geometry, Pythagorean Theorem.
Choose one shapeType from: triangle, circle, rectangle, line-angle.
Extract given values, unknown, formula, why the formula applies, solution steps, final answer, Wolfram query, and SVG-friendly diagram instructions.
If Wolfram is not useful, set wolframQuery to "none".
For diagram.circle, use numeric values even when the shape is not a circle; set cx: 0, cy: 0, r: 0, label: "" when unused.
Use coordinates in a 500 by 360 board.
`;

export async function solveGeometryService(input: GeometrySolveInput) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 1200,
    input: [
      {
        role: "system",
        content: GEOMETRY_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Grade: ${input.grade}\nProblem: ${input.problem}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "geometry_solution",
        strict: true,
        schema: geometrySolveSchema,
      },
    },
  });

  const answer = normalizeDiagram(parseOutput<GeometrySolveAnswer>(response.output_text));
  let verification: GeometryVerification = {
    ok: false,
    query: answer.wolframQuery,
    result: "Wolfram not needed",
  };

  if (answer.wolframQuery && answer.wolframQuery !== "none") {
    verification = await verifyWithWolfram(answer.wolframQuery);
  }

  return {
    ...answer,
    verification,
  };
}

export function getGeometryFormulasService() {
  return GEOMETRY_FORMULAS;
}

export function drawGeometryService(input: {
  type?: ShapeType;
  shapeType?: ShapeType;
  givenValues?: string[];
}) {
  const shapeType = input.shapeType ?? input.type ?? "triangle";
  return createDefaultDiagram(shapeType, input.givenValues ?? []);
}

function parseOutput<T>(output: string): T {
  return JSON.parse(output) as T;
}

function normalizeDiagram(answer: GeometrySolveAnswer): GeometrySolveAnswer {
  return {
    ...answer,
    diagram: {
      ...createDefaultDiagram(answer.shapeType, answer.givenValues),
      ...answer.diagram,
      type: answer.diagram?.type ?? answer.shapeType,
      points: answer.diagram?.points ?? [],
      labels: answer.diagram?.labels ?? [],
      angleMarks: answer.diagram?.angleMarks ?? [],
      sideLabels: answer.diagram?.sideLabels ?? [],
      circle: answer.diagram?.circle ?? { cx: 0, cy: 0, r: 0, label: "" },
    },
  };
}

function createDefaultDiagram(
  shapeType: ShapeType,
  givenValues: string[] = [],
): GeometryDiagram {
  if (shapeType === "circle") {
    return {
      type: "circle",
      points: [{ id: "O", x: 250, y: 180 }],
      labels: [{ text: "O", x: 260, y: 180 }],
      angleMarks: [],
      sideLabels: givenValues.map((value) => ({ from: "O", to: "R", value })),
      circle: { cx: 250, cy: 180, r: 95, label: "O" },
    };
  }

  if (shapeType === "rectangle") {
    return {
      type: "rectangle",
      points: [
        { id: "A", x: 120, y: 90 },
        { id: "B", x: 380, y: 90 },
        { id: "C", x: 380, y: 270 },
        { id: "D", x: 120, y: 270 },
      ],
      labels: [
        { text: "A", x: 105, y: 85 },
        { text: "B", x: 395, y: 85 },
        { text: "C", x: 395, y: 285 },
        { text: "D", x: 105, y: 285 },
      ],
      angleMarks: [],
      sideLabels: [],
      circle: { cx: 0, cy: 0, r: 0, label: "" },
    };
  }

  if (shapeType === "line-angle") {
    return {
      type: "line-angle",
      points: [
        { id: "A", x: 120, y: 260 },
        { id: "O", x: 250, y: 220 },
        { id: "B", x: 390, y: 120 },
      ],
      labels: [
        { text: "A", x: 105, y: 275 },
        { text: "O", x: 250, y: 238 },
        { text: "B", x: 405, y: 115 },
      ],
      angleMarks: [{ vertex: "O", value: givenValues[0] ?? "?" }],
      sideLabels: [],
      circle: { cx: 0, cy: 0, r: 0, label: "" },
    };
  }

  return {
    type: "triangle",
    points: [
      { id: "A", x: 120, y: 280 },
      { id: "B", x: 380, y: 280 },
      { id: "C", x: 250, y: 90 },
    ],
    labels: [
      { text: "A", x: 105, y: 300 },
      { text: "B", x: 395, y: 300 },
      { text: "C", x: 250, y: 70 },
    ],
    angleMarks: [],
    sideLabels: [],
    circle: { cx: 0, cy: 0, r: 0, label: "" },
  };
}
