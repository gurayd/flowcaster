import fs from "node:fs";
import path from "node:path";

export type LibraryEntry = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  githubPath: string;
  repo?: string;
  branch?: string;
};

export type LibraryHit = LibraryEntry & { score: number };

let cachedEntries: LibraryEntry[] | null = null;

function loadEntries(): LibraryEntry[] {
  if (cachedEntries) {
    return cachedEntries;
  }

  const filePath = path.join(process.cwd(), "data", "library-index.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cachedEntries = JSON.parse(raw) as LibraryEntry[];
  return cachedEntries;
}

function tokenize(value?: string | string[]): Set<string> {
  if (!value) return new Set();
  const text = Array.isArray(value) ? value.join(" ") : value;
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

export function getLibraryEntryById(id: string): LibraryEntry | undefined {
  return loadEntries().find((entry) => entry.id === id);
}

export function searchLibrary(prompt: string, limit = 5): LibraryHit[] {
  const promptTokens = tokenize(prompt);
  if (promptTokens.size === 0) {
    return [];
  }

  const entries = loadEntries();
  const hits: LibraryHit[] = [];

  for (const entry of entries) {
    const combinedTokens = new Set<string>([
      ...tokenize(entry.name),
      ...tokenize(entry.description),
      ...tokenize(entry.tags ?? []),
    ]);

    let overlap = 0;
    for (const token of promptTokens) {
      if (combinedTokens.has(token)) {
        overlap += 1;
      }
    }

    if (overlap > 0) {
      hits.push({ ...entry, score: overlap });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
