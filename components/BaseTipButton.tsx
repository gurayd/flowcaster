"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseEther } from "viem";
import { base } from "wagmi/chains";
import { useAccount, useConnect, useSendTransaction } from "wagmi";

const TIP_ADDRESS = "0x86796a14774d06e18f5cb1c67c97f578e30bba02" as const;
const TIP_VALUE = "0.001";
const TIP_LINK = `https://pay.base.org/?to=${TIP_ADDRESS}&chain=base&value=${TIP_VALUE}`;

type TipState = "idle" | "connecting" | "sending" | "success" | "error";

export function BaseTipButton() {
  const t = useTranslations();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const [state, setState] = useState<TipState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const farcasterConnector = useMemo(() => {
    if (!connectors.length) {
      return null;
    }
    return connectors.find((item) => item.id === "farcasterMiniApp") ?? connectors[0];
  }, [connectors]);

  const resetLater = useCallback((delay = 2500) => {
    setTimeout(() => {
      setState("idle");
      setMessage(null);
    }, delay);
  }, []);

  const handleUnavailable = useCallback(() => {
    setState("error");
    setMessage(t("form.tipUnavailable"));
    resetLater();
  }, [resetLater, t]);

  const handleClick = useCallback(async () => {
    setMessage(null);

    if (!farcasterConnector) {
      handleUnavailable();
      return;
    }

    try {
      if (!isConnected) {
        setState("connecting");
        await connectAsync({ connector: farcasterConnector, chainId: base.id });
      }

      setState("sending");
      await sendTransactionAsync({
        chainId: base.id,
        to: TIP_ADDRESS,
        value: parseEther(TIP_VALUE),
      });

      setState("success");
      setMessage(t("form.tipSuccess"));
      resetLater();
    } catch (error) {
      console.error("Base tip failed", error);
      setState("error");

      if (error instanceof Error && /connector/i.test(error.message)) {
        setMessage(t("form.tipUnavailable"));
      } else {
        setMessage(t("form.tipError"));
      }
      resetLater();
    }
  }, [
    connectAsync,
    farcasterConnector,
    handleUnavailable,
    isConnected,
    resetLater,
    sendTransactionAsync,
    t,
  ]);

  const label =
    state === "connecting" || state === "sending"
      ? t("form.tipSending")
      : t("form.tipLabel");

  const isBusy = state === "connecting" || state === "sending";
  const isDisabled = isBusy || !farcasterConnector;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {label}
      </button>
      {!farcasterConnector ? (
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-500">{t("form.tipUnavailable")}</span>
          <a
            href={TIP_LINK}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-600 underline"
          >
            {t("form.tipFallbackLink")}
          </a>
        </div>
      ) : null}
      {message ? (
        <span
          className={`text-xs ${
            state === "error" ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
