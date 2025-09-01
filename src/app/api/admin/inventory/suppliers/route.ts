import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all suppliers
export async function GET() {
  const suppliers = await prisma.suppliers.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(suppliers);
}

// POST create new supplier
export async function POST(req: Request) {
  const data = await req.json();
  const supplier = await prisma.suppliers.create({
    data: { name: data.name, address: data.address || null },
  });
  return NextResponse.json(supplier);
}

// PUT update supplier
export async function PUT(req: Request) {
  const data = await req.json();
  const updated = await prisma.suppliers.update({
    where: { id: data.id },
    data: { name: data.name, address: data.address || null },
  });
  return NextResponse.json(updated);
}

// DELETE supplier
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await prisma.suppliers.delete({ where: { id } });
  return NextResponse.json({ message: "Supplier deleted" });
}
