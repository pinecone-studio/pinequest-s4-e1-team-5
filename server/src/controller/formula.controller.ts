import type { Context } from "hono";
import {
  createFormula,
  createManyFormulas,
  deleteFormula,
  getFormulaTopics,
  getFormulasBySubject,
  getFormulasBySubjectAndTopic,
  searchFormulas,
  seedAllFormulas,
  seedFormulasForTopic,
  updateFormula,
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

    const data = await getFormulaTopics();
    return c.json({ data });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch formulas" }, 500);
  }
}

export async function createFormulaController(c: Context) {
  try {
    const body = await c.req.json();

    const { subject, topic, pod_title, pod_content, wolfram_query } = body;

    if (!subject || !topic || !pod_title || !pod_content) {
      return c.json(
        { error: "subject, topic, pod_title, pod_content required" },
        400,
      );
    }

    const row = await createFormula({
      subject,
      topic,
      pod_title,
      pod_content,
      wolfram_query,
    });
    return c.json({ ok: true, data: row });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create formula" }, 500);
  }
}

export async function createManyFormulasController(c: Context) {
  try {
    const body = await c.req.json();

    if (!Array.isArray(body.formulas) || body.formulas.length === 0) {
      return c.json({ error: "formulas array required" }, 400);
    }

    const result = await createManyFormulas(body.formulas);
    return c.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to bulk insert formulas" }, 500);
  }
}

export async function updateFormulaController(c: Context) {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const row = await updateFormula(id, body);
    return c.json({ ok: true, data: row });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to update formula" }, 500);
  }
}

export async function deleteFormulaController(c: Context) {
  try {
    const id = c.req.param("id");
    await deleteFormula(id);
    return c.json({ ok: true });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to delete formula" }, 500);
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
    const topic = decodeURIComponent(c.req.param("topic"));

    const result = await seedFormulasForTopic(subject, topic);
    return c.json({ ok: !result.error, ...result });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Topic seed failed" }, 500);
  }
}

export async function detectFormulasController(c: Context) {
  try {
    const body = await c.req.json();

    if (!body.image || typeof body.image !== "string") {
      return c.json({ error: "image (base64) is required" }, 400);
    }

    const { detectAndFetchFormulas } =
      await import("../service/formula.service");
    const result = await detectAndFetchFormulas(
      body.image,
      body.mimeType ?? "image/jpeg",
    );
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Formula detection failed" }, 500);
  }
}
