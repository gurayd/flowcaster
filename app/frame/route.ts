import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreWorkflow } from "@/lib/workflow";
import { getPublicBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

const TIP_VALUE = "0.0005";
const BASE_URL = getPublicBaseUrl();
const DEFAULT_IMAGE = `${BASE_URL}/frame/image?title=Flowcaster&subtitle=Describe+automation+%E2%86%92+get+n8n+workflow`;
const BASE_TIP_ADDRESS =
  process.env.BASE_TIP_ADDRESS ??
  "0x86796a14774d06e18f5cb1c67c97f578e30bba02";
const TIP_URL = `https://pay.base.org/?to=${encodeURIComponent(
  BASE_TIP_ADDRESS || "0x86796a14774d06e18f5cb1c67c97f578e30bba02",
)}&chain=base&value=${TIP_VALUE}`;
const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=15",
};

type FramePayload = {
  prompt?: string;
  untrustedData?: {
    inputText?: string;
  };
};

export async function GET() {
  return new NextResponse(renderInitialFrame(), {
    headers: HTML_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as FramePayload;
  const promptFromBody =
    typeof body.prompt === "string" ? body.prompt.trim() : "";
  const promptFromFrame =
    typeof body.untrustedData?.inputText === "string"
      ? body.untrustedData.inputText.trim()
      : "";
  const prompt = promptFromBody || promptFromFrame;

  if (!prompt) {
    return new NextResponse(renderInitialFrame("No prompt provided."), {
      headers: HTML_HEADERS,
    });
  }

  try {
    const mock = (process.env.MOCK_OPENAI ?? "").toLowerCase() === "true";
    const result = await generateAndStoreWorkflow(prompt, { mock });

    const flowUrl = `${BASE_URL}/w?id=${encodeURIComponent(result.id)}`;
    const imageUrl = `${BASE_URL}/frame/image?title=${encodeURIComponent(
      "Flow created",
    )}&subtitle=${encodeURIComponent(
      result.workflow.name ?? "Your n8n workflow is ready",
    )}`;

    return new NextResponse(
      renderSuccessFrame({
        imageUrl,
        flowUrl,
        description:
          result.workflow.meta?.description ??
          "Your n8n workflow is ready to import.",
      }),
      {
        headers: HTML_HEADERS,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate workflow.";
    return new NextResponse(renderInitialFrame(message), {
      headers: HTML_HEADERS,
    });
  }
}

function renderInitialFrame(subtitle?: string) {
  const ogDescription =
    subtitle ?? "Describe automations, get validated n8n workflows + Base tips.";
  const postUrl = `${BASE_URL}/frame`;

  return `<!doctype html>
<html>
  <head>
    <meta property="og:title" content="Flowcaster" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(DEFAULT_IMAGE)}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${escapeHtml(DEFAULT_IMAGE)}" />
    <meta property="fc:frame:post_url" content="${escapeHtml(postUrl)}" />
    <meta property="fc:frame:input:text" content="Describe your automation" />
    <meta property="fc:frame:button:1" content="Generate flow" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="Tip via Base" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${escapeHtml(TIP_URL)}" />
  </head>
  <body>Flowcaster Frame</body>
</html>`;
}

function renderSuccessFrame(params: {
  imageUrl: string;
  flowUrl: string;
  description: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta property="og:title" content="Flowcaster – Flow ready" />
    <meta property="og:description" content="${escapeHtml(
      params.description,
    )}" />
    <meta property="og:image" content="${escapeHtml(params.imageUrl)}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${escapeHtml(params.imageUrl)}" />
    <meta property="fc:frame:button:1" content="Open flow" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${escapeHtml(
      params.flowUrl,
    )}" />
    <meta property="fc:frame:button:2" content="Tip via Base" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="${escapeHtml(TIP_URL)}" />
  </head>
  <body>Flowcaster Frame</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
