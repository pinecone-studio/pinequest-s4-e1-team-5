import type { Context } from "hono";
import { getStudioTitles, searchStudioContent } from "../service/studio.service";

export function searchStudioController(c: Context) {
  try {
    const query = c.req.query("q") ?? "";
    const results = searchStudioContent(query);

    return c.json({
      data: results,
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Studio search failed", stage: "studio-search" }, 500);
  }
}

export function getStudioTitlesController(c: Context) {
  try {
    return c.json({
      data: getStudioTitles(),
    });
  } catch (error) {
    console.error(error);
    return c.json({ error: "Studio titles failed", stage: "studio-titles" }, 500);
  }
}
