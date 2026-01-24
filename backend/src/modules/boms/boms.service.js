import { prisma } from '../../config/database.js';

/**
 * BoMs Service
 * Business logic for BoM lookup operations
 */

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

export default { getBomsByProduct };
