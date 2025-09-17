import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, orders_status } from "@prisma/client";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const dateRange = searchParams.get("dateRange") || "week";
  const status = searchParams.get("status") || "completed";

  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
      default:
        startDate = new Date(0);
        break;
    }

    // Determine status filter
    let statusFilter: Prisma.ordersWhereInput = {};
    if (status !== "all") {
      if (status === "completed") {
        statusFilter = { status: { in: [orders_status.PAID, orders_status.COMPLETED] } };
      } else {
        const upperStatus = status.toUpperCase() as keyof typeof orders_status;
        if (upperStatus in orders_status) {
          statusFilter = { status: orders_status[upperStatus] };
        }
      }
    }

    const orders = await prisma.orders.findMany({
      where: {
        ...statusFilter,
        createdAt: {
          gte: startDate,
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

    const transformedOrders = orders.map((order) => ({
      id: order.id.toString(),
      orderId: `#${order.id}`,
      customerName: order.users.name,
      items: order.orderitems.map((item) => ({
        name: item.menu.name,
        quantity: item.quantity,
        unitPrice:
          Number(item.sizes?.price || 0) +
          item.orderitemaddons.reduce((sum, addon) => sum + Number(addon.price), 0),
      })),
      total: Number(order.total),
      paymentMethod: order.paymentMethod?.toLowerCase() || "cash",
      status: order.status.toLowerCase(),
      timestamp: new Date(order.createdAt),
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
