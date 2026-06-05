import type { Context } from "hono";
import {
  getFormulaTopics,
  getFormulasBySubject,
  getFormulasBySubjectAndTopic,
  identifyFormulasFromImage,
  searchFormulas,
  seedAllFormulas,
  seedFormulasForTopic,
  type Subject,
} from "../service/formula.service";

export async function getFormulasController(c: Context) {
  try {
    const subject = c.req.query("subject") as Subject | undefined;
    const topic = c.req.query("topic");
    const q = c.req.query("q");

    if (q) {
      const data = await searchFormulas(q);
      return c.json({ data });
    }

    if (subject && topic) {
      const data = await getFormulasBySubjectAndTopic(subject, topic);
      return c.json({ data });
    }

    if (subject) {
      const data = await getFormulasBySubject(subject);
      return c.json({ data });
    }

    // Filter байхгүй → бүх topic тоо харуулна
    const data = await getFormulaTopics();
    return c.json({ data });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch formulas" }, 500);
  }
}

export async function seedAllController(c: Context) {
  try {
    seedAllFormulas().catch(console.error);
    return c.json({ ok: true, message: "Seeding started in background" });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Seed failed to start" }, 500);
  }
}

export async function seedTopicController(c: Context) {
  try {
    const subject = c.req.param("subject") as Subject;
    const topicParam = c.req.param("topic");

    if (!topicParam) {
      return c.json({ error: "topic is required" }, 400);
    }

    const topic = decodeURIComponent(topicParam);

    const result = await seedFormulasForTopic(subject, topic);
    return c.json({ ok: !result.error, ...result });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Topic seed failed" }, 500);
  }
}

export async function identifyFormulasController(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.image || typeof body.image !== "string") {
      return c.json({ error: "image (base64) is required" }, 400);
    }

    const mimeType = body.mimeType ?? "image/jpeg";

    const result = await identifyFormulasFromImage(body.image, mimeType);
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Image formula identification failed" }, 500);
  }
}
