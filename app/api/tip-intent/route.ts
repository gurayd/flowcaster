import { NextResponse } from "next/server";

const MICRO_TIP_VALUE = "0.0005";

export async function GET() {
  const address = process.env.BASE_TIP_ADDRESS;

  if (!address) {
    return NextResponse.json(
      { error: "BASE_TIP_ADDRESS is not configured" },
      { status: 500 },
    );
  }

  const url = `https://pay.base.org/?to=${encodeURIComponent(address)}&chain=base&value=${MICRO_TIP_VALUE}`;

  return NextResponse.json({
    url,
    chain: "base",
    value: MICRO_TIP_VALUE,
  });
}
