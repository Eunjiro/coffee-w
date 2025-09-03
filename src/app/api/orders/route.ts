import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Use session user ID if available, fallback to default cashier ID (2)
    const userId = session?.user?.id ? Number(session.user.id) : 2;

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { cartItems, paymentMethod, appliedReward } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    // Compute baseTotal (sum of all items without discount)
    const baseTotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Default: no discount
    let discount = 0;

    // If reward applied, use it
    if (appliedReward?.amount) {
      discount = Number(appliedReward.amount);
    }

    // Final total after discount
    const total = Math.max(baseTotal - discount, 0);

    // Create order with items and addons
    const order = await prisma.orders.create({
      data: {
        userId,
        baseTotal, // 👈 new field
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
                create: item.selectedAddons.map((addon: any) => ({
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

    // Deduct stock from ingredients
    for (const item of order.orderitems) {
      const recipes = await prisma.recipes.findMany({
        where: { menuId: item.menuId, ...(item.sizeId && { sizeId: item.sizeId }) },
        include: { recipeingredients: true },
      });

      for (const recipe of recipes) {
        for (const ri of recipe.recipeingredients) {
          await prisma.ingredients.update({
            where: { id: ri.ingredientId },
            data: { stock: { decrement: Number(ri.qtyNeeded) * item.quantity } },
          });
        }
      }
    }

    return NextResponse.json({ success: true, orderRef: order.id });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
