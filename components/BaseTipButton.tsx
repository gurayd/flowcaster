"use client";

import { useCallback, useMemo, useState } from "react";
import { parseEther } from "viem";
import { useTranslations } from "next-intl";
import { base } from "wagmi/chains";
import { useAccount, useConnect, useSendTransaction } from "wagmi";

const TIP_ADDRESS = "0x86796a14774d06e18f5cb1c67c97f578e30bba02";
const TIP_VALUE = "0.005";

export function BaseTipButton() {
  const t = useTranslations();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const [status, setStatus] = useState<"idle" | "connecting" | "sending" | "success" | "error">("idle");
  const [tipMessage, setTipMessage] = useState<string | null>(null);

  const isBusy = status === "connecting" || status === "sending";

  const connector = useMemo(() => {
    return connectors.find((item) => item.id === "farcasterMiniApp") ?? connectors[0];
  }, [connectors]);

  const handleClick = useCallback(async () => {
    setTipMessage(null);
    try {
      if (!connector) {
        setTipMessage(t("form.tipUnavailable"));
        return;
      }

      if (!isConnected) {
        setStatus("connecting");
        await connectAsync({ connector });
      }

      setStatus("sending");
      await sendTransactionAsync({
        to: TIP_ADDRESS,
        value: parseEther(TIP_VALUE),
        chainId: base.id,
      });

      setStatus("success");
      setTipMessage(t("form.tipSuccess"));
      setTimeout(() => {
        setStatus("idle");
        setTipMessage(null);
      }, 2500);
    } catch (error) {
      console.error("Base tip failed", error);
      setStatus("error");
      setTipMessage(t("form.tipError"));
      setTimeout(() => {
        setStatus("idle");
      }, 2500);
    }
  }, [connectAsync, connector, isConnected, sendTransactionAsync, t]);

  const label =
    status === "connecting" || status === "sending"
      ? t("form.tipSending")
      : t("form.tipLabel");

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {label}
      </button>
      {tipMessage ? (
        <span
          className={`text-xs ${
            status === "error" ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {tipMessage}
        </span>
      ) : null}
    </div>
  );
}
