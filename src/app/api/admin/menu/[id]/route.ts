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

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred";
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

    // Normalize sizes to plain JSON-safe values (avoid Prisma Decimal objects)
    const sizes = (menu.sizes || []).map((size) => ({
      id: size.id,
      label: size.label,
      price: Number(size.price ?? 0),
      cupId: size.cupId ?? null,
    }));

    const result = {
      id: menu.id,
      name: menu.name,
      image: menu.image ?? "",
      type: menu.type,
      status: menu.status,
      category: menu.category ?? null,
      sizes,
      ingredients: {
        small: [] as IngredientItem[],
        medium: [] as IngredientItem[],
        large: [] as IngredientItem[],
      },
    };

    (menu.sizes || []).forEach(size => {
      const label = (size.label || "").toLowerCase();
      if (label !== "small" && label !== "medium" && label !== "large") {
        return; // ignore non-standard labels like Single (addon)
      }
      const key = label as "small" | "medium" | "large";
      (size.recipes || []).forEach((recipe) => {
        (recipe.recipeingredients || []).forEach((ri) => {
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
  } catch (err: unknown) {
    console.error("GET /menu/[id] error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// PUT: update menu
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menuId = Number(id);
    if (isNaN(menuId)) throw new Error("Invalid menu ID");

    const data: MenuInput = await req.json();

    // Normalize label helper
    const normalizeLabel = (label: string) =>
      label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

    await prisma.$transaction(async (tx) => {
      // Update base menu fields first
      await tx.menu.update({
        where: { id: menuId },
        data: {
          name: data.name,
          image: data.image ?? "",
          type: data.type,
          status: data.status,
          category: data.category ?? null,
        },
      });

      // Map existing sizes by lowercase label
      const existingSizes = await tx.sizes.findMany({
        where: { menuId },
        select: { id: true, label: true },
      });
      const existingByLabel = new Map(
        existingSizes.map((s) => [s.label.toLowerCase(), s])
      );

      // Upsert sizes and replace recipes for each provided size
      for (const s of data.sizes) {
        const normalizedLabel = normalizeLabel(s.label);
        const key = normalizedLabel.toLowerCase();
        const existing = existingByLabel.get(key);

        let sizeId: number;
        if (existing) {
          const updated = await tx.sizes.update({
            where: { id: existing.id },
            data: { label: normalizedLabel, price: s.price },
          });
          sizeId = updated.id;
        } else {
          const created = await tx.sizes.create({
            data: { label: normalizedLabel, price: s.price, menuId },
          });
          sizeId = created.id;
        }

        // Replace recipes for this size
        await tx.recipes.deleteMany({ where: { menuId, sizeId } });
        if (Array.isArray(s.ingredients) && s.ingredients.length) {
          await tx.recipes.create({
            data: {
              name: `Recipe for ${normalizedLabel}`,
              menuId,
              sizeId,
              recipeingredients: {
                create: s.ingredients
                  .filter((i) => i.ingredientId && i.quantity)
                  .map((i) => ({ ingredientId: i.ingredientId, qtyNeeded: i.quantity })),
              },
            },
          });
        }
      }

      // Remove sizes absent from payload only if not referenced by orders
      const payloadKeys = new Set(
        data.sizes.map((s) => normalizeLabel(s.label).toLowerCase())
      );
      for (const s of existingSizes) {
        if (!payloadKeys.has(s.label.toLowerCase())) {
          const referenced = await tx.orderitems.count({ where: { sizeId: s.id } });
          if (referenced === 0) {
            await tx.recipes.deleteMany({ where: { sizeId: s.id } });
            await tx.sizes.delete({ where: { id: s.id } });
          }
        }
      }
    });

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
  } catch (err: unknown) {
    console.error("PUT /menu/[id] error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

// DELETE menu
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menuId = Number(id);
    if (isNaN(menuId)) throw new Error("Invalid menu ID");

    // If referenced by order items, soft-hide instead of deleting
    const references = await prisma.orderitems.count({ where: { menuId } });
    if (references > 0) {
      await prisma.menu.update({ where: { id: menuId }, data: { status: "HIDDEN" } });
      return NextResponse.json({ message: "Menu is referenced by orders. Marked as HIDDEN." });
    }

    await prisma.$transaction(async (tx) => {
      const sizeIds = (
        await tx.sizes.findMany({ where: { menuId }, select: { id: true } })
      ).map((s) => s.id);
      if (sizeIds.length) await tx.recipes.deleteMany({ where: { sizeId: { in: sizeIds } } });
      await tx.sizes.deleteMany({ where: { menuId } });
      await tx.menu.delete({ where: { id: menuId } });
    });

    return NextResponse.json({ message: "Menu deleted" });
  } catch (err: unknown) {
    console.error("DELETE /menu/[id] error:", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
