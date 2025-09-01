import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        users: true, // user info
        orderitems: {
          include: {
            menu: true,       // menu item info
            sizes: true,      // size info
            orderitemaddons: {
              include: {
                menu: true,   // addon info
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
