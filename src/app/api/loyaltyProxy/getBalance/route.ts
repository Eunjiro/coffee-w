import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phone = url.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Forward request to Loyalty System
    const res = await fetch(`http://localhost:3001/api/loyalty/getBalance?phone=${phone}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error || "Failed to fetch balance" }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error("Loyalty balance proxy error:", err);
    return NextResponse.json({ error: "Failed to contact Loyalty System" }, { status: 500 });
  }
}
