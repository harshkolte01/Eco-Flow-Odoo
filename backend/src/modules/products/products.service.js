import { prisma } from '../../config/database.js';

/**
 * Products Service
 * Business logic for product lookup operations
 */

export const getActiveProducts = async () => {
  const versions = await prisma.productVersion.findMany({
    where: {
      status: 'active'
    },
    select: {
      productId: true,
      productName: true,
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
    productName: version.productName
  }));
};

export default { getActiveProducts };
