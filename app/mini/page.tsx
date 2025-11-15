"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { detectMiniApp } from "@/lib/miniapp";

export default function MiniHome() {
  const [isMini, setIsMini] = useState(false);

  useEffect(() => {
    detectMiniApp().then(setIsMini).catch(() => setIsMini(false));
  }, []);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-purple-500">
          {isMini ? "Farcaster Mini App" : "Web experience"}
        </p>
        <h1 className="text-3xl font-bold">Flowcaster Mini App</h1>
        <p className="text-base opacity-70">
          Generate automation workflows directly inside Farcaster.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Link
          href="/frame"
          className="block rounded-lg bg-black px-4 py-3 text-center text-white hover:bg-gray-900"
        >
          Open Workflow Generator
        </Link>

        <Link
          href="/"
          className="block rounded-lg bg-gray-100 px-4 py-3 text-center text-black hover:bg-gray-200"
        >
          View Recent Workflows
        </Link>

        <Link
          href="/w"
          className="block rounded-lg bg-gray-100 px-4 py-3 text-center text-black hover:bg-gray-200"
        >
          View Workflow by ID
        </Link>

        <a
          href="https://docs.base.org/get-started/build-app"
          target="_blank"
          rel="noreferrer"
          className="block rounded-lg border border-gray-200 px-4 py-3 text-center text-sm text-gray-600 hover:border-gray-300"
        >
          About Flowcaster Mini
        </a>
      </div>
    </main>
  );
}
