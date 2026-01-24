import { prisma } from '../../config/database.js';

/**
 * ECO Service
 * Business logic for ECO operations
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

const pickBomVersionNo = (versions = []) => {
  if (!Array.isArray(versions)) {
    return null;
  }
  const active = versions.find((version) => version.status === 'active');
  if (active) {
    return active.versionNo;
  }
  const versionOne = versions.find((version) => version.versionNo === 1);
  return versionOne ? versionOne.versionNo : null;
};

const normalizeOptionalValue = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
};

const parseRequiredId = (value, fieldName) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    const error = new Error(`${fieldName} must be a valid positive integer`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const parseOptionalId = (value, fieldName) => {
  if (value === null || value === undefined) {
    return null;
  }
  return parseRequiredId(value, fieldName);
};

const parseOptionalDate = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const resolveRaisedById = (raisedById, currentUser) => {
  if (raisedById === null || raisedById === undefined) {
    return currentUser.id;
  }

  if (currentUser.role !== 'admin' && raisedById !== currentUser.id) {
    const error = new Error('Only admins can override raisedById');
    error.statusCode = 403;
    throw error;
  }

  return raisedById;
};

const ecoProductVersionSelect = {
  select: {
    productName: true,
    status: true,
    versionNo: true
  },
  where: {
    OR: [{ status: 'active' }, { versionNo: 1 }]
  }
};

const ecoBomVersionSelect = {
  select: {
    versionNo: true,
    status: true
  },
  where: {
    OR: [{ status: 'active' }, { versionNo: 1 }]
  }
};

const ecoDetailSelect = {
  id: true,
  title: true,
  ecoType: true,
  status: true,
  effectiveDate: true,
  versionUpdate: true,
  createdAt: true,
  updatedAt: true,
  currentStage: {
    select: {
      id: true,
      name: true,
      sequenceOrder: true,
      approvalRequired: true
    }
  },
  product: {
    select: {
      id: true,
      productCode: true,
      versions: ecoProductVersionSelect
    }
  },
  bom: {
    select: {
      id: true,
      versions: ecoBomVersionSelect
    }
  },
  raisedBy: {
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true
    }
  }
};

const ecoListSelect = {
  id: true,
  title: true,
  ecoType: true,
  status: true,
  effectiveDate: true,
  versionUpdate: true,
  createdAt: true,
  updatedAt: true,
  currentStage: {
    select: {
      id: true,
      name: true,
      sequenceOrder: true
    }
  },
  product: {
    select: {
      id: true,
      productCode: true,
      versions: ecoProductVersionSelect
    }
  }
};

const formatEcoDetail = (eco) => {
  if (!eco) {
    return null;
  }

  const productName = pickProductName(eco.product?.versions);
  const bomVersionNo = pickBomVersionNo(eco.bom?.versions);

  return {
    id: eco.id,
    title: eco.title,
    ecoType: eco.ecoType,
    status: eco.status,
    effectiveDate: eco.effectiveDate,
    versionUpdate: eco.versionUpdate,
    createdAt: eco.createdAt,
    updatedAt: eco.updatedAt,
    currentStage: eco.currentStage,
    product: eco.product
      ? {
          id: eco.product.id,
          productCode: eco.product.productCode,
          productName
        }
      : null,
    bom: eco.bom
      ? {
          id: eco.bom.id,
          versionNo: bomVersionNo
        }
      : null,
    raisedBy: eco.raisedBy
      ? {
          id: eco.raisedBy.id,
          name: eco.raisedBy.name,
          loginId: eco.raisedBy.loginId,
          email: eco.raisedBy.email
        }
      : null
  };
};

const formatEcoListItem = (eco) => {
  const productName = pickProductName(eco.product?.versions);

  return {
    id: eco.id,
    title: eco.title,
    ecoType: eco.ecoType,
    status: eco.status,
    effectiveDate: eco.effectiveDate,
    versionUpdate: eco.versionUpdate,
    createdAt: eco.createdAt,
    updatedAt: eco.updatedAt,
    currentStage: eco.currentStage,
    product: eco.product
      ? {
          id: eco.product.id,
          productCode: eco.product.productCode,
          productName
        }
      : null
  };
};

const ensureEcoDraft = (eco) => {
  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  if (eco.status !== 'draft') {
    const error = new Error('Only draft ECOs can be modified');
    error.statusCode = 409;
    throw error;
  }
};

const ensureEcoStageExists = async () => {
  const stage = await prisma.ecoStage.findFirst({
    orderBy: {
      sequenceOrder: 'asc'
    }
  });

  if (!stage) {
    const error = new Error('ECO stages not configured. Please run database seed.');
    error.statusCode = 500;
    throw error;
  }

  return stage;
};

const getBaseProductVersion = async (tx, productId) => {
  const activeVersion = await tx.productVersion.findFirst({
    where: {
      productId,
      status: 'active'
    },
    orderBy: {
      versionNo: 'desc'
    },
    select: {
      id: true,
      productName: true,
      salePrice: true,
      costPrice: true,
      attachments: true,
      versionNo: true
    }
  });

  if (activeVersion) {
    return activeVersion;
  }

  const fallbackVersion = await tx.productVersion.findFirst({
    where: {
      productId
    },
    orderBy: {
      versionNo: 'asc'
    },
    select: {
      id: true,
      productName: true,
      salePrice: true,
      costPrice: true,
      attachments: true,
      versionNo: true
    }
  });

  if (!fallbackVersion) {
    const error = new Error('Base product version not found');
    error.statusCode = 404;
    throw error;
  }

  return fallbackVersion;
};

const getBaseBomVersion = async (tx, bomId) => {
  const activeVersion = await tx.bomVersion.findFirst({
    where: {
      bomId,
      status: 'active'
    },
    orderBy: {
      versionNo: 'desc'
    },
    include: {
      components: {
        select: {
          componentProductVersionId: true,
          quantity: true
        }
      },
      operations: {
        select: {
          operationName: true,
          timeMinutes: true,
          workCenter: true
        }
      }
    }
  });

  if (activeVersion) {
    return activeVersion;
  }

  const fallbackVersion = await tx.bomVersion.findFirst({
    where: {
      bomId
    },
    orderBy: {
      versionNo: 'asc'
    },
    include: {
      components: {
        select: {
          componentProductVersionId: true,
          quantity: true
        }
      },
      operations: {
        select: {
          operationName: true,
          timeMinutes: true,
          workCenter: true
        }
      }
    }
  });

  if (!fallbackVersion) {
    const error = new Error('Base BoM version not found');
    error.statusCode = 404;
    throw error;
  }

  return fallbackVersion;
};


const enforceEcoTypeRules = ({ ecoType, bomId }) => {
  if (ecoType === 'product') {
    return { ecoType, bomId: null };
  }

  if (ecoType === 'bom' && !bomId) {
    const error = new Error('bomId is required when ecoType is bom');
    error.statusCode = 400;
    throw error;
  }

  return { ecoType, bomId };
};

export const createEco = async (payload, currentUser) => {
  const stage = await ensureEcoStageExists();

  const normalizedEffectiveDate = parseOptionalDate(
    normalizeOptionalValue(payload.effectiveDate),
    'effectiveDate'
  );
  const productId = parseRequiredId(payload.productId, 'productId');
  const bomId = parseOptionalId(normalizeOptionalValue(payload.bomId), 'bomId');
  const raisedById = parseOptionalId(normalizeOptionalValue(payload.raisedById), 'raisedById');

  const resolvedRaisedById = resolveRaisedById(raisedById, currentUser);
  const { ecoType, bomId: normalizedBomId } = enforceEcoTypeRules({
    ecoType: payload.ecoType,
    bomId
  });

  const versionUpdate =
    typeof payload.versionUpdate === 'boolean' ? payload.versionUpdate : true;

  const eco = await prisma.eco.create({
    data: {
      title: payload.title,
      ecoType,
      productId,
      bomId: normalizedBomId,
      raisedById: resolvedRaisedById,
      effectiveDate: normalizedEffectiveDate,
      versionUpdate,
      currentStageId: stage.id,
      status: 'draft'
    },
    select: ecoDetailSelect
  });

  return formatEcoDetail(eco);
};

export const updateEco = async (ecoId, payload) => {
  const existingEco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      status: true,
      ecoType: true,
      bomId: true
    }
  });

  ensureEcoDraft(existingEco);

  const data = {};

  if (payload.title !== undefined) {
    data.title = payload.title;
  }

  if (payload.ecoType !== undefined) {
    data.ecoType = payload.ecoType;
  }

  if (payload.productId !== undefined) {
    data.productId = parseRequiredId(payload.productId, 'productId');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'bomId')) {
    const bomIdValue = normalizeOptionalValue(payload.bomId);
    data.bomId = parseOptionalId(bomIdValue, 'bomId');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'effectiveDate')) {
    const effectiveDateValue = normalizeOptionalValue(payload.effectiveDate);
    data.effectiveDate = parseOptionalDate(effectiveDateValue, 'effectiveDate');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'versionUpdate')) {
    data.versionUpdate = payload.versionUpdate;
  }

  const nextEcoType = data.ecoType ?? existingEco.ecoType;
  const nextBomId = Object.prototype.hasOwnProperty.call(data, 'bomId')
    ? data.bomId
    : existingEco.bomId;

  const normalized = enforceEcoTypeRules({
    ecoType: nextEcoType,
    bomId: nextBomId
  });

  data.ecoType = normalized.ecoType;
  data.bomId = normalized.bomId;

  const updatedEco = await prisma.eco.update({
    where: { id: ecoId },
    data,
    select: ecoDetailSelect
  });

  return formatEcoDetail(updatedEco);
};

export const startEco = async (ecoId) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      title: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true
    }
  });

  ensureEcoDraft(eco);

  if (!eco.title || !eco.ecoType || !eco.productId) {
    const error = new Error('ECO is missing mandatory fields');
    error.statusCode = 400;
    throw error;
  }

  const normalized = enforceEcoTypeRules({
    ecoType: eco.ecoType,
    bomId: eco.bomId
  });

  const operations = [];

  if (normalized.ecoType === 'product') {
    const existingDraft = await prisma.ecoProductChange.findUnique({
      where: { ecoId: eco.id },
      select: { id: true }
    });

    if (!existingDraft) {
      const baseVersion = await getBaseProductVersion(prisma, eco.productId);
      operations.push(
        prisma.ecoProductChange.create({
          data: {
            ecoId: eco.id,
            baseProductVersionId: baseVersion.id,
            newProductName: baseVersion.productName,
            newSalePrice: baseVersion.salePrice,
            newCostPrice: baseVersion.costPrice,
            newAttachments: baseVersion.attachments
          }
        })
      );
    }
  } else {
    const existingDraft = await prisma.ecoBomDraft.findUnique({
      where: { ecoId: eco.id },
      select: { id: true }
    });

    if (!existingDraft) {
      const bom = await prisma.bom.findUnique({
        where: { id: normalized.bomId },
        select: { productId: true }
      });

      if (!bom) {
        const error = new Error('BoM not found');
        error.statusCode = 404;
        throw error;
      }

      if (bom.productId !== eco.productId) {
        const error = new Error('BoM does not belong to the selected product');
        error.statusCode = 400;
        throw error;
      }

      const baseVersion = await getBaseBomVersion(prisma, normalized.bomId);

      const draftData = {
        ecoId: eco.id,
        baseBomVersionId: baseVersion.id
      };

      if (baseVersion.components.length > 0) {
        draftData.components = {
          createMany: {
            data: baseVersion.components.map((component) => ({
              componentProductVersionId: component.componentProductVersionId,
              quantity: component.quantity
            }))
          }
        };
      }

      if (baseVersion.operations.length > 0) {
        draftData.operations = {
          createMany: {
            data: baseVersion.operations.map((operation) => ({
              operationName: operation.operationName,
              timeMinutes: operation.timeMinutes,
              workCenter: operation.workCenter
            }))
          }
        };
      }

      operations.push(
        prisma.ecoBomDraft.create({
          data: draftData
        })
      );
    }
  }

  operations.push(
    prisma.eco.update({
      where: { id: ecoId },
      data: {
        status: 'in_progress',
        bomId: normalized.bomId
      },
      select: ecoDetailSelect
    })
  );

  const results = await prisma.$transaction(operations);
  const updatedEco = results[results.length - 1];

  return formatEcoDetail(updatedEco);
};

export const listEcos = async ({ q, ecoType, scope = 'all', currentUser }) => {
  const where = {};

  if (q && q.trim()) {
    where.title = {
      contains: q.trim(),
      mode: 'insensitive'
    };
  }

  if (ecoType) {
    where.ecoType = ecoType;
  }

  if (scope === 'mine' && currentUser?.id) {
    where.raisedById = currentUser.id;
  }

  const ecos = await prisma.eco.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    select: ecoListSelect
  });

  return ecos.map(formatEcoListItem);
};

export const getEcoById = async (ecoId) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: ecoDetailSelect
  });

  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  return formatEcoDetail(eco);
};

export default {
  createEco,
  updateEco,
  startEco,
  listEcos,
  getEcoById
};
