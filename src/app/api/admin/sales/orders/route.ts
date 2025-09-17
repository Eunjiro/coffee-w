import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const dateRange = searchParams.get('dateRange') || 'week';
  const status = searchParams.get('status') || 'completed';

  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // All time
        break;
    }

    // Determine status filter
    let statusFilter: any = {};
    if (status !== 'all') {
      if (status === 'completed') {
        statusFilter = { status: { in: ['PAID', 'COMPLETED'] } };
      } else {
        statusFilter = { status: status.toUpperCase() };
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

    // Transform the data to match the expected format
    const transformedOrders = orders.map(order => ({
      id: order.id.toString(),
      orderId: `#${order.id}`,
      customerName: order.users.name,
      items: order.orderitems.map(item => ({
        name: item.menu.name,
        quantity: item.quantity,
        unitPrice: Number(item.sizes?.price || 0) + item.orderitemaddons.reduce((sum, addon) => sum + Number(addon.price), 0),
      })),
      total: Number(order.total),
      paymentMethod: order.paymentMethod?.toLowerCase() || 'cash',
      status: order.status.toLowerCase(),
      timestamp: new Date(order.createdAt),
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
