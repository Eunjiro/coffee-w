import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all menu items with sizes and ingredients
export async function GET() {
  const menus = await prisma.menu.findMany({
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
  });

  const result = menus.map(menu => ({
    ...menu,
    ingredients: menu.recipes.flatMap(recipe =>
      recipe.recipeingredients.map(ri => ({
        id: ri.ingredients.id,
        name: ri.ingredients.name,
        qtyNeeded: ri.qtyNeeded,
        recipeId: recipe.id,
      }))
    ),
  }));

  return NextResponse.json(result);
}

// POST create new menu item
export async function POST(req: Request) {
  const data = await req.json();

  // Create menu first
  const menu = await prisma.menu.create({
    data: {
      name: data.name,
      image: data.image,
      type: data.type,
      status: data.status,
    },
  });

  // Create sizes
  const createdSizes = await Promise.all(
    data.sizes.map((size: any) =>
      prisma.sizes.create({
        data: { label: size.label, price: size.price, menuId: menu.id },
      })
    )
  );

  // Create recipes with proper menu & size connection
  await Promise.all(
    data.recipes.map((recipe: any) => {
      const size = createdSizes.find(s => s.label === recipe.sizeLabel);
      if (!size) return null;
      return prisma.recipes.create({
        data: {
          name: `Recipe for size ${size.label}`,
          menu: { connect: { id: menu.id } },
          sizes: { connect: { id: size.id } },
          recipeingredients: {
            create: recipe.ingredients.map((ing: any) => ({
              ingredientId: ing.ingredientId,
              qtyNeeded: ing.qtyNeeded,
            })),
          },
        },
      });
    })
  );

  const fullMenu = await prisma.menu.findUnique({
    where: { id: menu.id },
    include: {
      sizes: true,
      recipes: { include: { recipeingredients: { include: { ingredients: true } } } },
    },
  });

  return NextResponse.json(fullMenu);
}

// PUT update menu item
export async function PUT(req: Request) {
  const data = await req.json();

  // Get existing size IDs for this menu
  const sizeIds = (await prisma.sizes.findMany({
    where: { menuId: data.id },
    select: { id: true },
  })).map(s => s.id);

  // Delete old recipes & sizes
  if (sizeIds.length > 0) {
    await prisma.recipes.deleteMany({ where: { sizeId: { in: sizeIds } } });
  }
  await prisma.sizes.deleteMany({ where: { menuId: data.id } });

  // Update menu
  await prisma.menu.update({
    where: { id: data.id },
    data: {
      name: data.name,
      image: data.image,
      type: data.type,
      status: data.status,
    },
  });

  // Create new sizes
  const createdSizes = await Promise.all(
    data.sizes.map((size: any) =>
      prisma.sizes.create({
        data: { label: size.label, price: size.price, menuId: data.id },
      })
    )
  );

  // Create new recipes
  await Promise.all(
    data.recipes.map((recipe: any) => {
      const size = createdSizes.find(s => s.label === recipe.sizeLabel);
      if (!size) return null;
      return prisma.recipes.create({
        data: {
          name: `Recipe for size ${size.label}`,
          menu: { connect: { id: data.id } },
          sizes: { connect: { id: size.id } },
          recipeingredients: {
            create: recipe.ingredients.map((ing: any) => ({
              ingredientId: ing.ingredientId,
              qtyNeeded: ing.qtyNeeded,
            })),
          },
        },
      });
    })
  );

  const fullMenu = await prisma.menu.findUnique({
    where: { id: data.id },
    include: {
      sizes: true,
      recipes: { include: { recipeingredients: { include: { ingredients: true } } } },
    },
  });

  return NextResponse.json(fullMenu);
}

// DELETE menu item
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  // Get all size IDs for this menu
  const sizeIds = (await prisma.sizes.findMany({
    where: { menuId: id },
    select: { id: true },
  })).map(s => s.id);

  if (sizeIds.length > 0) {
    await prisma.recipes.deleteMany({ where: { sizeId: { in: sizeIds } } });
  }
  await prisma.sizes.deleteMany({ where: { menuId: id } });
  await prisma.menu.delete({ where: { id } });

  return NextResponse.json({ message: "Menu deleted" });
}
