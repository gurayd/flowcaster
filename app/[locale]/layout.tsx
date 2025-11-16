import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { locales, type AppLocale } from "@/i18n/config";
import type { IntlMessages } from "@/i18n/messages";
import { AppProviders } from "@/components/AppProviders";

async function loadMessages(locale: AppLocale): Promise<IntlMessages> {
  try {
    return (await import(`@/locales/${locale}.json`)).default;
  } catch {
    notFound();
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as AppLocale;
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await loadMessages(locale);

  return (
    <AppProviders locale={locale} messages={messages}>
      {children}
    </AppProviders>
  );
}
