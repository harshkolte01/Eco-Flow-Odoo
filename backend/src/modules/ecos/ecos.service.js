import { prisma } from '../../config/database.js';
import approversService from '../stages/approvers.service.js';

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

const pickProductUpdatedAt = (versions = []) => {
  if (!Array.isArray(versions)) {
    return null;
  }
  const active = versions.find((version) => version.status === 'active');
  if (active) {
    return active.updatedAt;
  }
  const versionOne = versions.find((version) => version.versionNo === 1);
  return versionOne ? versionOne.updatedAt : null;
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
    versionNo: true,
    updatedAt: true
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
  }
};

const formatEcoDetail = (eco) => {
  if (!eco) {
    return null;
  }

  const productName = pickProductName(eco.product?.versions);
  const productUpdatedAt = pickProductUpdatedAt(eco.product?.versions);
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
    productUpdatedAt,
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
  const productUpdatedAt = pickProductUpdatedAt(eco.product?.versions);

  return {
    id: eco.id,
    title: eco.title,
    ecoType: eco.ecoType,
    status: eco.status,
    effectiveDate: eco.effectiveDate,
    versionUpdate: eco.versionUpdate,
    createdAt: eco.createdAt,
    updatedAt: eco.updatedAt,
    productUpdatedAt,
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

const ensureEcoCreatorRole = (currentUser) => {
  if (!currentUser) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  if (!['engineering', 'admin'].includes(currentUser.role)) {
    const error = new Error('Only engineering or admin users can create ECOs');
    error.statusCode = 403;
    throw error;
  }
};

const ensureEcoReadableByUser = (eco, currentUser) => {
  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  if (!currentUser) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  if (currentUser.role === 'operations') {
    const error = new Error('Operations users cannot access ECOs');
    error.statusCode = 403;
    throw error;
  }

  const ecoOwnerId = eco.raisedById ?? eco.raisedBy?.id;

  if (currentUser.role === 'engineering' && ecoOwnerId !== currentUser.id) {
    const error = new Error('You do not have access to this ECO');
    error.statusCode = 403;
    throw error;
  }
};

const ensureEcoEditableByUser = (eco, currentUser) => {
  ensureEcoReadableByUser(eco, currentUser);

  if (currentUser.role === 'approver') {
    const error = new Error('Approvers cannot modify ECOs');
    error.statusCode = 403;
    throw error;
  }

  const ecoOwnerId = eco.raisedById ?? eco.raisedBy?.id;

  if (currentUser.role === 'engineering' && ecoOwnerId !== currentUser.id) {
    const error = new Error('Only the ECO owner can modify this record');
    error.statusCode = 403;
    throw error;
  }
};

const ensureEcoReadable = (eco) => {
  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  const readableStatuses = new Set(['draft', 'in_progress', 'approved', 'applied']);
  if (!readableStatuses.has(eco.status)) {
    const error = new Error('ECO is not available for review');
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

  const error = new Error('Active product version not found');
  error.statusCode = 400;
  throw error;
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

  const error = new Error('Active BoM version not found');
  error.statusCode = 400;
  throw error;
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
  ensureEcoCreatorRole(currentUser);
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

  const createdEcoId = await prisma.$transaction(async (tx) => {
    const createdEco = await tx.eco.create({
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
      select: { id: true }
    });

    await tx.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(createdEco.id),
        action: 'created',
        performedById: currentUser?.id ?? resolvedRaisedById,
        newValue: { status: 'draft', stageId: stage.id }
      }
    });

    return createdEco.id;
  });

  const eco = await prisma.eco.findUnique({
    where: { id: createdEcoId },
    select: ecoDetailSelect
  });

  return formatEcoDetail(eco);
};

