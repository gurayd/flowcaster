import { sql as vercelSql } from "@vercel/postgres";

export const sql = vercelSql;

let ensuredWorkflowsTable = false;

export async function ensureWorkflowsTable() {
  if (ensuredWorkflowsTable) return;

  try {
    await sql`
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
  } catch (error) {
    console.error("[db] ensureWorkflowsTable error", error);
    throw error;
  }
}
