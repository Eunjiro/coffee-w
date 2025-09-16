import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cups = await prisma.cups.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(cups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load cups" }, { status: 500 });
  }
}


