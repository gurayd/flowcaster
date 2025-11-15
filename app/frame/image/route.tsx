import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Flowcaster";
  const subtitle =
    searchParams.get("subtitle") ??
    "Describe automations → receive validated n8n JSON.";
  const badge = searchParams.get("badge");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#050505",
          color: "#f5f5f5",
          fontSize: 40,
          padding: "80px 100px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Geist, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 48, fontWeight: 600 }}>Flowcaster</div>
          {badge ? (
            <div
              style={{
                border: "1px solid #f5f5f5",
                padding: "6px 18px",
                borderRadius: 999,
                fontSize: 24,
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 58, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 34, color: "#d1d5db", marginTop: 16 }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#9ca3af",
            display: "flex",
            gap: 20,
          }}
        >
          <div>n8n validated JSON</div>
          <div>Farcaster frame native</div>
          <div>Base tips ready</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