export const updateEco = async (ecoId, payload, currentUser) => {
  const existingEco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      status: true,
      ecoType: true,
      bomId: true,
      raisedById: true,
      title: true,
      productId: true,
      effectiveDate: true,
      versionUpdate: true
    }
  });

  ensureEcoEditableByUser(existingEco, currentUser);
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

  const changedFields = Object.keys(data).filter((field) => {
    const previousValue =
      existingEco[field] instanceof Date ? existingEco[field].toISOString() : existingEco[field];
    const nextValue = data[field] instanceof Date ? data[field].toISOString() : data[field];
    return previousValue !== nextValue;
  });
  const updatedEco = await prisma.$transaction(async (tx) => {
    const updated = await tx.eco.update({
      where: { id: ecoId },
      data,
      select: ecoDetailSelect
    });

    if (changedFields.length > 0) {
      const oldValue = {};
      const newValue = {};
      changedFields.forEach((field) => {
        oldValue[field] = existingEco[field];
        newValue[field] = data[field];
      });

      await tx.auditLog.create({
        data: {
          entityType: 'eco',
          entityId: String(ecoId),
          action: 'updated',
          performedById: currentUser?.id ?? existingEco.raisedById,
          oldValue,
          newValue
        }
      });
    }

    return updated;
  }, { maxWait: 5000, timeout: 20000 });

  return formatEcoDetail(updatedEco);
};

export const startEco = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      title: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true,
      currentStageId: true,
      raisedById: true
    }
  });

  ensureEcoEditableByUser(eco, currentUser);
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

  // Verify that the draft has actual changes before starting
  if (normalized.ecoType === 'product') {
    const draft = await prisma.ecoProductChange.findUnique({
      where: { ecoId: eco.id }
    });
    
    if (draft) {
      const baseVersion = await prisma.productVersion.findUnique({
        where: { id: draft.baseProductVersionId }
      });
      
      const hasChanges = 
        draft.newProductName !== baseVersion.productName ||
        Number(draft.newSalePrice) !== Number(baseVersion.salePrice) ||
        Number(draft.newCostPrice) !== Number(baseVersion.costPrice) ||
        JSON.stringify(draft.newAttachments) !== JSON.stringify(baseVersion.attachments);
        
      if (!hasChanges) {
        const error = new Error('No changes detected in product draft. Cannot start ECO.');
        error.statusCode = 400;
        throw error;
      }
    }
  } else {
    const draft = await prisma.ecoBomDraft.findUnique({
      where: { ecoId: eco.id },
      include: { 
        components: true, 
        operations: true,
        baseBomVersion: {
          include: { components: true, operations: true }
        }
      }
    });

    if (draft) {
      const componentsChanged = draft.components.length !== draft.baseBomVersion.components.length ||
        draft.components.some((c, i) => {
          const bc = draft.baseBomVersion.components[i];
          return !bc || c.componentProductVersionId !== bc.componentProductVersionId || Number(c.quantity) !== Number(bc.quantity);
        });

      const operationsChanged = draft.operations.length !== draft.baseBomVersion.operations.length ||
        draft.operations.some((o, i) => {
          const bo = draft.baseBomVersion.operations[i];
          return !bo || o.operationName !== bo.operationName || o.timeMinutes !== bo.timeMinutes || o.workCenter !== bo.workCenter;
        });

      if (!componentsChanged && !operationsChanged) {
        const error = new Error('No changes detected in BoM draft. Cannot start ECO.');
        error.statusCode = 400;
        throw error;
      }
    }
  }

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

  const currentStage = await prisma.ecoStage.findUnique({
    where: { id: eco.currentStageId },
    select: { sequenceOrder: true }
  });

  if (!currentStage) {
    const error = new Error('Current ECO stage not found');
    error.statusCode = 500;
    throw error;
  }

  const nextStage = await prisma.ecoStage.findFirst({
    where: {
      sequenceOrder: {
        gt: currentStage.sequenceOrder
      }
    },
    orderBy: {
      sequenceOrder: 'asc'
    }
  });

  if (!nextStage) {
    const error = new Error('Next ECO stage not found. Please check stage configuration.');
    error.statusCode = 500;
    throw error;
  }

  operations.push(
    prisma.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(ecoId),
        action: 'started',
        performedById: currentUser?.id ?? eco.raisedById,
        newValue: { status: 'in_progress', stageId: nextStage.id }
      }
    })
  );

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

export const getEcoById = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: ecoDetailSelect
  });

  ensureEcoReadableByUser(eco, currentUser);

  return formatEcoDetail(eco);
};

