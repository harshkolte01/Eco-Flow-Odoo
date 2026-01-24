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

const ensureEcoType = (eco, expectedType) => {
  if (eco.ecoType !== expectedType) {
    const error = new Error(`ECO type must be ${expectedType}`);
    error.statusCode = 400;
    throw error;
  }
};

const parseOptionalDecimal = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const normalized = typeof value === 'string' ? value.trim() : value;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const parseOptionalInt = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a valid integer`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
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

  // Get the next stage (Approval stage - sequence order 2)
  const nextStage = await prisma.ecoStage.findFirst({
    where: {
      sequenceOrder: 2
    }
  });

  if (!nextStage) {
    const error = new Error('Approval stage not found. Please run database seed.');
    error.statusCode = 500;
    throw error;
  }

  operations.push(
    prisma.eco.update({
      where: { id: ecoId },
      data: {
        status: 'in_progress',
        bomId: normalized.bomId,
        currentStageId: nextStage.id
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
  const role = currentUser?.role;

  if (role === 'operations') {
    return [];
  }

  if (q && q.trim()) {
    where.title = {
      contains: q.trim(),
      mode: 'insensitive'
    };
  }

  if (ecoType) {
    where.ecoType = ecoType;
  }

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

export const getEcoProductDraft = async (ecoId) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true
    }
  });

  ensureEcoDraft(eco);
  ensureEcoType(eco, 'product');

  let draft = await prisma.ecoProductChange.findUnique({
    where: { ecoId: eco.id },
    include: {
      baseProductVersion: {
        select: {
          productName: true,
          salePrice: true,
          costPrice: true,
          attachments: true
        }
      }
    }
  });

  if (!draft) {
    const baseVersion = await getBaseProductVersion(prisma, eco.productId);
    draft = await prisma.ecoProductChange.create({
      data: {
        ecoId: eco.id,
        baseProductVersionId: baseVersion.id,
        newProductName: baseVersion.productName,
        newSalePrice: baseVersion.salePrice,
        newCostPrice: baseVersion.costPrice,
        newAttachments: baseVersion.attachments
      },
      include: {
        baseProductVersion: {
          select: {
            productName: true,
            salePrice: true,
            costPrice: true,
            attachments: true
          }
        }
      }
    });
  }

  return {
    base: draft.baseProductVersion,
    draft: {
      newProductName: draft.newProductName,
      newSalePrice: draft.newSalePrice,
      newCostPrice: draft.newCostPrice,
      newAttachments: draft.newAttachments
    }
  };
};

export const updateEcoProductDraft = async (ecoId, payload) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true
    }
  });

  ensureEcoDraft(eco);
  ensureEcoType(eco, 'product');

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'newProductName')) {
    data.newProductName = normalizeOptionalValue(payload.newProductName);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'newSalePrice')) {
    data.newSalePrice = parseOptionalDecimal(payload.newSalePrice, 'newSalePrice');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'newCostPrice')) {
    data.newCostPrice = parseOptionalDecimal(payload.newCostPrice, 'newCostPrice');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'newAttachments')) {
    data.newAttachments = normalizeOptionalValue(payload.newAttachments);
  }

  let draft = await prisma.ecoProductChange.findUnique({
    where: { ecoId: eco.id },
    include: {
      baseProductVersion: {
        select: {
          productName: true,
          salePrice: true,
          costPrice: true,
          attachments: true
        }
      }
    }
  });

  if (!draft) {
    const baseVersion = await getBaseProductVersion(prisma, eco.productId);
    draft = await prisma.ecoProductChange.create({
      data: {
        ecoId: eco.id,
        baseProductVersionId: baseVersion.id,
        newProductName:
          data.newProductName ?? baseVersion.productName,
        newSalePrice:
          data.newSalePrice ?? baseVersion.salePrice,
        newCostPrice:
          data.newCostPrice ?? baseVersion.costPrice,
        newAttachments:
          data.newAttachments ?? baseVersion.attachments
      },
      include: {
        baseProductVersion: {
          select: {
            productName: true,
            salePrice: true,
            costPrice: true,
            attachments: true
          }
        }
      }
    });
  } else {
    draft = await prisma.ecoProductChange.update({
      where: { ecoId: eco.id },
      data,
      include: {
        baseProductVersion: {
          select: {
            productName: true,
            salePrice: true,
            costPrice: true,
            attachments: true
          }
        }
      }
    });
  }

  return {
    base: draft.baseProductVersion,
    draft: {
      newProductName: draft.newProductName,
      newSalePrice: draft.newSalePrice,
      newCostPrice: draft.newCostPrice,
      newAttachments: draft.newAttachments
    }
  };
};

export const getEcoBomDraft = async (ecoId) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true
    }
  });

  ensureEcoDraft(eco);
  ensureEcoType(eco, 'bom');

  if (!eco.bomId) {
    const error = new Error('bomId is required for BoM ECOs');
    error.statusCode = 400;
    throw error;
  }

  let draft = await prisma.ecoBomDraft.findUnique({
    where: { ecoId: eco.id },
    include: {
      components: {
        select: {
          componentProductVersionId: true,
          quantity: true,
          componentProductVersion: {
            select: {
              productName: true,
              product: {
                select: {
                  productCode: true
                }
              }
            }
          }
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

  if (!draft) {
    const baseVersion = await getBaseBomVersion(prisma, eco.bomId);

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

    draft = await prisma.ecoBomDraft.create({
      data: draftData,
      include: {
        components: {
          select: {
            componentProductVersionId: true,
            quantity: true,
            componentProductVersion: {
              select: {
                productName: true,
                product: {
                  select: {
                    productCode: true
                  }
                }
              }
            }
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
  }

  return {
    components: draft.components.map((component) => ({
      componentProductVersionId: component.componentProductVersionId,
      quantity: component.quantity,
      productName: component.componentProductVersion.productName,
      productCode: component.componentProductVersion.product.productCode
    })),
    operations: draft.operations.map((operation) => ({
      operationName: operation.operationName,
      timeMinutes: operation.timeMinutes,
      workCenter: operation.workCenter
    }))
  };
};

export const updateEcoBomDraft = async (ecoId, payload) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true
    }
  });

  ensureEcoDraft(eco);
  ensureEcoType(eco, 'bom');

  if (!eco.bomId) {
    const error = new Error('bomId is required for BoM ECOs');
    error.statusCode = 400;
    throw error;
  }

  const components = Array.isArray(payload.components) ? payload.components : [];
  const operations = Array.isArray(payload.operations) ? payload.operations : [];

  const componentData = components.map((component, index) => {
    const componentProductVersionId = parseRequiredId(
      component.componentProductVersionId,
      `components[${index}].componentProductVersionId`
    );
    const quantity = parseOptionalDecimal(
      component.quantity,
      `components[${index}].quantity`
    );
    if (quantity === null) {
      const error = new Error(`components[${index}].quantity is required`);
      error.statusCode = 400;
      throw error;
    }
    return {
      componentProductVersionId,
      quantity
    };
  });

  const operationData = operations.map((operation, index) => {
    if (!operation.operationName || !String(operation.operationName).trim()) {
      const error = new Error(`operations[${index}].operationName is required`);
      error.statusCode = 400;
      throw error;
    }
    const timeMinutes = parseOptionalInt(
      operation.timeMinutes,
      `operations[${index}].timeMinutes`
    );
    if (timeMinutes === null) {
      const error = new Error(`operations[${index}].timeMinutes is required`);
      error.statusCode = 400;
      throw error;
    }
    return {
      operationName: String(operation.operationName).trim(),
      timeMinutes,
      workCenter: normalizeOptionalValue(operation.workCenter)
    };
  });

  let draft = await prisma.ecoBomDraft.findUnique({
    where: { ecoId: eco.id },
    select: { id: true }
  });

  if (!draft) {
    const baseVersion = await getBaseBomVersion(prisma, eco.bomId);
    const createData = {
      ecoId: eco.id,
      baseBomVersionId: baseVersion.id
    };

    if (componentData.length > 0) {
      createData.components = {
        createMany: {
          data: componentData
        }
      };
    }

    if (operationData.length > 0) {
      createData.operations = {
        createMany: {
          data: operationData
        }
      };
    }

    await prisma.ecoBomDraft.create({
      data: createData
    });
  } else {
    const operationsList = [
      prisma.ecoBomComponent.deleteMany({
        where: { ecoBomDraftId: draft.id }
      }),
      prisma.ecoBomOperation.deleteMany({
        where: { ecoBomDraftId: draft.id }
      })
    ];

    if (componentData.length > 0) {
      operationsList.push(
        prisma.ecoBomComponent.createMany({
          data: componentData.map((component) => ({
            ecoBomDraftId: draft.id,
            componentProductVersionId: component.componentProductVersionId,
            quantity: component.quantity
          }))
        })
      );
    }

    if (operationData.length > 0) {
      operationsList.push(
        prisma.ecoBomOperation.createMany({
          data: operationData.map((operation) => ({
            ecoBomDraftId: draft.id,
            operationName: operation.operationName,
            timeMinutes: operation.timeMinutes,
            workCenter: operation.workCenter
          }))
        })
      );
    }

    await prisma.$transaction(operationsList);
  }

  return getEcoBomDraft(ecoId);
};

export default {
  createEco,
  updateEco,
  startEco,
  listEcos,
  getEcoById,
  getEcoProductDraft,
  updateEcoProductDraft,
  getEcoBomDraft,
  updateEcoBomDraft
};
