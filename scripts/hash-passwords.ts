import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany();

  for (const user of users) {
    // Skip if already hashed
    if (user.password.startsWith("$2b$")) continue;

    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    console.log(`Updated user ${user.email}`);
  }
}

main().finally(() => prisma.$disconnect());
