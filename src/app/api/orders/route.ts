import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Create a new order and deduct stock from ingredients
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : 2;

    console.log("Session:", session);
    console.log("User ID:", userId);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { cartItems, paymentMethod, appliedReward } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.id || !item.quantity || !item.price) {
        return NextResponse.json(
          {
            error: "Invalid cart item",
            details: `Missing required fields for item: ${JSON.stringify(item)}`,
          },
          { status: 400 }
        );
      }
    }

    const baseTotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;
    if (appliedReward?.amount) {
      discount = Number(appliedReward.amount);
    }

    const total = Math.max(baseTotal - discount, 0);

    const order = await prisma.orders.create({
      data: {
        userId,
        baseTotal,
        total,
        status: "PENDING",
        paymentMethod,
        orderitems: {
          create: cartItems.map((item: any) => ({
            menuId: item.id,
            quantity: item.quantity,
            sizeId: item.selectedSize?.id || null,
            ...(item.selectedAddons?.length > 0 && {
              orderitemaddons: {
                create: item.selectedAddons
                  .filter(
                    (addon: any) =>
                      addon.id && addon.id > 0 && addon.price > 0
                  )
                  .map((addon: any) => ({
                    addonId: addon.id,
                    price: addon.price,
                  })),
              },
            }),
          })),
        },
      },
      include: {
        orderitems: {
          include: { orderitemaddons: true, menu: true, sizes: true },
        },
      },
    });

    // Inventory reduction handled only when order is PAID
    return NextResponse.json({ success: true, orderRef: order.id });
  } catch (err) {
    console.error("Order creation error:", err);
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

// Get all orders for cashier
export async function GET() {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orderitems: {
          include: {
            menu: true,
            sizes: true,
            orderitemaddons: {
              include: { menu: true },
            },
          },
        },
        users: true,
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("Fetching orders error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// Mark an order as completed
export async function POST_COMPLETE(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId" },
        { status: 400 }
      );
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to mark order as completed:", err);
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

// Mark an order as paid and handle stock updates
export async function POST_PAY(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID required" },
        { status: 400 }
      );
    }

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
      include: {
        orderitems: {
          include: { menu: true, orderitemaddons: true },
        },
      },
    });

    // Update stock for each order item
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
              stock: { decrement: Number(ri.qtyNeeded) * item.quantity },
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Failed to mark order as paid:", err);
    return NextResponse.json(
      {
        error: "Failed to mark order as paid",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// Cancel an order
export async function POST_CANCEL(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID required" },
        { status: 400 }
      );
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to cancel order:", err);
    return NextResponse.json(
      {
        error: "Failed to cancel order",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
