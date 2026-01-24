// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // -----------------------
  // 1) Seed Roles (idempotent)
  // -----------------------
  const roles = [
    { name: 'engineering' },
    { name: 'approver' },
    { name: 'operations' },
    { name: 'admin' },
  ];

  console.log('📝 Seeding roles (safe to run multiple times)...');

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });

    console.log(`   ✓ Ensured role exists: ${saved.name}`);
  }

  // -----------------------
  // 1b) Seed ECO Stages (idempotent)
  // -----------------------
  const ecoStages = [
    { name: 'New', sequenceOrder: 1, approvalRequired: false },
    { name: 'Approval', sequenceOrder: 2, approvalRequired: true },
    { name: 'Done', sequenceOrder: 3, approvalRequired: false },
  ];

  console.log('\n🧭 Seeding ECO stages (safe to run multiple times)...');

  for (const stage of ecoStages) {
    const savedStage = await prisma.ecoStage.upsert({
      where: { name: stage.name },
      update: {
        sequenceOrder: stage.sequenceOrder,
        approvalRequired: stage.approvalRequired,
      },
      create: {
        name: stage.name,
        sequenceOrder: stage.sequenceOrder,
        approvalRequired: stage.approvalRequired,
      },
    });

    console.log(`   ✓ Ensured ECO stage exists: ${savedStage.name}`);
  }

  // -----------------------
  // 2) Seed Mock Products + v1 ProductVersion (idempotent)
  // -----------------------
  const mockProducts = [
    {
      code: 'PROD-001',
      name: 'Eco Laptop Pro',
      salePrice: 1299.99,
      costPrice: 899.99,
      attachments: [
        {
          name: 'eco-laptop-pro-spec-sheet.pdf',
          url: 'https://example.com/attachments/eco-laptop-pro-spec-sheet.pdf',
          type: 'spec-sheet',
          sizeKb: 512
        },
        {
          name: 'eco-laptop-pro-render.png',
          url: 'https://example.com/attachments/eco-laptop-pro-render.png',
          type: 'image',
          sizeKb: 248
        }
      ]
    },
    {
      code: 'PROD-002',
      name: 'Green Smartphone X',
      salePrice: 799.99,
      costPrice: 549.99,
      attachments: [
        {
          name: 'green-smartphone-x-datasheet.pdf',
          url: 'https://example.com/attachments/green-smartphone-x-datasheet.pdf',
          type: 'spec-sheet',
          sizeKb: 376
        },
        {
          name: 'green-smartphone-x-packaging.png',
          url: 'https://example.com/attachments/green-smartphone-x-packaging.png',
          type: 'image',
          sizeKb: 192
        }
      ]
    },
    {
      code: 'PROD-003',
      name: 'Sustainable Tablet Plus',
      salePrice: 599.99,
      costPrice: 399.99,
      attachments: [
        {
          name: 'sustainable-tablet-plus-bom-notes.txt',
          url: 'https://example.com/attachments/sustainable-tablet-plus-bom-notes.txt',
          type: 'notes',
          sizeKb: 32
        },
        {
          name: 'sustainable-tablet-plus-quickstart.pdf',
          url: 'https://example.com/attachments/sustainable-tablet-plus-quickstart.pdf',
          type: 'manual',
          sizeKb: 284
        }
      ]
    },
  ];

  console.log('\n📦 Seeding products + versions (safe to run multiple times)...');

  let productsCreated = 0;
  let productsUpdated = 0;
  let versionsCreated = 0;
  let versionsUpdated = 0;

  for (const p of mockProducts) {
    // Pre-check existence BEFORE upsert so counts are accurate
    const productExisted = await prisma.product.findUnique({
      where: { productCode: p.code },
      select: { id: true },
    });

    /**
     * IMPORTANT:
     * This upsert ONLY sets `productCode` because many ECOFlow schemas keep
     * master-data fields in ProductVersion (and Product is just a stable master key).
     *
     * If YOUR Product model requires extra fields (e.g. productName/status/currentVersion),
     * add them to BOTH `create` and `update` below.
     */
    const product = await prisma.product.upsert({
      where: { productCode: p.code },
      update: {
        // If your Product model has fields you want to keep in sync, set them here.
        // Example (ONLY if these fields exist in your schema):
        // productName: p.name,
        // status: 'active',
      },
      create: {
        productCode: p.code,
        // Example (ONLY if these fields exist in your schema):
        // productName: p.name,
        // status: 'active',
      },
    });

    if (productExisted) {
      productsUpdated++;
      console.log(`   ✓ Ensured product: ${p.code} (updated)`);
    } else {
      productsCreated++;
      console.log(`   ✓ Ensured product: ${p.code} (created)`);
    }

    // Pre-check version existence BEFORE upsert for accurate counts
    const versionExisted = await prisma.productVersion.findUnique({
      where: {
        productId_versionNo: {
          productId: product.id,
          versionNo: 1,
        },
      },
      select: { productId: true },
    });

    // Upsert ProductVersion v1 using composite unique key (productId, versionNo)
    await prisma.productVersion.upsert({
      where: {
        productId_versionNo: {
          productId: product.id,
          versionNo: 1,
        },
      },
      update: {
        productName: p.name,
        salePrice: p.salePrice,
        costPrice: p.costPrice,
        attachments: p.attachments,
        status: 'active', // must match your enum values
      },
      create: {
        productId: product.id,
        versionNo: 1,
        productName: p.name,
        salePrice: p.salePrice,
        costPrice: p.costPrice,
        attachments: p.attachments,
        status: 'active',
      },
    });

    if (versionExisted) {
      versionsUpdated++;
      console.log(`      → Ensured version v1 (updated): ${p.code} - ${p.name}`);
    } else {
      versionsCreated++;
      console.log(`      → Ensured version v1 (created): ${p.code} - ${p.name}`);
    }
  }

  // Build lookup map: productCode → { productId, productVersionId }
  console.log('\n🔍 Building product lookup map...');
  const productMap = {};

  for (const productData of mockProducts) {
    const product = await prisma.product.findUnique({
      where: { productCode: productData.code },
      include: {
        versions: {
          where: { versionNo: 1 },
          select: { id: true }
        }
      }
    });

    if (product && product.versions.length > 0) {
      productMap[productData.code] = {
        productId: product.id,
        productVersionId: product.versions[0].id
      };
      console.log(`   ✓ Mapped ${productData.code} → productId: ${product.id}, versionId: ${product.versions[0].id}`);
    }
  }

  // Seed BoMs and BoMVersions
  console.log('\n🔧 Seeding BoMs and BoMVersions (safe to run multiple times)...');

  let bomsEnsured = 0;
  let bomVersionsEnsured = 0;
  let totalComponentsCreated = 0;
  let totalOperationsCreated = 0;

  for (const productData of mockProducts) {
    const { productId, productVersionId } = productMap[productData.code];

    // 1) Ensure Bom exists for the Product
    const bom = await prisma.bom.upsert({
      where: { productId },
      update: {},
      create: { productId }
    });
    bomsEnsured++;
    console.log(`   ✓ Ensured BoM for ${productData.code}`);

    // 2) Ensure BomVersion v1 exists and is ACTIVE
    const bomVersion = await prisma.bomVersion.upsert({
      where: {
        bomId_versionNo: {
          bomId: bom.id,
          versionNo: 1
        }
      },
      update: {
        status: 'active',
        productVersionId
      },
      create: {
        bomId: bom.id,
        versionNo: 1,
        status: 'active',
        productVersionId
      }
    });
    bomVersionsEnsured++;
    console.log(`      → Ensured BoMVersion v1 ACTIVE for ${productData.code}`);

    // 3) Seed components (idempotent: deleteMany + createMany)
    await prisma.bomComponent.deleteMany({
      where: { bomVersionId: bomVersion.id }
    });

    let componentsData = [];

    // Define component structure based on product
    if (productData.code === 'PROD-001') {
      // Eco Laptop Pro contains: PROD-002 (qty 1) and PROD-003 (qty 2)
      componentsData = [
        {
          bomVersionId: bomVersion.id,
          componentProductVersionId: productMap['PROD-002'].productVersionId,
          quantity: '1.0000'
        },
        {
          bomVersionId: bomVersion.id,
          componentProductVersionId: productMap['PROD-003'].productVersionId,
          quantity: '2.0000'
        }
      ];
    } else if (productData.code === 'PROD-002') {
      // Green Smartphone X contains: PROD-003 (qty 1)
      componentsData = [
        {
          bomVersionId: bomVersion.id,
          componentProductVersionId: productMap['PROD-003'].productVersionId,
          quantity: '1.0000'
        }
      ];
    } else if (productData.code === 'PROD-003') {
      // Sustainable Tablet Plus - no components (leaf product)
      componentsData = [];
    }

    if (componentsData.length > 0) {
      await prisma.bomComponent.createMany({
        data: componentsData
      });
      totalComponentsCreated += componentsData.length;
      console.log(`      → Components seeded: ${componentsData.length}`);
    } else {
      console.log(`      → Components seeded: 0 (leaf product)`);
    }

    // 4) Seed operations (idempotent: deleteMany + createMany)
    await prisma.bomOperation.deleteMany({
      where: { bomVersionId: bomVersion.id }
    });

    const operationsData = [
      {
        bomVersionId: bomVersion.id,
        operationName: 'Assembly',
        timeMinutes: 60,
        workCenter: 'Assembly Line A'
      },
      {
        bomVersionId: bomVersion.id,
        operationName: 'Testing',
        timeMinutes: 20,
        workCenter: 'QC Station 1'
      },
      {
        bomVersionId: bomVersion.id,
        operationName: 'Packaging',
        timeMinutes: 15,
        workCenter: 'Packaging Area'
      }
    ];

    await prisma.bomOperation.createMany({
      data: operationsData
    });
    totalOperationsCreated += operationsData.length;
    console.log(`      → Operations seeded: ${operationsData.length}`);
  }

  console.log('\n✅ Seed completed successfully!');
  console.log(`   Roles ensured: ${roles.length}`);
  console.log(`   Products: ${productsCreated} created, ${productsUpdated} updated`);
  console.log(`   Versions: ${versionsCreated} created, ${versionsUpdated} updated`);
  console.log('\n📊 BoM Verification Checklist:');
  console.log(`   BoMs ensured: ${bomsEnsured}`);
  console.log(`   BoMVersions ensured: ${bomVersionsEnsured}`);
  console.log(`   Components created total: ${totalComponentsCreated}`);
  console.log(`   Operations created total: ${totalOperationsCreated}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
