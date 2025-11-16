import { FlowForm } from "@/components/flow-form";
import { MiniAppReady } from "@/components/miniapp-ready";

export default function HomePage() {
  return (
    <main>
      {/* Farcaster Mini App: remove splash immediately */}
      <MiniAppReady />

      <FlowForm />
    </main>
  );
}
