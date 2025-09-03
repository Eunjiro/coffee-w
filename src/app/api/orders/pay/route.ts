import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Mark order as PAID
    const order = await prisma.orders.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
      include: {
        orderitems: {
          include: {
            menu: true,
            orderitemaddons: true,
          },
        },
      },
    });

    // Update stock for each order item
    for (const item of order.orderitems) {
      // Find recipe ingredients
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

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Failed to mark order as paid:", err);
    return NextResponse.json({ error: "Failed to mark order as paid" }, { status: 500 });
  }
}
