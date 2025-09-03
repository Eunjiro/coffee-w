import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all ingredients
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q"); // for searc

  const ingredients = await prisma.ingredients.findMany({
    where: search
      ? {
        OR: [
          { name: { contains: search } },
          { suppliers: { name: { contains: search } } },
          { units: { name: { contains: search } } },
        ],
      }
      : undefined,
    include: { suppliers: true, units: true },
    orderBy: { name: "asc" },
  });


  return NextResponse.json(ingredients);
}

// POST create new ing
export async function POST(req: Request) {
  const data = await req.json();
  const unitCost =
    data.qtyPerPack && data.packagePrice
      ? data.packagePrice / data.qtyPerPack
      : 0;

  const ingredient = await prisma.ingredients.create({
    data: {
      name: data.name,
      supplierId: data.supplierId || null,
      unitId: data.unitId || null,
      packagePrice: data.packagePrice || 0,
      qtyPerPack: data.qtyPerPack || 0,
      unitCost,
      stock: data.stock || 0,
      threshold: data.threshold || 0,
    },
  });

  return NextResponse.json(ingredient);
}

// PUT update ingredient (including restock)
export async function PUT(req: Request) {
  const data = await req.json();

  let newStock = data.stock;
  if (data.restockAmount) {
    // special case: restocking
    const existing = await prisma.ingredients.findUnique({
      where: { id: data.id },
    });
    newStock = (existing?.stock || 0) + data.restockAmount;
  }

  const unitCost =
    data.qtyPerPack && data.packagePrice
      ? data.packagePrice / data.qtyPerPack
      : undefined;

  const updated = await prisma.ingredients.update({
    where: { id: data.id },
    data: {
      name: data.name,
      supplierId: data.supplierId || null,
      unitId: data.unitId || null,
      packagePrice: data.packagePrice || 0,
      qtyPerPack: data.qtyPerPack || 0,
      ...(unitCost !== undefined && { unitCost }),
      stock: newStock,
      threshold: data.threshold || 0,
    },
  });

  return NextResponse.json(updated);
}

// DELETE ingredient
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await prisma.ingredients.delete({ where: { id } });
  return NextResponse.json({ message: "Ingredient deleted" });
}
