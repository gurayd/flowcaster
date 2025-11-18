import { NextResponse } from "next/server";
import { ensureWorkflowsTable, getSqlClientOrNull } from "@/lib/db";
import libraryIndex from "@/data/library-index.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toTextArrayLiteral(values?: string[]) {
  if (!values || values.length === 0) return "{}";
  return `{${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")}}`;
}

async function fetchWorkflow(repo: string, branch: string, path: string) {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${url}`);
  }
  return response.json();
}

export async function POST() {
  console.log("🟩 /api/admin/migrate-library called");

  try {
    const client = getSqlClientOrNull();
    if (!client) {
      return NextResponse.json(
        {
          error: "Database not configured",
          details: "Missing Postgres env vars",
        },
        { status: 503 },
      );
    }

    await ensureWorkflowsTable();

    let migrated = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ id: string; reason: string }> = [];

    for (const entry of libraryIndex) {
      const repo = entry.repo ?? process.env.WORKFLOW_LIBRARY_REPO ?? "gurayd/2K-N8NWORKFLOWS";
      const branch = entry.branch ?? process.env.WORKFLOW_LIBRARY_BRANCH ?? "main";
      const path = entry.githubPath;

      try {
        const payload = await fetchWorkflow(repo, branch, path);
        const payloadJson = JSON.stringify(payload);
        const existing =
          await client`SELECT id FROM workflows WHERE id = ${entry.id}`;
        const alreadyExists = (existing.rowCount ?? 0) > 0;

        await client`
          INSERT INTO workflows (id, title, description, tags, source_repo, source_path, payload)
          VALUES (
            ${entry.id},
            ${entry.name},
            ${entry.description ?? null},
            ${toTextArrayLiteral(entry.tags)}::text[],
            ${repo},
            ${path},
            ${payloadJson}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            tags = EXCLUDED.tags,
            source_repo = EXCLUDED.source_repo,
            source_path = EXCLUDED.source_path,
            payload = EXCLUDED.payload,
            updated_at = NOW()
        `;

        if (alreadyExists) {
          updated += 1;
        } else {
          migrated += 1;
        }
      } catch (error) {
        failed += 1;
        const reason = error instanceof Error ? error.message : String(error);
        errors.push({ id: entry.id, reason });
        console.error(`🟥 Failed to migrate ${entry.id}`, error);
      }
    }

    return NextResponse.json({ migrated, updated, failed, errors });
  } catch (error) {
    console.error("🟥 migrate-library fatal error", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
