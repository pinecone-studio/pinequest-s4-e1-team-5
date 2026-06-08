import type { Context } from "hono";
import { generateQuizService } from "../service/formula.service";

export async function generateQuizController(c: Context) {
  try {
    const body = await c.req.json();

    const { gradeRange, subject, topic } = body;
    const count = Number(body.count ?? 5);

    if (!gradeRange || !subject || !topic) {
      return c.json({ error: "gradeRange, subject, topic required" }, 400);
    }

    if (!["1-5", "6-9", "10-12"].includes(gradeRange)) {
      return c.json(
        { error: "gradeRange must be '1-5', '6-9', or '10-12'" },
        400,
      );
    }

    if (count < 1 || count > 10) {
      return c.json({ error: "count must be between 1 and 10" }, 400);
    }

    const result = await generateQuizService(gradeRange, subject, topic, count);
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Quiz generation failed" }, 500);
  }
}
