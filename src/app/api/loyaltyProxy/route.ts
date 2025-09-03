import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { orderRef, customerPhone, totalAmount, items } = body;
    if (!customerPhone || !orderRef || !totalAmount || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const loyaltyRes = await fetch("http://localhost:3001/api/loyalty/addPoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderRef, customerPhone, totalAmount, items }),
    });

    const data = await loyaltyRes.json();

    if (!loyaltyRes.ok || data.error) {
      return NextResponse.json({ error: data.error || "Loyalty system failed" }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error("Loyalty proxy error:", err);
    return NextResponse.json({ error: "Failed to contact Loyalty System" }, { status: 500 });
  }
}
