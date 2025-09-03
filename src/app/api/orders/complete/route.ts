import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {

    const { orderId } = await req.json();

    if (!orderId) return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });

    await prisma.orders.update({ where: { id: orderId }, data: { status: "COMPLETED" }, });

    return NextResponse.json({ success: true });
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 }); }
}