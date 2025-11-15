import { NextRequest, NextResponse } from "next/server";
import { getWorkflow } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const download = searchParams.get("download");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const workflow = getWorkflow(id);

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (download === "1") {
    const body = JSON.stringify(workflow, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="workflow-${id}.json"`,
      },
    });
  }

  return NextResponse.json({ id, workflow });
}
