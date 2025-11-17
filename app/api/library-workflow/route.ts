import { NextRequest, NextResponse } from "next/server";
import { ensureWorkflowsTable, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hasPostgresEnv =
  Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_HOST,
  );

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!hasPostgresEnv) {
    return NextResponse.json(
      { error: "Postgres unavailable", details: "Missing connection env vars" },
      { status: 500 },
    );
  }

  try {
    await ensureWorkflowsTable();
    const { rows } =
      await sql`SELECT id, payload FROM workflows WHERE id = ${id}`;

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
