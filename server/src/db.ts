import { neon } from "@neondatabase/serverless";

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

export const sql = neon(databaseUrl);