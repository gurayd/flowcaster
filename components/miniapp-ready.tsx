"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function MiniAppReady() {
  useEffect(() => {
    async function callReady() {
      try {
        await sdk.actions.ready();
      } catch (err) {
        console.error("MiniAppReady error:", err);
      }
    }
    callReady();
  }, []);

  return null;
}
