import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/env";

const MANIFEST_ID = "flowcaster";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const baseUrl = getPublicBaseUrl();

  const manifest = {
    id: MANIFEST_ID,
    name: "Flowcaster",
    description: "Generate and view custom n8n automations using natural language.",
    iconUrl: `${baseUrl}/icon.png`,
    websiteUrl: baseUrl,
    navigation: {
      home: `${baseUrl}/frame`,
    },
    developer: {
      name: "Flowcaster",
      url: baseUrl,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
