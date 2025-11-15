import { NextRequest, NextResponse } from "next/server";
import { validateWorkflow } from "@/lib/validator";

type DeployRequest = {
  workflow: unknown;
  activate?: boolean;
};

const DEFAULT_TIMEOUT = 15_000;

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as DeployRequest | null;

  if (!payload?.workflow) {
    return NextResponse.json(
      { error: "workflow payload is required" },
      { status: 400 },
    );
  }

  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "n8n API credentials are not configured" },
      { status: 503 },
    );
  }

  const workflow = validateWorkflow(payload.workflow);
  workflow.active = payload.activate ?? false;

  const endpoint = `${baseUrl.replace(/\/$/, "")}/rest/workflows`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(workflow),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "n8n deployment failed",
          details: errorText || response.statusText,
        },
        { status: 502 },
      );
    }

    const deployed = await response.json();
    return NextResponse.json({ workflow: deployed });
  } catch (error) {
    clearTimeout(timeout);
    const message =
      error instanceof Error ? error.message : "Unknown deployment error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
