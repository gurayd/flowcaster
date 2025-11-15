import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreWorkflow } from "@/lib/workflow";

export const dynamic = "force-dynamic";

type GenerateRequest = {
  prompt?: string;
  mock?: boolean;
};

export async function POST(request: NextRequest) {
  let payload: GenerateRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const prompt = payload.prompt?.trim();

  if (!prompt) {
    return NextResponse.json(
      { error: "A natural language automation prompt is required" },
      { status: 400 },
    );
  }

  const useMock = Boolean(payload.mock);

  try {
    const result = await generateAndStoreWorkflow(prompt, {
      mock: useMock,
    });

    return NextResponse.json({
      id: result.id,
      workflow: result.workflow,
      status: {
        repairAttempted: result.repairAttempted,
        mocked: result.mocked,
      },
      raw: result.raw,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate workflow at this time";

    const status = message.includes("OPENAI_API_KEY") ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
