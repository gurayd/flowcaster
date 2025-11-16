"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALES = ["en", "es", "it", "tr", "zh", "hi"] as const;

export default function LanguageSwitcher() {
  const path = usePathname();
  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasLocale = LOCALES.includes(firstSegment as typeof LOCALES[number]);
  const currentLocale = hasLocale ? firstSegment : "en";
  const restSegments = hasLocale ? segments.slice(1) : segments;
  const restPath = restSegments.join("/");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {LOCALES.map((loc) => {
        const suffix = restPath ? `/${restPath}` : "";
        const href = `/${loc}${suffix}`;
        const isActive = loc === currentLocale;
        return (
          <Link
            key={loc}
            href={href}
            className={
              isActive
                ? "font-semibold underline"
                : "opacity-60 transition hover:opacity-100"
            }
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
