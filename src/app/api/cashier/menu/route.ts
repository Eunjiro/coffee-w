import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MenuItem } from "@/types/types";

export async function GET() {
  try {
    // Fetch all menu items with their sizes and ingredients/addons
    const menus = await prisma.menu.findMany({
      where: { status: "AVAILABLE" },
      include: {
        sizes: true,
        recipes: {
          include: {
            recipeingredients: {
              include: { ingredients: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Map to your MenuItem type
    const menuItems: MenuItem[] = menus.map(menu => ({
      id: menu.id,
      name: menu.name,
      type: menu.type as MenuItem["type"],
      status: menu.status === "AVAILABLE" ? "Available" : "Unavailable",
      image: menu.image || undefined,
      sizes: menu.sizes.map(size => ({
        id: size.id,
        label: size.label,
        price: Number(size.price),
      })),
      addons: menu.recipes.flatMap(recipe =>
        recipe.recipeingredients.map(ri => ({
          id: ri.ingredients.id,
          name: ri.ingredients.name,
          price: 0,
        }))
      ),
    }));

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching cashier menu:", error);
    return NextResponse.json([], { status: 500 });
  }
}
