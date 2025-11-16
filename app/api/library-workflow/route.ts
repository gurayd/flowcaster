import { NextRequest, NextResponse } from "next/server";
import { getLibraryEntryById } from "@/lib/librarySearch";
import { saveWorkflow } from "@/lib/store";

const DEFAULT_REPOS = (
  process.env.WORKFLOW_LIBRARY_REPOS ??
  "gurayd/2K-N8NWORKFLOWS,gurayd/awesome-n8n-templates"
)
  .split(",")
  .map((repo) => repo.trim())
  .filter(Boolean);
const DEFAULT_BRANCH = process.env.WORKFLOW_LIBRARY_BRANCH ?? "main";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const entry = getLibraryEntryById(id);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const branch = entry.branch ?? DEFAULT_BRANCH;
  const candidateRepos = entry.repo ? [entry.repo] : DEFAULT_REPOS;

  for (const repo of candidateRepos) {
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${entry.githubPath}`;
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`GitHub returned ${response.status}`);
      }

      const workflow = await response.json();
      saveWorkflow(id, workflow);

      return NextResponse.json({ id, workflow, source: { repo, branch } });
    } catch (error) {
      // Try next repo
      console.warn(`Failed to load workflow ${id} from ${repo}`, error);
    }
  }

  return NextResponse.json(
    {
      error: "Unable to load this library workflow right now. Please try generating a new one.",
      details: `Tried repositories: ${candidateRepos.join(", ")}`,
    },
    { status: 502 },
  );
}
