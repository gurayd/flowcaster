"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type WorkflowResponse = {
  id: string;
  workflow: unknown;
};

type FetchState = {
  data: WorkflowResponse | null;
  loading: boolean;
  error: string | null;
};

export default function WorkflowPage() {
  const t = useTranslations();
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-3xl flex-col gap-2 p-6">
          <h1 className="text-2xl font-semibold">{t("viewer.loading")}</h1>
          <p className="text-sm text-gray-600">{t("viewer.loading")}</p>
        </main>
      }
    >
      <WorkflowPageContent />
    </Suspense>
  );
}

function WorkflowPageContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";

  const [{ data, loading, error }, setState] = useState<FetchState>({
    data: null,
    loading: Boolean(id),
    error: null,
  });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const fallbackError = t("viewer.notFound");

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => {
        setState({ data: null, loading: false, error: null });
      });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    queueMicrotask(() => {
      setState({ data: null, loading: true, error: null });
    });

    fetch(`/api/workflow?id=${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          let message = `Request failed with status ${res.status}`;
          try {
            const body = await res.json();
            if (body?.error) {
              message = body.error;
            }
          } catch (err) {
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to parse error body", err);
            }
          }
          throw new Error(message);
        }
        return res.json();
      })
      .then((json: WorkflowResponse) => {
        if (!cancelled) {
          setState({ data: json, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : fallbackError;
          setState({ data: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fallbackError, id, t]);

  const workflow = data?.workflow ?? null;
  const jsonString = useMemo(
    () => (workflow ? JSON.stringify(workflow, null, 2) : ""),
    [workflow],
  );

  const handleCopy = async () => {
    if (!jsonString) {
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setCopyError(null);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopyError(t("viewer.copyError"));
    }
  };

  if (!id) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-2 p-6">
        <h1 className="text-2xl font-semibold">{t("viewer.notFound")}</h1>
        <p className="text-sm text-gray-600">{t("viewer.noId")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {(workflow as { name?: string } | null)?.name ?? t("title")}
        </h1>
        <p className="text-sm text-gray-500">
          {t("viewer.id")}: {id}
        </p>
      </header>

      {loading && (
        <p className="text-sm text-gray-600">{t("viewer.loading")}</p>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">{t("viewer.unavailableTitle")}</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && !workflow && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200">
          <p className="font-semibold">{t("viewer.unavailableTitle")}</p>
          <p>{t("viewer.unavailableBody")}</p>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("viewer.json")}</h2>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!workflow || loading}
            title={
              !workflow || loading
                ? t("viewer.copyDisabled")
                : t("viewer.copyTooltip")
            }
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {copied ? t("viewer.copied") : t("viewer.copy")}
          </button>
        </div>
        <pre className="max-h-[65vh] overflow-auto rounded bg-gray-900 p-4 text-xs text-green-100">
          {jsonString || t("viewer.noData")}
        </pre>
        {copyError && (
          <p className="text-xs text-red-500">{copyError}</p>
        )}
      </section>
    </main>
  );
}
