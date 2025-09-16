import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Tiny helper to coerce Prisma.Decimals -> number safely
const toNum = (v: Prisma.Decimal | number | null | undefined, fallback = 0) =>
  v == null ? fallback : Number(v);

// Quick category inference from unit/name (adjust to your own rules)
function inferCategory(unitName?: string | null, itemName?: string) {
  const u = (unitName || "").toLowerCase();
  const n = (itemName || "").toLowerCase();

  // You can expand the logic here if needed, based on your actual inventory
  if (n.includes("syrup")) return "syrup";
  if (["g", "kg"].includes(u)) return "powder";
  if (["ml", "l"].includes(u)) return "liquid";
  if (["pcs", "pc", "piece"].includes(u)) return "solid";
  return "solid"; // default category
}

// ---- GET /api/admin/inventory
export async function GET() {
  try {
    const [ings, cups] = await Promise.all([
      prisma.ingredients.findMany({
        include: {
          suppliers: true,
          units: true,
        },
        orderBy: { id: "asc" },
      }),
      prisma.cups.findMany({
        include: {
          sizes: true, // available via "CupSizes" relation; no stock columns though
        },
        orderBy: { id: "asc" },
      }),
    ]);

    // Map ingredients to the shape your table expects
    const ingredientItems = ings.map((ing) => {
      const unitName = ing.units?.name ?? "";
      const pkgPrice = ing.packagePrice ? toNum(ing.packagePrice) : null;
      const qtyPerPack = ing.qtyPerPack ? toNum(ing.qtyPerPack) : null;
      const unitCost = ing.unitCost ? toNum(ing.unitCost) : null;

      return {
        id: `ing-${ing.id.toString().padStart(3, "0")}`,
        type: "ingredient" as const,
        name: ing.name,
        category: inferCategory(unitName, ing.name),
        supplier: ing.suppliers?.name ?? "—",
        pkgPrice,                   // number | null
        qtyPerPack,                 // number | null
        unit: unitName || "—",
        unitCost,                   // number | null
        stock: toNum(ing.stock),    // number
        minStock: toNum(ing.threshold), // number
      };
    });

    // Map cups into "disposable" category (no stock fields in schema)
    const cupItems = cups.map((cup) => ({
      id: `cup-${cup.id.toString().padStart(3, "0")}`,
      type: "cup" as const,
      name: cup.name,
      category: "disposable" as const,
      supplier: "—",
      pkgPrice: null as number | null,
      qtyPerPack: null as number | null,
      unit: "pcs",
      unitCost: 0,
      stock: 0,
      minStock: 0,
    }));

    return NextResponse.json({ items: [...ingredientItems, ...cupItems] });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load inventory." },
      { status: 500 }
    );
  }
}

// ---- PATCH /api/admin/inventory
// Body: { id: "ing-001" | "cup-001", delta: number }
export async function PATCH(req: NextRequest) {
  try {
    const { id, delta } = (await req.json()) as {
      id: string;
      delta: number;
    };

    if (!id || typeof delta !== "number")
      return NextResponse.json(
        { error: "id and delta are required." },
        { status: 400 }
      );

    if (id.startsWith("ing-")) {
      const rawId = parseInt(id.replace("ing-", ""), 10);
      const updated = await prisma.ingredients.update({
        where: { id: rawId },
        data: { stock: { increment: delta } },
        select: { id: true, stock: true },
      });
      return NextResponse.json({ id, stock: Number(updated.stock) });
    }

    // Cups don't have stock columns in the provided schema
    return NextResponse.json(
      { warning: "Cups have no stock field in schema; nothing to update." },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update inventory." },
      { status: 500 }
    );
  }
}
