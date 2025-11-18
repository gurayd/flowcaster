"use client";

import { useCallback, useMemo, useState } from "react";
import type { N8nWorkflow } from "@/lib/schema";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const BaseTipButton = dynamic(
  () => import("@/components/BaseTipButton").then((mod) => mod.BaseTipButton),
  { ssr: false },
);

const defaultMock = process.env.NEXT_PUBLIC_FLOWCASTER_MOCK === "true";

type GenerateStatus = {
  repairAttempted?: boolean;
  mocked?: boolean;
};

type LibraryHit = {
  id: string;
  name: string;
  description?: string;
  githubPath: string;
  tags?: string[];
  score: number;
};

type WorkflowSource = "generated" | "library" | null;

export function FlowForm() {
  const t = useTranslations();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [status, setStatus] = useState<GenerateStatus | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [mock, setMock] = useState(defaultMock);
  const [libraryHit, setLibraryHit] = useState<LibraryHit | null>(null);
  const [isSearchingLibrary, setIsSearchingLibrary] = useState(false);
  const [useLibraryLoading, setUseLibraryLoading] = useState(false);
  const [workflowSource, setWorkflowSource] = useState<WorkflowSource>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const suggestions = useMemo(() => {
    const raw = t.raw("form.suggestions");
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);


  const runGeneration = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWorkflow(null);
    setStatus(null);
    setRaw(null);
    setWorkflowSource(null);
    setCopySuccess(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mock }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? t("form.errors.unexpected"));
      }

      setWorkflow(data.workflow);
      setStatus(data.status ?? null);
      setRaw(data.raw ?? null);
      setWorkflowSource("generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.errors.unexpected"));
    } finally {
      setLoading(false);
    }
  }, [mock, prompt, t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!prompt.trim()) {
        setError(t("form.errors.promptRequired"));
        return;
      }
      setLibraryHit(null);
      setIsSearchingLibrary(true);
      setError(null);

      try {
        const response = await fetch("/api/library-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.hits) && data.hits.length > 0) {
          const [best] = data.hits as LibraryHit[];
          if (best.score > 0) {
            setLibraryHit(best);
            setIsSearchingLibrary(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Library search failed", err);
      } finally {
        setIsSearchingLibrary(false);
      }

      await runGeneration();
    },
    [prompt, runGeneration, t],
  );

  const helperText = useMemo(() => {
    if (!status) return null;
    if (status.mocked) {
      return t("form.helper.mock");
    }
    if (status.repairAttempted) {
      return t("form.helper.repair");
    }
    return t("form.helper.valid");
  }, [status, t]);

  const workflowJson = useMemo(() => {
    if (!workflow) return null;
    return raw ?? JSON.stringify(workflow, null, 2);
  }, [raw, workflow]);

  const canCopyJson = Boolean(workflowJson);

  const handleCopyJson = useCallback(async () => {
    if (!workflowJson) return;
    try {
      await navigator.clipboard.writeText(workflowJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch {
      setError(t("form.errors.unexpected"));
    }
  }, [t, workflowJson]);

  return (
    <section className="w-full space-y-8 rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-indigo-500">
          {t("title")}
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
          {t("tagline")}
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          {t("form.description")}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t("form.promptLabel")}
          </span>
          <textarea
            className="min-h-[140px] rounded-2xl border border-zinc-300 px-4 py-3 text-base text-zinc-900 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            placeholder={t("form.placeholder")}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={mock}
              onChange={(event) => setMock(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>{t("form.mockToggle")}</span>
          </label>
          <BaseTipButton />
        </div>

        <button
          type="submit"
          disabled={loading || isSearchingLibrary}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isSearchingLibrary
            ? t("form.librarySuggestion.searching")
            : loading
              ? t("form.loading")
              : t("form.submit")}
        </button>
      </form>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {workflow ? (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-black/60 dark:text-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">{workflow.name}</p>
              {helperText ? (
                <p className="text-xs text-zinc-500">{helperText}</p>
              ) : null}
              {workflowSource === "library" ? (
                <p className="text-xs font-semibold text-indigo-600">
                  {t("form.loadedFromLibrary")}
                </p>
              ) : null}
            </div>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-900">
              {workflow.triggerMode}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-3 dark:bg-zinc-900/70">
            <span className="text-sm font-medium text-indigo-500">
              {t("form.viewJson")}
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              disabled={!canCopyJson}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {t("form.copyJsonLabel")}
            </button>
          </div>
          {copySuccess ? (
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              {t("form.copyJsonSuccess")}
            </p>
          ) : null}
          <pre className="max-h-[320px] overflow-auto rounded-xl bg-zinc-900/90 p-4 text-xs text-indigo-100">
            {workflowJson ?? ""}
          </pre>
        </div>
      ) : null}

      {libraryHit ? (
        <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm text-zinc-800 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-zinc-100">
          <div>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
              {t("form.librarySuggestion.title")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t("form.librarySuggestion.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!libraryHit) return;
                setUseLibraryLoading(true);
                setError(null);
                setCopySuccess(false);
                setWorkflow(null);
                setWorkflowSource(null);
                try {
                  const response = await fetch(
                    `/api/library-workflow?id=${encodeURIComponent(libraryHit.id)}`,
                  );
                  const data = await response.json();
                  if (!response.ok) {
                    throw new Error(data.error ?? t("form.errors.unexpected"));
                  }
                  if (!data?.workflow) {
                    throw new Error(t("form.errors.unexpected"));
                  }
                  setWorkflow(data.workflow as N8nWorkflow);
                  setStatus(null);
                  setRaw(null);
                  setWorkflowSource("library");
                  setLibraryHit(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : t("form.errors.unexpected"));
                } finally {
                  setUseLibraryLoading(false);
                }
              }}
              disabled={useLibraryLoading}
              className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {useLibraryLoading
                ? t("form.librarySuggestion.loadingExisting")
                : t("form.librarySuggestion.useExisting")}
            </button>
            <button
              type="button"
              onClick={async () => {
                setLibraryHit(null);
                setIsSearchingLibrary(false);
                await runGeneration();
              }}
              className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {t("form.librarySuggestion.generateNew")}
            </button>
          </div>
        </div>
      ) : null}

      <aside className="space-y-3 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-white">
          {t("form.promptIdeas")}
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="text-left text-indigo-600 underline-offset-4 hover:underline"
                onClick={() => setPrompt(suggestion)}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
