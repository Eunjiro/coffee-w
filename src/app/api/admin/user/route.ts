import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET all users
export async function GET() {
  try {
    const users = await prisma.users.findMany({
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

    // Map DB roles/status to UI expectations
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
      role: (u.role || "BARISTA").toLowerCase(),
      status: (u.status || "ACTIVE").toLowerCase(),
      phone: u.phone || "",
      createdAt: u.createdAt.toISOString(),
      hireDate: (u.hireDate || u.createdAt).toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// CREATE new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, name, role, status, phone, hireDate } = body;

    if (!email || !username || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const passwordToUse = password && password.length >= 4 ? password : "changeme123";
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    const newUser = await prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: (role || "BARISTA").toUpperCase(),
        status: (status || "ACTIVE").toUpperCase(),
        phone: phone || null,
        hireDate: hireDate ? new Date(hireDate) : null,
      },
    });

    const mapped = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      name: newUser.name,
      role: (newUser.role || "BARISTA").toLowerCase(),
      status: (newUser.status || "ACTIVE").toLowerCase(),
      phone: newUser.phone || "",
      createdAt: newUser.createdAt.toISOString(),
      hireDate: (newUser.hireDate || newUser.createdAt).toISOString(),
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
