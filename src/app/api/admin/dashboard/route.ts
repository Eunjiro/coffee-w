import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Type for best seller item
type BestSeller = {
  menuId: number;
  _sum: { quantity: number };
};

type RecentOrder = {
  id: number;
  total: number;
  createdAt: Date;
  users?: { name: string };
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "today";

  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total sales
  const [salesToday, salesWeek, salesMonth] = await Promise.all([
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: "PAID", createdAt: { gte: startOfDay } },
    }),
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: "PAID", createdAt: { gte: startOfWeek } },
    }),
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
    }),
  ]);

  // Orders count
  const [ordersToday, ordersWeek, ordersMonth] = await Promise.all([
    prisma.orders.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.orders.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.orders.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  // Best sellers helper
  const getBestSellers = async (start: Date) => {
    const items = await prisma.orderitems.groupBy({
      by: ["menuId"],
      where: { createdAt: { gte: start } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 3,
    });

    return Promise.all(
      items.map(async (item) => {
        const menu = await prisma.menu.findUnique({ where: { id: item.menuId } });
        return { id: item.menuId, name: menu?.name, sold: item._sum?.quantity ?? 0 };
      })
    );
  };


  const [bestToday, bestWeek, bestMonth] = await Promise.all([
    getBestSellers(startOfDay),
    getBestSellers(startOfWeek),
    getBestSellers(startOfMonth),
  ]);

  // Low stock
  const lowStock = await prisma.ingredients.findMany({
    where: { stock: { lte: prisma.ingredients.fields.threshold } },
    select: { id: true, name: true, stock: true, threshold: true },
    take: 10,
  });

  // Recent orders
  const recentOrdersRaw = await prisma.orders.findMany({
    where: { status: "PAID" },
    include: { 
      users: true,
      orderitems: {
        include: {
          menu: true,
          orderitemaddons: {
            include: {
              menu: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentOrders: any[] = recentOrdersRaw.map((order) => ({
    id: order.id,
    total: order.total.toNumber(), // convert Decimal -> number
    createdAt: order.createdAt,
    status: order.status.toLowerCase(),
    paymentMethod: order.paymentMethod?.toLowerCase() || "cash",
    items: order.orderitems.map((item: any) => ({
      name: item.menu.name,
      quantity: item.quantity,
      addons: item.orderitemaddons.map((addon: any) => addon.menu.name)
    })),
    users: order.users ? { name: order.users.name } : { name: "Guest" },
  }));


  // Sales overview for last 7 days
  const salesOverview: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const salesForDay = await prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: "PAID", createdAt: { gte: start, lte: end } },
    });

    salesOverview.push({
      date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: Number(salesForDay._sum.total || 0),
    });
  }

  return NextResponse.json({
    sales: {
      today: Number(salesToday._sum.total || 0),
      week: Number(salesWeek._sum.total || 0),
      month: Number(salesMonth._sum.total || 0),
    },
    orders: {
      today: ordersToday,
      week: ordersWeek,
      month: ordersMonth,
    },
    bestSellers: {
      today: bestToday,
      week: bestWeek,
      month: bestMonth,
    },
    lowStock: {
      today: lowStock,
      week: lowStock,
      month: lowStock,
    },
    recentOrders,
    salesOverview,
  });
}
