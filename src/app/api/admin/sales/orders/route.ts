import { NextResponse } from "next/server";
import { PrismaClient, orders_status } from "@prisma/client";  // Import orders_status enum from Prisma

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const dateRange = searchParams.get('dateRange') || 'week';
  const status = searchParams.get('status') || 'completed'; // Default to 'completed'

  // Cast status to the orders_status enum safely
  const validStatus = orders_status[status.toUpperCase() as keyof typeof orders_status] || orders_status.COMPLETED;

  try {
    const orders = await prisma.orders.findMany({
      where: {
        status: validStatus, // Use the enum value here
        createdAt: {
          gte: new Date(), // Add proper date logic based on dateRange
        },
      },
      include: {
        users: true,
        orderitems: {
          include: {
            menu: true,
            sizes: true,
            orderitemaddons: {
              include: {
                menu: true,
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
