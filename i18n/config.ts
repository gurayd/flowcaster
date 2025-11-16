export const locales = ["en", "es", "it", "tr", "zh", "hi"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localePrefix = "always" as const;
