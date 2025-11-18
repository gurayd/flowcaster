import { NextRequest, NextResponse } from "next/server";
import { ensureWorkflowsTable, getSqlClientOrNull } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

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
    const { rows } =
      await client`SELECT id, payload FROM workflows WHERE id = ${id}`;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Workflow not found in library" },
        { status: 404 },
      );
    }

    return NextResponse.json({ id: rows[0].id, workflow: rows[0].payload });
  } catch (error) {
    console.error("library-workflow error", error);
    return NextResponse.json(
      {
        error: "Failed to load workflow",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
