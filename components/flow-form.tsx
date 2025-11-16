"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { N8nWorkflow } from "@/lib/schema";
import { useTranslations } from "next-intl";

const defaultMock = process.env.NEXT_PUBLIC_FLOWCASTER_MOCK === "true";

type GenerateStatus = {
  repairAttempted?: boolean;
  mocked?: boolean;
};

export function FlowForm() {
  const t = useTranslations();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [status, setStatus] = useState<GenerateStatus | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [tipUrl, setTipUrl] = useState<string | null>(null);
  const [mock, setMock] = useState(defaultMock);

  useEffect(() => {
    async function fetchTip() {
      try {
        const response = await fetch("/api/tip-intent");
        if (!response.ok) return;
        const data = await response.json();
        setTipUrl(data.url);
      } catch {
        // ignore missing tip config in dev
      }
    }
    fetchTip();
  }, []);

  const suggestions = useMemo(() => {
    const raw = t.raw("form.suggestions");
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!prompt.trim()) {
        setError(t("form.errors.promptRequired"));
        return;
      }
      setLoading(true);
      setError(null);
      setWorkflow(null);
      setStatus(null);
      setRaw(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : t("form.errors.unexpected"));
      } finally {
        setLoading(false);
      }
    },
    [prompt, mock, t],
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
          {tipUrl ? (
            <a
              href={tipUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
            >
              {t("form.tipLink")}
            </a>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? t("form.loading") : t("form.submit")}
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
            </div>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-900">
              {workflow.triggerMode}
            </span>
          </div>
          <details className="rounded-xl bg-white/70 p-3 dark:bg-zinc-900/70">
            <summary className="cursor-pointer text-sm font-medium text-indigo-500">
              {t("form.viewJson")}
            </summary>
            <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl bg-zinc-900/90 p-4 text-xs text-indigo-100">
              {raw ?? JSON.stringify(workflow, null, 2)}
            </pre>
          </details>
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
