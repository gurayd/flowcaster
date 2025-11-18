"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient();

type AppProvidersProps = {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
};

export function AppProviders({ children, messages, locale }: AppProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          messages={messages}
          locale={locale}
          timeZone="UTC" // Avoid ENVIRONMENT_FALLBACK warnings by keeping formatting deterministic.
        >
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
