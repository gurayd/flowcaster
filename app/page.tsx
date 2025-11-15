import { FlowForm } from "@/components/flow-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 py-16 font-sans text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Farcaster Frame + n8n
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            Flowcaster turns natural language into deploy-ready n8n workflows.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            Use the standalone form or drop into the Farcaster frame at{" "}
            <code className="rounded bg-zinc-900/10 px-2 py-1 text-base">
              /frame
            </code>
            . Auto-validation happens with Zod, and we auto-repair malformed JSON
            before sharing a Base micro-tip link.
          </p>
          <div className="divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white/70 shadow-lg dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60">
            {[
              "Farcaster frame metadata & POST workflow state",
              "OpenAI-powered n8n JSON generation + repair",
              "Optional deployment into n8n REST API",
            ].map((item) => (
              <p
                key={item}
                className="p-4 text-sm text-zinc-700 dark:text-zinc-200"
              >
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <FlowForm />
        </div>
      </div>
    </main>
  );
}
