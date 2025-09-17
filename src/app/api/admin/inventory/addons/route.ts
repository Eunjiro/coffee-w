import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST create a new addon
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, category, price, qtyPerPack, packagePrice, ingredients, orderId } = data;

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ message: "At least one ingredient is required" }, { status: 400 });
  }

  if (!orderId) {
    return NextResponse.json({ message: "orderId is required" }, { status: 400 }); // Ensure orderId is provided
  }

  try {
    // Calculate unitCost based on qtyPerPack and packagePrice, if necessary for logic
    const unitCost = qtyPerPack && packagePrice ? packagePrice / qtyPerPack : 0;

    // Create the new addon in the menu table
    const newAddon = await prisma.menu.create({
      data: {
        name,
        category: category || '',
        basePrice: parseFloat(price),
        type: "ADDON", // Set the type to "ADDON"
        orderitems: {
          create: [
            {
              orderId, // Ensure orderId is passed here
              orderitemaddons: {
                create: ingredients.map((ingredient: { ingredientId: string; qtyNeeded: string }) => ({
                  addonId: {
                    connect: { id: ingredient.ingredientId }, // Connect ingredient to addon
                  },
                  qtyNeeded: parseFloat(ingredient.qtyNeeded), // Set the qtyNeeded for the ingredient
                })),
              },
            },
          ],
        },
      },
    });

    return NextResponse.json(newAddon);
  } catch (error: unknown) {
    console.error("Error adding addon:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
  }
}
