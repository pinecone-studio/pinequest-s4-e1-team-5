import { Hono } from "hono";
import { cors } from "hono/cors";
import { tutorRouter } from "./router/tutor.router";

const app = new Hono();

const clientUrl = Bun.env.CLIENT_URL ?? "http://localhost:3000";

app.use(
  "*",
  cors({
    origin: clientUrl,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
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

const port = Number(Bun.env.PORT ?? 4000);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server is running on http://localhost:${port}`);