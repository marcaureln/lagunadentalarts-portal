import { prisma } from '../server/utils/prisma';

async function main() {
  const adminCount = await prisma.user.count({
    where: {
      role: 'ADMIN',
    },
  });

  if (adminCount > 0) {
    console.log(`Seeding admin skipped. ${adminCount} admin already in the database.`);
    return;
  }

  const adminEmail = 'alexmarcaureln@gmail.com';

  console.log(`Seeding admin user: ${adminEmail}`);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Alex',
      role: 'ADMIN',
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
