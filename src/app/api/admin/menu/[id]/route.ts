import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { menu_type, menu_status } from "@prisma/client";

interface IngredientInput {
  ingredientId: number;
  quantity: number;
}

interface SizeInput {
  label: string;
  price: number;
  ingredients: IngredientInput[];
}

interface MenuInput {
  name: string;
  image: string;
  type: menu_type;
  status: menu_status;
  category?: string;
  sizes: SizeInput[];
}

interface IngredientItem {
  ingredientId: number | null;
  quantity: number;
  recipeId: number;
  sizeId: number;
}

// GET single menu
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menuId = Number(id);
    if (isNaN(menuId)) throw new Error("Invalid menu ID");

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        sizes: {
          include: {
            recipes: {
              include: {
                recipeingredients: { include: { ingredients: true } },
              },
            },
          },
        },
      },
    });

    if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });

    const result = {
      ...menu,
      sizes: (menu.sizes || []).map(size => ({
        ...size,
        recipes: (size.recipes || []).map(recipe => ({
          ...recipe,
          recipeingredients: (recipe.recipeingredients || []).map(ri => ({
            id: ri.ingredients?.id ?? null,
            name: ri.ingredients?.name ?? "Unknown",
            quantity: ri.qtyNeeded ?? 0,
            recipeId: recipe.id,
            sizeId: size.id,
          })),
        })),
      })),
      ingredients: {
        small: [] as IngredientItem[],
        medium: [] as IngredientItem[],
        large: [] as IngredientItem[],
      },
    };

    (menu.sizes || []).forEach(size => {
      const key = size.label.toLowerCase() as "small" | "medium" | "large";
      size.recipes.forEach(recipe => {
        recipe.recipeingredients.forEach(ri => {
          result.ingredients[key].push({
            ingredientId: ri.ingredients?.id ?? null,
            quantity: Number(ri.qtyNeeded ?? 0),
            recipeId: recipe.id,
            sizeId: size.id,
          });
        });
      });
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /menu/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch menu" }, { status: 500 });
  }
}

// PUT: update menu
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menuId = Number(id);
    if (isNaN(menuId)) throw new Error("Invalid menu ID");

    const data: MenuInput = await req.json();

    // Delete old sizes & recipes
    const sizeIds = (await prisma.sizes.findMany({ where: { menuId }, select: { id: true } })).map(s => s.id);
    if (sizeIds.length) await prisma.recipes.deleteMany({ where: { sizeId: { in: sizeIds } } });
    await prisma.sizes.deleteMany({ where: { menuId } });

    // Update menu core fields
    await prisma.menu.update({
      where: { id: menuId },
      data: {
        name: data.name,
        image: data.image ?? "",
        type: data.type,
        status: data.status,
        category: data.category ?? null,
      },
    });

    // Recreate sizes & recipes
    for (const s of data.sizes) {
      const size = await prisma.sizes.create({ data: { label: s.label, price: s.price, menuId } });

      if (Array.isArray(s.ingredients) && s.ingredients.length) {
        await prisma.recipes.create({
          data: {
            name: `Recipe for ${s.label}`,
            menuId,
            sizeId: size.id,
            recipeingredients: {
              create: s.ingredients
                .filter(i => i.ingredientId && i.quantity)
                .map(i => ({
                  ingredientId: i.ingredientId,
                  qtyNeeded: i.quantity, // <-- FIX here
                })),
            },
          },
        });
      }
    }

    const fullMenu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        sizes: {
          include: {
            recipes: {
              include: { recipeingredients: { include: { ingredients: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json(fullMenu ?? []);
  } catch (err: any) {
    console.error("PUT /menu/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update menu" }, { status: 500 });
  }
}

// DELETE menu
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menuId = Number(id);
    if (isNaN(menuId)) throw new Error("Invalid menu ID");

    const sizeIds = (await prisma.sizes.findMany({ where: { menuId }, select: { id: true } })).map(s => s.id);
    if (sizeIds.length) await prisma.recipes.deleteMany({ where: { sizeId: { in: sizeIds } } });
    await prisma.sizes.deleteMany({ where: { menuId } });
    await prisma.menu.delete({ where: { id: menuId } });

    return NextResponse.json({ message: "Menu deleted" });
  } catch (err: any) {
    console.error("DELETE /menu/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete menu" }, { status: 500 });
  }
}
