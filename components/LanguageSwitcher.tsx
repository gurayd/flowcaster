"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales } from "@/i18n/config";

export default function LanguageSwitcher() {
  return (
    <Suspense fallback={<div className="flex gap-2 text-sm text-zinc-500">…</div>}>
      <LanguageSwitcherContent />
    </Suspense>
  );
}

function LanguageSwitcherContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = locales.includes(segments[0] as typeof locales[number]);
  const currentLocale = hasLocale ? segments[0] : "en";
  const restSegments = hasLocale ? segments.slice(1) : segments;

  const queryString = searchParams.toString();
  const suffix = restSegments.length ? `/${restSegments.join("/")}` : "";
  const qs = queryString ? `?${queryString}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {locales.map((locale) => {
        const href = `/${locale}${suffix}${qs}`.replace(/\/+/g, "/");
        const isActive = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={href}
            className={
              isActive
                ? "font-semibold underline"
                : "opacity-60 transition hover:opacity-100"
            }
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
