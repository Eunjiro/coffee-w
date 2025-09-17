import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch all addon items (type = "ADDON") with their sizes
    const addons = await prisma.menu.findMany({
      where: { 
        type: "ADDON",
        status: "AVAILABLE" 
      },
      include: {
        sizes: true,
      },
      orderBy: { name: "asc" },
    });

    // Map to MenuItem type for consistency
    const addonItems = addons.map(addon => ({
      id: addon.id,
      name: addon.name,
      description: addon.category, // Using category as description
      type: addon.type,
      status: addon.status,
      image: addon.image || undefined,
      sizes: addon.sizes.map(size => ({
        id: size.id,
        label: size.label,
        price: Number(size.price),
      })),
    }));

    return NextResponse.json(addonItems);
  } catch (error) {
    console.error("Error fetching addon data:", error);
    return NextResponse.json([], { status: 500 });
  }
}
