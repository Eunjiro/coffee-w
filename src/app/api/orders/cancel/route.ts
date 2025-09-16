import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cancel an order
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to cancel order:", err);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
