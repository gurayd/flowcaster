"use client";

import { parseEther } from "viem";
import { useAccount, useConnect, useSendTransaction } from "wagmi";

const TIP_ADDRESS = "0x86796a14774d06e18f5cb1c67c97f578e30bba02";

export function BaseTipButton() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendTransaction, isPending } = useSendTransaction();

  const handleClick = async () => {
    if (!isConnected) {
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
      }
      return;
    }

    await sendTransaction({
      to: TIP_ADDRESS,
      value: parseEther("0.005"),
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
    >
      {isPending ? "Preparing tip..." : "Send 0.005 ETH via Base"}
    </button>
  );
}
