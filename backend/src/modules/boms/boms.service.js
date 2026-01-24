import { prisma } from '../../config/database.js';

/**
 * BoMs Service
 * Business logic for BoM lookup operations
 */

const parseStatusList = (status) => {
  if (!status) {
    return [];
  }
  return status
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const getBomsByProduct = async (productId) => {
  const parsedProductId = parseInt(productId, 10);

  const versions = await prisma.bomVersion.findMany({
    where: {
      status: 'active',
      bom: {
        productId: parsedProductId
      }
    },
    select: {
      bomId: true,
      versionNo: true
    },
    orderBy: {
      versionNo: 'desc'
    }
  });

  return versions.map((version) => ({
    bomId: version.bomId,
    versionNo: version.versionNo
  }));
};

export const listBomOverview = async ({ status, q }) => {
  const statuses = parseStatusList(status);
  const where = {};

  if (statuses.length > 0) {
    where.status = { in: statuses };
  } else {
    where.status = { in: ['active', 'archived'] };
  }

  if (q && q.trim()) {
    const search = q.trim();
    where.OR = [
      {
        productVersion: {
          productName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        productVersion: {
          product: {
            productCode: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      }
    ];
  }

  const versions = await prisma.bomVersion.findMany({
    where,
    orderBy: [
      { bomId: 'asc' },
      { versionNo: 'desc' }
    ],
    select: {
      bomId: true,
      versionNo: true,
      status: true,
      productVersion: {
        select: {
          productName: true,
          product: {
            select: {
              id: true,
              productCode: true
            }
          }
        }
      }
    }
  });

  const byBom = new Map();
  versions.forEach((version) => {
    if (!byBom.has(version.bomId)) {
      byBom.set(version.bomId, version);
    }
  });

  return Array.from(byBom.values()).map((version) => ({
    bomId: version.bomId,
    productId: version.productVersion?.product?.id ?? null,
    productCode: version.productVersion?.product?.productCode ?? null,
    productName: version.productVersion?.productName ?? null,
    versionNo: version.versionNo,
    status: version.status
  }));
};

export default { getBomsByProduct, listBomOverview };