export const getEcoProductDraft = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      raisedById: true
    }
  });

  ensureEcoReadableByUser(eco, currentUser);
  ensureEcoReadable(eco);
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
    if (eco.status !== 'draft') {
      const error = new Error('Draft changes not found for this ECO');
      error.statusCode = 404;
      throw error;
    }
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

export const updateEcoProductDraft = async (ecoId, payload, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      raisedById: true
    }
  });

  ensureEcoEditableByUser(eco, currentUser);
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

  const response = {
    base: draft.baseProductVersion,
    draft: {
      newProductName: draft.newProductName,
      newSalePrice: draft.newSalePrice,
      newCostPrice: draft.newCostPrice,
      newAttachments: draft.newAttachments
    }
  };

  const changedFields = Object.keys(data).filter((field) => {
    const oldValue = draft[field];
    const newValue = data[field];
    
    // Simple comparison for JSON/Decimal/String
    if (field === 'newAttachments') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }
    return String(oldValue) !== String(newValue);
  });

  if (changedFields.length > 0) {
    const oldValueLog = {};
    const newValueLog = {};
    changedFields.forEach((field) => {
      oldValueLog[field] = draft[field];
      newValueLog[field] = data[field];
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(ecoId),
        action: 'draft_updated',
        performedById: currentUser?.id ?? eco.raisedById,
        oldValue: { ecoType: 'product', ...oldValueLog },
        newValue: { ecoType: 'product', ...newValueLog }
      }
    });
  }

  return response;
};

export const getEcoBomDraft = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true,
      raisedById: true
    }
  });

  ensureEcoReadableByUser(eco, currentUser);
  ensureEcoReadable(eco);
  ensureEcoType(eco, 'bom');

  if (!eco.bomId) {
    const error = new Error('bomId is required for BoM ECOs');
    error.statusCode = 400;
    throw error;
  }

  let draft = await prisma.ecoBomDraft.findUnique({
    where: { ecoId: eco.id },
    include: {
      baseBomVersion: {
        include: {
          components: {
            include: {
              componentProductVersion: {
                include: {
                  product: true
                }
              }
            }
          },
          operations: true
        }
      },
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
    if (eco.status !== 'draft') {
      const error = new Error('Draft changes not found for this ECO');
      error.statusCode = 404;
      throw error;
    }
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
    base: {
      components: draft.baseBomVersion.components.map((component) => ({
        componentProductVersionId: component.componentProductVersionId,
        quantity: component.quantity,
        productName: component.componentProductVersion.productName,
        productCode: component.componentProductVersion.product.productCode
      })),
      operations: draft.baseBomVersion.operations.map((operation) => ({
        operationName: operation.operationName,
        timeMinutes: operation.timeMinutes,
        workCenter: operation.workCenter
      }))
    },
    draft: {
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
    }
  };
};

export const updateEcoBomDraft = async (ecoId, payload, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    select: {
      id: true,
      ecoType: true,
      status: true,
      productId: true,
      bomId: true,
      raisedById: true
    }
  });

  ensureEcoEditableByUser(eco, currentUser);
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

  const response = await getEcoBomDraft(ecoId, currentUser);

  await prisma.auditLog.create({
    data: {
      entityType: 'eco',
      entityId: String(ecoId),
      action: 'draft_updated',
      performedById: currentUser?.id ?? eco.raisedById,
      newValue: {
        ecoType: 'bom',
        components: componentData.length,
        operations: operationData.length
      }
    }
  });

  return response;
};

const ensureEcoInProgress = (eco) => {
  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  if (eco.status !== 'in_progress') {
    const error = new Error('ECO must be in progress to perform this action');
    error.statusCode = 409;
    throw error;
  }
};

const ensureApproverRole = (currentUser) => {
  if (currentUser.role !== 'approver' && currentUser.role !== 'admin') {
    const error = new Error('Only approvers or admins can perform this action');
    error.statusCode = 403;
    throw error;
  }
};

const getNextStage = async (currentSequenceOrder) => {
  return prisma.ecoStage.findFirst({
    where: {
      sequenceOrder: {
        gt: currentSequenceOrder
      }
    },
    orderBy: {
      sequenceOrder: 'asc'
    }
  });
};

