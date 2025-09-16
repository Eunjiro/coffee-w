import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  await prisma.users.upsert({
    where: { email: 'admin@coffeeshop.com' },
    update: {},
    create: {
      email: 'admin@coffeeshop.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  await prisma.users.upsert({
    where: { email: 'cashier@coffeeshop.com' },
    update: {},
    create: {
      email: 'cashier@coffeeshop.com',
      password: cashierPassword,
      name: 'Cashier',
      role: 'CASHIER',
    },
  });

  console.log('Seeded admin and cashier accounts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
