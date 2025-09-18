import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { users_role, users_status } from "@prisma/client";
import bcrypt from "bcryptjs";

// Define types for params
type Params = { params: Promise<{ id: string }> };

// Define type for update body (input from API)
interface UpdateUserBody {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  role?: string; // still string in request, will map to enum
  status?: string; // still string in request, will map to enum
  phone?: string | null;
  hireDate?: string | null;
}

// GET single user
export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id, 10) },
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
      phone: user.phone ?? "",
      createdAt: user.createdAt.toISOString(),
      hireDate: (user.hireDate || user.createdAt).toISOString(),
    };

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// UPDATE user
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body: UpdateUserBody = await req.json();

    const {
      email,
      username,
      password,
      name,
      role,
      status,
      phone,
      hireDate,
    } = body;

    const updatedData: Record<string, unknown> = {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(name ? { name } : {}),
      ...(role ? { role: role.toUpperCase() as users_role } : {}),
      ...(status ? { status: status.toUpperCase() as users_status } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(hireDate !== undefined
        ? { hireDate: hireDate ? new Date(hireDate) : null }
        : {}),
    };

    if (password && password.length >= 4) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id, 10) },
      data: updatedData,
    });

    const mapped = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: (updatedUser.role || "BARISTA").toLowerCase(),
      status: (updatedUser.status || "ACTIVE").toLowerCase(),
      phone: updatedUser.phone ?? "",
      createdAt: updatedUser.createdAt.toISOString(),
      hireDate: (updatedUser.hireDate || updatedUser.createdAt).toISOString(),
    };

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.users.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
