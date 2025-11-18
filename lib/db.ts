import { sql as vercelSql } from "@vercel/postgres";

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "PGHOST",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
];

let warnedMissingEnv = false;
let ensuredWorkflowsTable = false;

export function isDatabaseConfigured(): boolean {
  return REQUIRED_KEYS.some((key) => Boolean(process.env[key]));
}

export function getSqlClientOrNull() {
  if (!isDatabaseConfigured()) {
    if (!warnedMissingEnv) {
      console.warn(
        "[db] Database env vars not found. Running in read-only/null DB mode.",
      );
      warnedMissingEnv = true;
    }
    return null;
  }
  return vercelSql;
}

export async function ensureWorkflowsTable() {
  const client = getSqlClientOrNull();
  if (!client || ensuredWorkflowsTable) return;

  await client`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      source_repo TEXT,
      source_path TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  ensuredWorkflowsTable = true;
}

export const sql = vercelSql;
