"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

type AppProvidersProps = {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
};

export function AppProviders({ children, messages, locale }: AppProvidersProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </WagmiConfig>
  );
}
