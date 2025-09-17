import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET single user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        hireDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const mapped = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: (user.role || "BARISTA").toLowerCase(),
      status: (user.status || "ACTIVE").toLowerCase(),
      phone: user.phone || "",
      createdAt: user.createdAt.toISOString(),
      hireDate: (user.hireDate || user.createdAt).toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// UPDATE user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { email, username, password, name, role, status, phone, hireDate } = body;

    const updatedData: any = {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(name ? { name } : {}),
      ...(role ? { role: role.toUpperCase() } : {}),
      ...(status ? { status: status.toUpperCase() } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(hireDate !== undefined ? { hireDate: hireDate ? new Date(hireDate) : null } : {}),
    };
    if (password && password.length >= 4) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updatedData,
    });

    const mapped = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: (updatedUser.role || "BARISTA").toLowerCase(),
      status: "active",
      phone: "",
      createdAt: updatedUser.createdAt.toISOString(),
      hireDate: updatedUser.createdAt.toISOString(),
    };

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.users.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
