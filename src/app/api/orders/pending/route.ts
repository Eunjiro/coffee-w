import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.orders.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        orderitems: {
          include: {
            menu: true,
            orderitemaddons: {
              include: {
                menu: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("Fetching pending orders error:", err);
    return NextResponse.json({ error: "Failed to fetch pending orders" }, { status: 500 });
  }
}
