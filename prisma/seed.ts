import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  await prisma.users.upsert({
    where: { email: 'admin@coffeeshop.com' },
    update: {
      username: 'admin',
      status: 'ACTIVE',
      phone: '0000000000',
    },
    create: {
      email: 'admin@coffeeshop.com',
      username: 'admin',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '0000000000',
      hireDate: new Date(),
    },
  });

  await prisma.users.upsert({
    where: { email: 'cashier@coffeeshop.com' },
    update: {
      username: 'cashier',
      status: 'ACTIVE',
    },
    create: {
      email: 'cashier@coffeeshop.com',
      username: 'cashier',
      password: cashierPassword,
      name: 'Cashier',
      role: 'CASHIER',
      status: 'ACTIVE',
      hireDate: new Date(),
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
