"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseUnits } from "viem";
import { base } from "wagmi/chains";
import { useAccount, useConnect, useWriteContract } from "wagmi";

const TIP_RECIPIENT = "0x86796a14774d06e18f5cb1c67c97f578e30bba02" as const;
const USDC_BASE_ADDRESS = "0x833589fCD6EDB6e08f4c7C32D4f71b54bDa02913" as const;
const USDC_DECIMALS = 6;
const TIP_LINK = `https://pay.base.org/?chain=base&token=${USDC_BASE_ADDRESS}&amount=1&to=${TIP_RECIPIENT}`;

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type TipState = "idle" | "connecting" | "sending" | "success" | "error";

export function BaseTipButton() {
  const t = useTranslations();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { writeContractAsync } = useWriteContract();
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
      const amount = parseUnits("1", USDC_DECIMALS);
      await writeContractAsync({
        chainId: base.id,
        address: USDC_BASE_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [TIP_RECIPIENT, amount],
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
    writeContractAsync,
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
