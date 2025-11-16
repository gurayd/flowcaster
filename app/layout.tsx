import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getPublicBaseUrl } from "@/lib/env";

const siteUrl = getPublicBaseUrl();
const embedImageUrl = `${siteUrl}/image.png`;
const splashImageUrl = `${siteUrl}/splash.png`;

const embedTargetUrl = "https://flowcaster.vercel.app";

const buildEmbedPayload = (actionType: "launch_miniapp" | "launch_frame") =>
  JSON.stringify({
    version: "1",
    imageUrl: embedImageUrl,
    button: {
      title: "Generate flow",
      action: {
        type: actionType,
        name: "Flowcaster",
        url: embedTargetUrl,
        splashImageUrl,
        splashBackgroundColor: "#444444",
      },
    },
  });

const miniappEmbed = buildEmbedPayload("launch_miniapp");
const frameEmbed = buildEmbedPayload("launch_frame");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flowcaster",
  description:
    "Farcaster frame + web client that turns natural language into n8n workflows with Base micro tips.",
  metadataBase: new URL(siteUrl),
  other: {
    "fc:miniapp": miniappEmbed,
    "fc:frame": frameEmbed,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
