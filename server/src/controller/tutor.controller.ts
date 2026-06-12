import type { Context } from "hono";
import {
  generateExampleService,
  generatePracticeService,
  getTutorHistoryService,
  solveTutorService,
} from "../service/tutor.service";

const allowedSubjects = ["math", "physics", "geometry", "chemistry"] as const;

type Subject = (typeof allowedSubjects)[number];

function getSubject(value: unknown): Subject {
  return typeof value === "string" &&
    allowedSubjects.includes(value as Subject)
    ? (value as Subject)
    : "math";
}

export async function solveTutorController(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.problem || typeof body.problem !== "string") {
      return c.json(
        {
          error: "problem is required",
        },
        400
      );
    }

    const result = await solveTutorService({
      problem: body.problem,
      grade: body.grade ?? 11,
      subject: getSubject(body.subject),
    });

    return c.json(result);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Tutor solve request failed",
        stage: "solve",
      },
      500
    );
  }
}

export async function getTutorHistoryController(c: Context) {
  try {
    const result = await getTutorHistoryService();

    return c.json({
      data: result,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Failed to get tutor history",
      },
      500
    );
  }
}

export async function generateExampleController(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.originalProblem || typeof body.originalProblem !== "string") {
      return c.json(
        {
          error: "originalProblem is required",
        },
        400
      );
    }

    const result = await generateExampleService({
      originalProblem: body.originalProblem,
      topic: typeof body.topic === "string" ? body.topic : "",
      grade: body.grade ?? 11,
      subject: getSubject(body.subject),
    });

    return c.json(result);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Example generation failed",
      },
      500
    );
  }
}

export async function generatePracticeController(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.topic || typeof body.topic !== "string") {
      return c.json(
        {
          error: "topic is required",
        },
        400
      );
    }

    const result = await generatePracticeService({
      topic: body.topic,
      grade: body.grade ?? 11,
      subject: getSubject(body.subject),
      difficulty: body.difficulty ?? "easy",
    });

    return c.json(result);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Practice generation failed",
      },
      500
    );
  }
}
