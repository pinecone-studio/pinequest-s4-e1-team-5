import { Hono } from "hono";
import { cors } from "hono/cors";
import { tutorRouter } from "./router/tutor.router";
import { formulaRouter } from "./router/formula.router";
import { quizRouter } from "./router/quiz.router";
import { studioRouter } from "./router/studio.router";

const app = new Hono();

const clientUrls = (Bun.env.CLIENT_URL ?? "http://localhost:3000")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...clientUrls,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Vercel preview deployment URLs: https://*.vercel.app
  if (/^https:\/\/[^.]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => {
  return c.json({
    ok: true,
    message: "Server is running!",
  });
});

app.get("/health", (c) => {
  return c.json({
    ok: true,
    status: "healthy",
  });
});

app.route("/api/tutor", tutorRouter);
app.route("/api/formulas", formulaRouter);
app.route("/api/quiz", quizRouter);
app.route("/api/studio", studioRouter);

const port = Number(Bun.env.PORT ?? 4000);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server is running on http://localhost:${port}`);
