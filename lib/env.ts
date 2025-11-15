const PROD_BASE_URL = "https://flowcaster-ljnjvinir-gurayds-projects.vercel.app";

export function getPublicBaseUrl(): string {
  const explicitBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicitBase) {
    return stripTrailingSlash(explicitBase);
  }

  const legacyBase = process.env.NEXT_PUBLIC_FLOWCASTER_BASE_URL?.trim();
  if (legacyBase) {
    return stripTrailingSlash(legacyBase);
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const protocol = vercelUrl.startsWith("http") ? "" : "https://";
    return `${protocol}${vercelUrl.replace(/\/$/, "")}`;
  }

  return PROD_BASE_URL;
}

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
