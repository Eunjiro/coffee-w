import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    const data = await req.json();

    const updated = await prisma.menu.update({
        where: { id },
        data: {
            name: data.name,
            image: data.image,
            type: data.type,
            status: data.status,
            sizes: {
                deleteMany: {},
                create: data.sizes.map((s: any) => ({ label: s.label, price: s.price })),
            }
        },
        include: { sizes: true },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const id = Number(params.id);
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ message: "Menu deleted" });
}
