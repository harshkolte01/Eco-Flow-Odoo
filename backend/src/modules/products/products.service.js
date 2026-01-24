import { prisma } from '../../config/database.js';

/**
 * Products Service
 * Business logic for product lookup operations
 */

const pickBestVersion = (current, candidate) => {
  if (!current) {
    return candidate;
  }

  const currentActive = current.status === 'active';
  const candidateActive = candidate.status === 'active';

  if (candidateActive && !currentActive) {
    return candidate;
  }
  if (!candidateActive && currentActive) {
    return current;
  }

  if (candidate.versionNo > current.versionNo) {
    return candidate;
  }
  if (candidate.versionNo < current.versionNo) {
    return current;
  }

  return candidate.updatedAt > current.updatedAt ? candidate : current;
};

export const getProductsByStatus = async (statuses = ['active']) => {
  const versions = await prisma.productVersion.findMany({
    where: {
      status: {
        in: statuses
      }
    },
    select: {
      productId: true,
      productName: true,
      status: true,
      versionNo: true,
      updatedAt: true,
      product: {
        select: {
          productCode: true
        }
      }
    },
    orderBy: {
      productId: 'asc'
    }
  });

  const uniqueByProduct = new Map();
  versions.forEach((version) => {
    const existing = uniqueByProduct.get(version.productId);
    uniqueByProduct.set(version.productId, pickBestVersion(existing, version));
  });

  return Array.from(uniqueByProduct.values())
    .sort((a, b) => a.product.productCode.localeCompare(b.product.productCode))
    .map((version) => ({
      productId: version.productId,
      productCode: version.product.productCode,
      productName: version.productName,
      status: version.status,
      updatedAt: version.updatedAt
    }));
};

export const getActiveProducts = async () => getProductsByStatus(['active']);

export default { getProductsByStatus, getActiveProducts };
