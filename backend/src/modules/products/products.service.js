import { prisma } from '../../config/database.js';

/**
 * Products Service
 * Business logic for product lookup operations
 */

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

  return versions.map((version) => ({
    productId: version.productId,
    productCode: version.product.productCode,
    productName: version.productName,
    status: version.status
  }));
};

export const getActiveProducts = async () => getProductsByStatus(['active']);

export default { getProductsByStatus, getActiveProducts };
