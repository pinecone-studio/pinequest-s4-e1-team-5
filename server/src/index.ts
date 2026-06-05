import { Hono } from "hono";
import { cors } from "hono/cors";
import { tutorRouter } from "./router/tutor.router";
import { formulaRouter } from "./router/formula.router";

const app = new Hono();

function normalizeOrigin(origin?: string) {
  if (!origin) {
    return undefined;
  }

  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
}

function isLocalNetworkPreviewOrigin(origin: string) {
  try {
    const url = new URL(origin);

    if (url.protocol !== "http:" || url.port !== "3000") {
      return false;
    }

    const octets = url.hostname.split(".").map((part) => Number(part));

    if (
      octets.length !== 4 ||
      octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) {
      return false;
    }

    const [first, second] = octets;

    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  } catch {
    return false;
  }
}

const allowedOrigins = new Set([
  "http://localhost:3000",
  normalizeOrigin(Bun.env.CLIENT_URL),
].filter((origin): origin is string => Boolean(origin)));

app.use(
  "*",
  cors({
    origin: (origin) => {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin) {
        return undefined;
      }

      if (allowedOrigins.has(normalizedOrigin) || isLocalNetworkPreviewOrigin(normalizedOrigin)) {
        return normalizedOrigin;
      }

      return undefined;
    },
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

const port = Number(Bun.env.PORT ?? 4000);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Server is running on http://localhost:${port}`);
