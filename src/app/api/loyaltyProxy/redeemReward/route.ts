import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`http://localhost:3001/api/loyalty/redeemReward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Loyalty redeem proxy error:", err);
    return NextResponse.json({ error: "Failed to contact Loyalty System" }, { status: 500 });
  }
}
