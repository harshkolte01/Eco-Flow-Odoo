
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Debugging Product Versions ---');

  // 1. Count all versions by status
  const counts = await prisma.productVersion.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });
  console.log('Counts by status:', counts);

  // 2. Simulate "All statuses" query (no status filter)
  const allVersions = await prisma.productVersion.findMany({
    where: {},
    select: {
      id: true,
      productName: true,
      versionNo: true,
      status: true
    },
    take: 5
  });
  console.log('Sample of "All statuses" query:', allVersions);

  // 3. Simulate "Archived" query
  const archivedVersions = await prisma.productVersion.findMany({
    where: { status: 'archived' },
    select: {
      id: true,
      productName: true,
      versionNo: true,
      status: true
    },
    take: 5
  });
  console.log('Sample of "Archived" query:', archivedVersions);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
