"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const VISIBLE_LOCALES = [
  { code: "en", label: "🇬🇧" },
  { code: "tr", label: "🇹🇷" },
  { code: "it", label: "🇮🇹" },
] as const;

export default function LanguageSwitcher() {
  return (
    <Suspense fallback={<div className="flex gap-2 text-sm text-zinc-500" />}>
      <LanguageSwitcherContent />
    </Suspense>
  );
}

function LanguageSwitcherContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = VISIBLE_LOCALES.some(
    (item) => item.code === segments[0],
  )
    ? segments[0]
    : "en";
  const restSegments =
    currentLocale === segments[0] ? segments.slice(1) : segments;

  const suffix = restSegments.length ? `/${restSegments.join("/")}` : "";
  const qs = searchParams.toString();
  const queryString = qs ? `?${qs}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {VISIBLE_LOCALES.map(({ code, label }) => {
        const href = `/${code}${suffix}${queryString}`.replace(/\/+/g, "/");
        const isActive = code === currentLocale;

        return (
          <Link
            key={code}
            href={href}
            aria-label={code}
            className={`rounded border px-2 py-1 text-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              isActive ? "font-semibold" : "opacity-70"
            }`}
          >
            <span role="img" aria-hidden="true">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