const getFirstStage = async () => {
  return prisma.ecoStage.findFirst({
    orderBy: {
      sequenceOrder: 'asc'
    }
  });
};

const isFinalStage = async (stageId) => {
  const nextStage = await prisma.ecoStage.findFirst({
    where: {
      sequenceOrder: {
        gt: (await prisma.ecoStage.findUnique({ where: { id: stageId } })).sequenceOrder
      }
    }
  });
  return !nextStage;
};

export const approveEco = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    include: {
      currentStage: true
    }
  });

  ensureEcoInProgress(eco);
  ensureApproverRole(currentUser);

  if (!eco.currentStage.approvalRequired) {
    const error = new Error('Current stage does not require approval. Use validate instead.');
    error.statusCode = 400;
    throw error;
  }

  // Record this user's approval
  await prisma.ecoApproval.create({
    data: {
      ecoId: eco.id,
      stageId: eco.currentStageId,
      approverId: currentUser.id,
      status: 'approved',
      actionDate: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'eco',
      entityId: String(ecoId),
      action: 'approved_by_user',
      performedById: currentUser.id,
      newValue: { stageId: eco.currentStageId, approverId: currentUser.id }
    }
  });

  // Check if all required approvals are met
  const approvalCheck = await approversService.canProceedToNextStage(ecoId, eco.currentStageId);

  // If can't proceed yet, return current state
  if (!approvalCheck.canProceed) {
    const updatedEco = await prisma.eco.findUnique({
      where: { id: ecoId },
      select: ecoDetailSelect
    });
    return formatEcoDetail(updatedEco);
  }

  // All required approvals met, proceed to next stage
  const nextStage = await getNextStage(eco.currentStage.sequenceOrder);

  if (!nextStage) {
    const error = new Error('No next stage found');
    error.statusCode = 500;
    throw error;
  }

  const nextStageIsFinal = await isFinalStage(nextStage.id);

  const updatedEcoId = await prisma.$transaction(async (tx) => {
    const ecoUpdate = await tx.eco.update({
      where: { id: ecoId },
      data: {
        currentStageId: nextStage.id,
        status: nextStageIsFinal ? 'approved' : 'in_progress'
      },
      select: { id: true }
    });

    await tx.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(ecoId),
        action: 'stage_completed',
        performedById: currentUser.id,
        newValue: { stageId: nextStage.id, status: nextStageIsFinal ? 'approved' : 'in_progress' }
      }
    });

    return ecoUpdate.id;
  });

  if (nextStageIsFinal) {
    try {
      await applyEcoChanges(ecoId, currentUser.id);
    } catch (error) {
      await prisma.eco.update({
        where: { id: ecoId },
        data: {
          currentStageId: eco.currentStageId,
          status: 'in_progress'
        }
      });
      throw error;
    }
  }

  const updatedEco = await prisma.eco.findUnique({
    where: { id: updatedEcoId },
    select: ecoDetailSelect
  });

  return formatEcoDetail(updatedEco);
};

export const validateEco = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    include: {
      currentStage: true
    }
  });

  ensureEcoInProgress(eco);
  ensureApproverRole(currentUser);

  if (eco.currentStage.approvalRequired) {
    const error = new Error('Current stage requires approval. Use approve instead.');
    error.statusCode = 400;
    throw error;
  }

  const nextStage = await getNextStage(eco.currentStage.sequenceOrder);

  if (!nextStage) {
    const error = new Error('No next stage found');
    error.statusCode = 500;
    throw error;
  }

  const nextStageIsFinal = await isFinalStage(nextStage.id);

  let updatedEco = await prisma.eco.update({
    where: { id: ecoId },
    data: {
      currentStageId: nextStage.id,
      status: nextStageIsFinal ? 'approved' : 'in_progress'
    },
    select: ecoDetailSelect
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'eco',
      entityId: String(ecoId),
      action: 'validated',
      performedById: currentUser.id,
      newValue: { stageId: nextStage.id }
    }
  });

  if (nextStageIsFinal) {
    try {
      await applyEcoChanges(ecoId, currentUser.id);
      updatedEco = await prisma.eco.findUnique({
        where: { id: ecoId },
        select: ecoDetailSelect
      });
    } catch (error) {
      await prisma.eco.update({
        where: { id: ecoId },
        data: {
          currentStageId: eco.currentStageId,
          status: 'in_progress'
        }
      });
      throw error;
    }
  }

  return formatEcoDetail(updatedEco);
};

