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

  // Total sales - count both PAID and COMPLETED orders
  const [salesToday, salesWeek, salesMonth] = await Promise.all([
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: startOfDay } },
    }),
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: startOfWeek } },
    }),
    prisma.orders.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: startOfMonth } },
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
    // Get orders with their items to calculate revenue
    const orders = await prisma.orders.findMany({
      where: { 
        createdAt: { gte: start },
        status: { in: ["PAID", "COMPLETED"] }
      },
      include: {
        orderitems: {
          include: {
            menu: true,
            sizes: true,
            orderitemaddons: {
              include: {
                menu: true
              }
            }
          }
        }
      }
    });

    // Group by menuId and calculate totals
    const itemMap = new Map<number, { name: string; sold: number; revenue: number }>();
    
    orders.forEach(order => {
      const orderTotal = Number(order.total);
      const totalQuantity = order.orderitems.reduce((sum, item) => sum + item.quantity, 0);
      
      order.orderitems.forEach(item => {
        // Calculate proportional revenue based on quantity
        const proportionalRevenue = totalQuantity > 0 ? (orderTotal * item.quantity) / totalQuantity : 0;
        
        if (itemMap.has(item.menuId)) {
          const existing = itemMap.get(item.menuId)!;
          existing.sold += item.quantity;
          existing.revenue += proportionalRevenue;
        } else {
          itemMap.set(item.menuId, {
            name: item.menu.name,
            sold: item.quantity,
            revenue: proportionalRevenue
          });
        }
      });
    });

    // Convert to array and sort by quantity sold
    return Array.from(itemMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);
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
    where: { status: { in: ["PAID", "COMPLETED"] } },
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
      where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: start, lte: end } },
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
