import { FlowForm } from "@/components/flow-form";
import { MiniAppReady } from "@/components/miniapp-ready";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 py-16 font-sans text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-black dark:text-white">
      {/* Farcaster Mini App: remove splash immediately */}
      <MiniAppReady />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <span>{t("nav.language")}</span>
            <LanguageSwitcher />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            {t("title")}
          </p>
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
            {t("tagline")}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {t("form.description")}
          </p>
        </div>
        <div className="flex-1">
          <FlowForm />
        </div>
      </div>
    </main>
  );
}
