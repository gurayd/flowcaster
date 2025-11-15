export async function detectMiniApp(): Promise<boolean> {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  if (userAgent.includes("Farcaster-Mini-App")) {
    return true;
  }

  if ("farcasterMiniApp" in navigator) {
    return true;
  }

  return false;
}
