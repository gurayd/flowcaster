import { NextRequest, NextResponse } from "next/server";
import { searchLibrary } from "@/lib/librarySearch";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const hits = searchLibrary(prompt);
  return NextResponse.json({ hits });
}
