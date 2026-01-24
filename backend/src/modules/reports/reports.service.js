import { prisma } from '../../config/database.js';

/**
 * Reports Service
 * Business logic for generating reports
 */

const pickProductName = (versions = []) => {
  if (!Array.isArray(versions)) {
    return null;
  }
  const active = versions.find((version) => version.status === 'active');
  if (active) {
    return active.productName;
  }
  const versionOne = versions.find((version) => version.versionNo === 1);
  return versionOne ? versionOne.productName : null;
};

const formatEcoType = (ecoType) => {
  if (ecoType === 'product') {
    return 'Product';
  }
  if (ecoType === 'bom') {
    return 'Bill of Materials';
  }
  return ecoType;
};

/**
 * Get ECOs report data
 * Returns list of ECOs with their details for reporting
 */
export const getEcosReport = async ({ q, ecoType, scope = 'all', currentUser }) => {
  const where = {};
  const role = currentUser?.role;

  // Operations users cannot see ECOs
  if (role === 'operations') {
    return [];
  }

  // Search filter
  if (q && q.trim()) {
    where.title = {
      contains: q.trim(),
      mode: 'insensitive'
    };
  }

  // ECO Type filter
  if (ecoType) {
    where.ecoType = ecoType;
  }

  // Scope filter
  let effectiveScope = scope;
  if (role === 'engineering') {
    effectiveScope = 'mine';
  }

  if (effectiveScope === 'mine' && currentUser?.id) {
    where.raisedById = currentUser.id;
  }

  const ecos = await prisma.eco.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      ecoType: true,
      status: true,
      product: {
        select: {
          id: true,
          productCode: true,
          versions: {
            select: {
              productName: true,
              status: true,
              versionNo: true
            },
            where: {
              OR: [{ status: 'active' }, { versionNo: 1 }]
            }
          }
        }
      },
      productChange: {
        select: {
          id: true
        }
      },
      bomDraft: {
        select: {
          id: true
        }
      }
    }
  });

  return ecos.map((eco) => {
    const productName = pickProductName(eco.product?.versions);
    const hasChanges = eco.ecoType === 'product' 
      ? !!eco.productChange 
      : !!eco.bomDraft;

    return {
      id: eco.id,
      title: eco.title,
      ecoType: formatEcoType(eco.ecoType),
      productName: productName || eco.product?.productCode || 'N/A',
      hasChanges,
      status: eco.status
    };
  });
};

const parsePagination = (page, limit, maxLimit = 100) => {
  const take = Math.min(parseInt(limit, 10) || 20, maxLimit);
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * take;
  return { take, skip, currentPage };
};

export const getProductVersionHistory = async ({ productId, status, page, limit, currentUser }) => {
  const where = {};
  const role = currentUser?.role;

  if (role === 'operations') {
    where.status = 'active';
  } else if (status) {
    where.status = status;
  }

  if (productId) {
    where.productId = parseInt(productId, 10);
  }

  const { take, skip, currentPage } = parsePagination(page, limit);

  const [versions, total] = await prisma.$transaction([
    prisma.productVersion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        product: {
          select: {
            productCode: true
          }
        },
        createdFromEco: {
          select: {
            id: true,
            title: true
          }
        }
      }
    }),
    prisma.productVersion.count({ where })
  ]);

  return {
    items: versions.map((version) => ({
      id: version.id,
      productId: version.productId,
      productCode: version.product.productCode,
      productName: version.productName,
      versionNo: version.versionNo,
      salePrice: version.salePrice,
      costPrice: version.costPrice,
      attachments: version.attachments,
      status: version.status,
      createdAt: version.createdAt,
      createdFromEco: version.createdFromEco
        ? {
          id: version.createdFromEco.id,
          title: version.createdFromEco.title
        }
        : null
    })),
    pagination: {
      page: currentPage,
      limit: take,
      total
    }
  };
};

export const getBomVersionHistory = async ({ bomId, productId, status, page, limit, currentUser }) => {
  const where = {};
  const role = currentUser?.role;

  if (role === 'operations') {
    where.status = 'active';
  } else if (status) {
    where.status = status;
  }

  if (bomId) {
    where.bomId = parseInt(bomId, 10);
  }

  if (productId) {
    where.bom = {
      productId: parseInt(productId, 10)
    };
  }

  const { take, skip, currentPage } = parsePagination(page, limit);

  const [versions, total] = await prisma.$transaction([
    prisma.bomVersion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        bom: {
          include: {
            product: {
              select: {
                productCode: true
              }
            }
          }
        },
        productVersion: {
          select: {
            productName: true,
            versionNo: true
          }
        },
        createdFromEco: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            components: true,
            operations: true
          }
        }
      }
    }),
    prisma.bomVersion.count({ where })
  ]);

  return {
    items: versions.map((version) => ({
      id: version.id,
      bomId: version.bomId,
      productId: version.bom.productId,
      productCode: version.bom.product.productCode,
      productName: version.productVersion.productName,
      productVersionNo: version.productVersion.versionNo,
      versionNo: version.versionNo,
      status: version.status,
      createdAt: version.createdAt,
      componentsCount: version._count.components,
      operationsCount: version._count.operations,
      createdFromEco: version.createdFromEco
        ? {
          id: version.createdFromEco.id,
          title: version.createdFromEco.title
        }
        : null
    })),
    pagination: {
      page: currentPage,
      limit: take,
      total
    }
  };
};

export const getArchivedProducts = async ({ page, limit, currentUser }) => {
  const role = currentUser?.role;
  if (role === 'operations') {
    return {
      items: [],
      pagination: { page: 1, limit: 0, total: 0 }
    };
  }

  const where = { status: 'archived' };
  const { take, skip, currentPage } = parsePagination(page, limit);

  const [versions, total] = await prisma.$transaction([
    prisma.productVersion.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: {
        product: {
          select: {
            productCode: true
          }
        }
      }
    }),
    prisma.productVersion.count({ where })
  ]);

  return {
    items: versions.map((version) => ({
      id: version.id,
      productId: version.productId,
      productCode: version.product.productCode,
      productName: version.productName,
      versionNo: version.versionNo,
      archivedAt: version.updatedAt
    })),
    pagination: {
      page: currentPage,
      limit: take,
      total
    }
  };
};

export const getActiveMatrix = async () => {
  const products = await prisma.product.findMany({
    include: {
      versions: {
        where: { status: 'active' },
        orderBy: { versionNo: 'desc' },
        take: 1
      },
      bom: {
        include: {
          versions: {
            where: { status: 'active' },
            orderBy: { versionNo: 'desc' },
            take: 1,
            include: {
              _count: {
                select: {
                  components: true,
                  operations: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      productCode: 'asc'
    }
  });

  return products.map((product) => {
    const activeVersion = product.versions[0] ?? null;
    const activeBomVersion = product.bom?.versions[0] ?? null;

    return {
      productId: product.id,
      productCode: product.productCode,
      productName: activeVersion?.productName ?? null,
      productVersionNo: activeVersion?.versionNo ?? null,
      bomId: product.bom?.id ?? null,
      bomVersionNo: activeBomVersion?.versionNo ?? null,
      bomComponents: activeBomVersion?._count.components ?? 0,
      bomOperations: activeBomVersion?._count.operations ?? 0
    };
  });
};

export default {
  getEcosReport,
  getProductVersionHistory,
  getBomVersionHistory,
  getArchivedProducts,
  getActiveMatrix
};
