import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Get today's revenue and orders
    const todayStats = await prisma.orders.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { 
        status: { in: ["PAID", "COMPLETED"] },
        createdAt: { gte: startOfDay }
      },
    });

    // Get total revenue and orders
    const totalStats = await prisma.orders.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { 
        status: { in: ["PAID", "COMPLETED"] }
      },
    });

    // Get completed orders count
    const completedOrders = await prisma.orders.count({
      where: { status: "COMPLETED" }
    });

    // Get pending orders count
    const pendingOrders = await prisma.orders.count({
      where: { status: "PENDING" }
    });

    const todayRevenue = Number(todayStats._sum.total || 0);
    const todayOrders = todayStats._count.id || 0;
    const totalRevenue = Number(totalStats._sum.total || 0);
    const totalOrders = totalStats._count.id || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      averageOrderValue,
      todayRevenue,
      todayOrders,
    });
  } catch (error) {
    console.error("Error fetching cashier dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
