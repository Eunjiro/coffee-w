import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all units
export async function GET() {
  const units = await prisma.units.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(units);
}

// POST create new unit 
export async function POST(req: Request) {
  const data = await req.json();
  const unit = await prisma.units.create({
    data: { name: data.name },
  });
  return NextResponse.json(unit);
}

// PUT update unit
export async function PUT(req: Request) {
  const data = await req.json();
  const updated = await prisma.units.update({
    where: { id: data.id },
    data: { name: data.name },
  });
  return NextResponse.json(updated);
}

// DELETE unit
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  await prisma.units.delete({ where: { id } });
  return NextResponse.json({ message: "Unit deleted" });
}
