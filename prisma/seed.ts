import { prisma } from '../server/utils/prisma';
import { caseTypes } from './data/case-types';
import { adminUsers } from './data/admin';

async function main() {
  // Seed case types
  console.log('Seeding case types...');
  for (const caseType of caseTypes) {
    await prisma.caseType.upsert({
      where: { key: caseType.key },
      update: {
        label: caseType.label,
        fields: caseType.fields,
        fileSlots: caseType.fileSlots,
        instructions: caseType.instructions,
      },
      create: caseType,
    });
    console.log(`  - ${caseType.label}`);
  }

  // Seed admin users (only if no admins exist)
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  if (adminCount > 0) {
    console.log(`Skipping admin seeding. ${adminCount} admin(s) already exist.`);
  } else {
    console.log('Seeding admin users...');
    for (const admin of adminUsers) {
      await prisma.user.create({
        data: admin,
      });
      console.log(`  - ${admin.email}`);
    }
  }
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
