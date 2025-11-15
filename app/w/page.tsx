"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-3xl flex-col gap-2 p-6">
          <h1 className="text-2xl font-semibold">Loading flow…</h1>
          <p className="text-sm text-gray-600">Fetching workflow details.</p>
        </main>
      }
    >
      <WorkflowPageContent />
    </Suspense>
  );
}

function WorkflowPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";

  const [{ data, loading, error }, setState] = useState<FetchState>({
    data: null,
    loading: Boolean(id),
    error: null,
  });
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setState({ data: null, loading: true, error: null });

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
            err instanceof Error ? err.message : "Failed to load workflow";
          setState({ data: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id]);

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
      setCopyError("Could not copy JSON to clipboard.");
    }
  };

  if (!id) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-2 p-6">
        <h1 className="text-2xl font-semibold">Flow not found</h1>
        <p className="text-sm text-gray-600">No workflow id was provided.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          {(workflow as { name?: string } | null)?.name ?? "Workflow"}
        </h1>
        <p className="text-sm text-gray-500">ID: {id}</p>
      </header>

      {loading && <p className="text-sm text-gray-600">Loading workflow...</p>}

      {!loading && error && (
        <p className="text-sm text-red-600">Error: {error}</p>
      )}

      {!loading && !error && workflow && (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Workflow JSON</h2>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
            <pre className="max-h-[65vh] overflow-auto rounded bg-gray-900 p-4 text-xs text-green-100">
              {jsonString}
            </pre>
            {copyError && (
              <p className="text-xs text-red-500">{copyError}</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
