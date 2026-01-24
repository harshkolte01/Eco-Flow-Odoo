import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const roles = [
    { name: 'engineering' },
    { name: 'approver' },
    { name: 'operations' },
    { name: 'admin' }
  ];

  console.log('📝 Seeding roles (safe to run multiple times)...');

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name }
    });

    console.log(`   ✓ Ensured role exists: ${saved.name}`);
  }

  console.log('✅ Seed completed successfully!');
  console.log(`   Roles ensured: ${roles.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
