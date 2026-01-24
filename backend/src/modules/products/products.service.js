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

/**
 * Update Product Version
 * STRICT GUARD: Only allowed via ECO process
 * This method is here to prevent accidental implementation of direct updates
 */
export const updateProductVersion = async (id, data) => {
  const version = await prisma.productVersion.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!version) {
    const error = new Error('Product version not found');
    error.statusCode = 404;
    throw error;
  }

  if (version.status !== 'draft') {
    const error = new Error(`Direct updates to ${version.status} versions are strictly prohibited. Use the ECO process.`);
    error.statusCode = 403;
    throw error;
  }

  return prisma.productVersion.update({
    where: { id },
    data
  });
};

export default { getProductsByStatus, getActiveProducts, updateProductVersion };
