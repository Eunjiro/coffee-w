import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { menu_type, menu_status } from "@prisma/client";

interface IngredientInput {
  ingredientId: number;
  qtyNeeded: number;
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

// Strict allowed size keys
type SizeKey = "small" | "medium" | "large";

interface IngredientsBySize {
  small: any[];
  medium: any[];
  large: any[];
}

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        sizes: {
          include: {
            recipes: {
              include: {
                recipeingredients: {
                  include: { ingredients: true },
                },
              },
            },
          },
        },
      },
    });

    const result = (menus || []).map((menu) => {
      const ingredientsBySize: IngredientsBySize = {
        small: [],
        medium: [],
        large: [],
      };

      menu.sizes.forEach((size) => {
        const sizeKey = size.label.toLowerCase() as SizeKey;

        size.recipes.forEach((recipe) => {
          recipe.recipeingredients.forEach((ri) => {
            ingredientsBySize[sizeKey].push({
              id: ri.ingredients?.id ?? null,
              name: ri.ingredients?.name ?? "Unknown",
              quantity: ri.qtyNeeded ?? 0,
              recipeId: recipe.id,
              sizeId: size.id,
            });
          });
        });
      });

      return {
        ...menu,
        sizes: menu.sizes.map((size) => ({
          ...size,
          recipes: size.recipes.map((recipe) => ({
            ...recipe,
            recipeingredients: recipe.recipeingredients.map((ri) => ({
              id: ri.ingredients?.id ?? null,
              name: ri.ingredients?.name ?? "Unknown",
              qtyNeeded: ri.qtyNeeded ?? 0,
              recipeId: recipe.id,
              sizeId: size.id,
            })),
          })),
        })),
        ingredients: ingredientsBySize,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /menu error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch menus" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data: MenuInput = await req.json();

    // Validate request payload
    if (!data.name || !data.type || !data.status || !Array.isArray(data.sizes)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Create the menu
    const menu = await prisma.menu.create({
      data: {
        name: data.name,
        image: data.image ?? "",
        type: data.type,
        status: data.status,
        category: data.category ?? null,
      },
    });

    // Create sizes and associated recipes
    for (const s of data.sizes) {
      if (!s.label || typeof s.price !== "number") continue;

      const size = await prisma.sizes.create({
        data: {
          label: s.label,
          price: s.price,
          menuId: menu.id,
          // accept optional cupId from client
          ...(s as any).cupId ? { cupId: Number((s as any).cupId) } : {},
        },
      });

      // Create a recipe for this size if ingredients are provided
      if (Array.isArray(s.ingredients) && s.ingredients.length > 0) {
        await prisma.recipes.create({
          data: {
            name: `Recipe for ${s.label}`,
            menuId: menu.id,
            sizeId: size.id,
            recipeingredients: {
              create: s.ingredients
                .filter((i) => i.ingredientId && i.qtyNeeded)
                .map((i) => ({
                  ingredientId: i.ingredientId,
                  qtyNeeded: i.qtyNeeded,
                })),
            },
          },
        });
      }
    }

    // Fetch the full menu with relations
    const fullMenu = await prisma.menu.findUnique({
      where: { id: menu.id },
      include: {
        sizes: {
          include: {
            recipes: {
              include: {
                recipeingredients: {
                  include: { ingredients: true },
                },
              },
            },
          },
        },
      },
    });

    // Build structured ingredients by size for the response
    const ingredientsBySize: IngredientsBySize = {
      small: [],
      medium: [],
      large: [],
    };

    if (fullMenu?.sizes) {
      fullMenu.sizes.forEach((size) => {
        const sizeKey = size.label.toLowerCase() as SizeKey;

        size.recipes.forEach((recipe) => {
          recipe.recipeingredients.forEach((ri) => {
            ingredientsBySize[sizeKey].push({
              id: ri.ingredients?.id ?? null,
              name: ri.ingredients?.name ?? "Unknown",
              quantity: ri.qtyNeeded ?? 0,
              recipeId: recipe.id,
              sizeId: size.id,
            });
          });
        });
      });
    }

    return NextResponse.json({
      ...fullMenu,
      ingredients: ingredientsBySize,
    });
  } catch (err: any) {
    console.error("POST /menu error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create menu" },
      { status: 500 }
    );
  }
}