export const rejectEco = async (ecoId, currentUser) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    include: {
      currentStage: true
    }
  });

  ensureEcoInProgress(eco);
  ensureApproverRole(currentUser);

  const firstStage = await getFirstStage();

  if (!firstStage) {
    const error = new Error('First stage not found');
    error.statusCode = 500;
    throw error;
  }

  const updatedEco = await prisma.$transaction(async (tx) => {
    await tx.ecoApproval.create({
      data: {
        ecoId: eco.id,
        stageId: eco.currentStageId,
        approverId: currentUser.id,
        status: 'rejected',
        actionDate: new Date()
      }
    });

    const ecoUpdate = await tx.eco.update({
      where: { id: ecoId },
      data: {
        currentStageId: firstStage.id,
        status: 'draft'
      },
      select: ecoDetailSelect
    });

    await tx.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(ecoId),
        action: 'rejected',
        performedById: currentUser.id,
        newValue: { stageId: firstStage.id, status: 'draft' }
      }
    });

    return ecoUpdate;
  });

  return formatEcoDetail(updatedEco);
};

export const applyEcoChanges = async (ecoId, performedById) => {
  const eco = await prisma.eco.findUnique({
    where: { id: ecoId },
    include: {
      currentStage: true,
      productChange: true,
      bomDraft: {
        include: {
          components: true,
          operations: true
        }
      }
    }
  });

  if (!eco) {
    const error = new Error('ECO not found');
    error.statusCode = 404;
    throw error;
  }

  if (eco.status !== 'approved') {
    const error = new Error('Only approved ECOs can be applied');
    error.statusCode = 409;
    throw error;
  }

  const resolvedPerformedById = performedById ?? eco.raisedById;

  return await prisma.$transaction(async (tx) => {
    let result;

    if (eco.ecoType === 'product') {
      const draft = eco.productChange;
      if (!draft) {
        throw new Error('No product changes found in ECO');
      }

      const baseVersion = await tx.productVersion.findUnique({
        where: { id: draft.baseProductVersionId }
      });
      if (!baseVersion) {
        const error = new Error('Base product version not found');
        error.statusCode = 409;
        throw error;
      }
      if (baseVersion.status !== 'active') {
        const error = new Error('Base product version is no longer active');
        error.statusCode = 409;
        throw error;
      }

      if (eco.versionUpdate) {
        // Create new version
        const lastVersion = await tx.productVersion.findFirst({
          where: { productId: eco.productId },
          orderBy: { versionNo: 'desc' }
        });

        const nextVersionNo = lastVersion ? lastVersion.versionNo + 1 : 1;

        // Archive current active version
        await tx.productVersion.updateMany({
          where: { productId: eco.productId, status: 'active' },
          data: { status: 'archived' }
        });

        result = await tx.productVersion.create({
          data: {
            productId: eco.productId,
            versionNo: nextVersionNo,
            productName: draft.newProductName ?? baseVersion.productName,
            salePrice: draft.newSalePrice ?? baseVersion.salePrice,
            costPrice: draft.newCostPrice ?? baseVersion.costPrice,
            attachments: draft.newAttachments ?? baseVersion.attachments,
            status: 'active',
            createdFromEcoId: eco.id
          }
        });

        await tx.versionActivationLog.create({
          data: {
            ecoId: eco.id,
            oldProductVersionId: baseVersion.id,
            newProductVersionId: result.id,
            entityType: 'product'
          }
        });
      } else {
        // Update current version
        result = await tx.productVersion.update({
          where: { id: draft.baseProductVersionId },
          data: {
            productName: draft.newProductName ?? baseVersion.productName,
            salePrice: draft.newSalePrice ?? baseVersion.salePrice,
            costPrice: draft.newCostPrice ?? baseVersion.costPrice,
            attachments: draft.newAttachments ?? baseVersion.attachments
          }
        });
      }
    } else if (eco.ecoType === 'bom') {
      const draft = eco.bomDraft;
      if (!draft) {
        throw new Error('No BoM changes found in ECO');
      }

      const baseVersion = await tx.bomVersion.findUnique({
        where: { id: draft.baseBomVersionId }
      });
      if (!baseVersion) {
        const error = new Error('Base BoM version not found');
        error.statusCode = 409;
        throw error;
      }
      if (baseVersion.status !== 'active') {
        const error = new Error('Base BoM version is no longer active');
        error.statusCode = 409;
        throw error;
      }

      if (eco.versionUpdate) {
        // Create new BoM version
        const lastVersion = await tx.bomVersion.findFirst({
          where: { bomId: eco.bomId },
          orderBy: { versionNo: 'desc' }
        });

        const nextVersionNo = lastVersion ? lastVersion.versionNo + 1 : 1;

        // Get current active product version
        const activeProductVersion = await tx.productVersion.findFirst({
          where: { productId: eco.productId, status: 'active' }
        });

        if (!activeProductVersion) {
          throw new Error('No active product version found to link BoM');
        }

        // Archive current active BoM version
        await tx.bomVersion.updateMany({
          where: { bomId: eco.bomId, status: 'active' },
          data: { status: 'archived' }
        });

        const createData = {
          bomId: eco.bomId,
          versionNo: nextVersionNo,
          productVersionId: activeProductVersion.id,
          status: 'active',
          createdFromEcoId: eco.id
        };

        if (draft.components.length > 0) {
          createData.components = {
            createMany: {
              data: draft.components.map((c) => ({
                componentProductVersionId: c.componentProductVersionId,
                quantity: c.quantity
              }))
            }
          };
        }

        if (draft.operations.length > 0) {
          createData.operations = {
            createMany: {
              data: draft.operations.map((o) => ({
                operationName: o.operationName,
                timeMinutes: o.timeMinutes,
                workCenter: o.workCenter
              }))
            }
          };
        }

        result = await tx.bomVersion.create({
          data: createData
        });

        await tx.versionActivationLog.create({
          data: {
            ecoId: eco.id,
            oldBomVersionId: baseVersion.id,
            newBomVersionId: result.id,
            entityType: 'bom'
          }
        });
      } else {
        // Update current version - delete old and recreate components/operations
        await tx.bomComponent.deleteMany({ where: { bomVersionId: baseVersion.id } });
        await tx.bomOperation.deleteMany({ where: { bomVersionId: baseVersion.id } });

        const updateData = {};
        if (draft.components.length > 0) {
          updateData.components = {
            createMany: {
              data: draft.components.map((c) => ({
                componentProductVersionId: c.componentProductVersionId,
                quantity: c.quantity
              }))
            }
          };
        }
        if (draft.operations.length > 0) {
          updateData.operations = {
            createMany: {
              data: draft.operations.map((o) => ({
                operationName: o.operationName,
                timeMinutes: o.timeMinutes,
                workCenter: o.workCenter
              }))
            }
          };
        }
        if (Object.keys(updateData).length === 0) {
          updateData.updatedAt = new Date();
        }

        result = await tx.bomVersion.update({
          where: { id: baseVersion.id },
          data: updateData
        });
      }
    }

    // Mark ECO as applied
    await tx.eco.update({
      where: { id: ecoId },
      data: { status: 'applied' }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        entityType: 'eco',
        entityId: String(ecoId),
        action: 'applied',
        performedById: resolvedPerformedById,
        newValue: { versionUpdate: eco.versionUpdate, entityId: result.id }
      }
    });

    return result;
  }, { maxWait: 5000, timeout: 20000 });
};

export default {
  createEco,
  updateEco,
  startEco,
  approveEco,
  validateEco,
  rejectEco,
  listEcos,
  getEcoById,
  getEcoProductDraft,
  updateEcoProductDraft,
  getEcoBomDraft,
  updateEcoBomDraft
};
