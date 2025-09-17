import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import type { orders_paymentMethod } from "@prisma/client";

// --- Types ---
interface CartAddon {
  id: number;
  price: number;
}

interface CartItem {
  id: number;
  quantity: number;
  price: number;
  selectedSize?: { id: number };
  selectedAddons?: CartAddon[];
}

interface OrderRequestBody {
  cartItems: CartItem[];
  paymentMethod: orders_paymentMethod | string;
  appliedReward?: { amount: number };
}

// --- CREATE Order ---
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : 2;

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { cartItems, paymentMethod, appliedReward }: OrderRequestBody = await req.json();

    if (!cartItems?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.id || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: "Invalid cart item", details: item },
          { status: 400 }
        );
      }
    }

    const baseTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = appliedReward?.amount ? Number(appliedReward.amount) : 0;
    const total = Math.max(baseTotal - discount, 0);

    const order = await prisma.orders.create({
      data: {
        userId,
        baseTotal,
        total,
        status: "PENDING",
        paymentMethod: paymentMethod as orders_paymentMethod,
        orderitems: {
          create: cartItems.map(item => ({
            menuId: item.id,
            quantity: item.quantity,
            sizeId: item.selectedSize?.id || null,
            ...(item.selectedAddons?.length
              ? {
                orderitemaddons: {
                  create: item.selectedAddons.map(addon => ({
                    addonId: addon.id,
                    price: addon.price,
                  })),
                },
              }
              : {}),
          })),
        },
      },
      include: {
        orderitems: { include: { orderitemaddons: true, menu: true, sizes: true } },
      },
    });

    return NextResponse.json({ success: true, orderRef: order.id });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : "UnknownError",
      },
      { status: 500 }
    );
  }
}

// --- GET Orders ---
export async function GET() {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orderitems: {
          include: {
            menu: true,
            sizes: true,
            orderitemaddons: { include: { menu: true } },
          },
        },
        users: true,
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch orders", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// --- POST_COMPLETE ---
export async function POST_COMPLETE(req: Request) {
  try {
    const { orderId }: { orderId: number } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// --- POST_PAY ---
export async function POST_PAY(req: Request) {
  try {
    const { orderId }: { orderId: number } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
      include: {
        orderitems: { include: { menu: true, orderitemaddons: true } },
      },
    });

    for (const item of order.orderitems) {
      const recipes = await prisma.recipes.findMany({
        where: { menuId: item.menuId, ...(item.sizeId && { sizeId: item.sizeId }) },
        include: { recipeingredients: true },
      });

      for (const recipe of recipes) {
        for (const ri of recipe.recipeingredients) {
          await prisma.ingredients.update({
            where: { id: ri.ingredientId },
            data: {
              stock: { decrement: (Number(ri.qtyNeeded) || 0) * (Number(item.quantity) || 0) },
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to mark order as paid", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// --- POST_CANCEL ---
export async function POST_CANCEL(req: Request) {
  try {
    const { orderId }: { orderId: number } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to cancel order", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
