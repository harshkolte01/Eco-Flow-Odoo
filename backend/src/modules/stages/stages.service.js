import { prisma } from '../../config/database.js';

/**
 * ECO Stages Service
 * Business logic for ECO stage management
 */

const ensureStageExists = (stage) => {
  if (!stage) {
    const error = new Error('ECO stage not found');
    error.statusCode = 404;
    throw error;
  }
};

const checkDuplicateName = async (name, stageId) => {
  if (!name) {
    return;
  }
  const existing = await prisma.ecoStage.findFirst({
    where: {
      name,
      ...(stageId ? { id: { not: stageId } } : {})
    },
    select: { id: true }
  });

  if (existing) {
    const error = new Error('Stage name already exists');
    error.statusCode = 409;
    throw error;
  }
};

const checkDuplicateSequence = async (sequenceOrder, stageId) => {
  if (!sequenceOrder) {
    return;
  }
  const existing = await prisma.ecoStage.findFirst({
    where: {
      sequenceOrder,
      ...(stageId ? { id: { not: stageId } } : {})
    },
    select: { id: true, sequenceOrder: true }
  });

  if (existing) {
    const error = new Error('Stage sequence order already exists. To reorder stages, swap the sequence orders or update multiple stages in a transaction.');
    error.statusCode = 409;
    throw error;
  }
};

export const listStages = async () => {
  const stages = await prisma.ecoStage.findMany({
    include: {
      stageApprovers: {
        select: {
          id: true
        }
      },
      _count: {
        select: {
          ecos: true
        }
      }
    },
    orderBy: {
      sequenceOrder: 'asc'
    }
  });

  return stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    sequenceOrder: stage.sequenceOrder,
    approvalRequired: stage.approvalRequired,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt,
    approverCount: stage.stageApprovers.length,
    ecoCount: stage._count.ecos
  }));
};

export const createStage = async ({ name, sequenceOrder, approvalRequired }) => {
  await checkDuplicateName(name);
  await checkDuplicateSequence(sequenceOrder);

  return prisma.ecoStage.create({
    data: {
      name,
      sequenceOrder,
      approvalRequired
    }
  });
};

export const updateStage = async (stageId, payload) => {
  const stage = await prisma.ecoStage.findUnique({
    where: { id: stageId }
  });

  ensureStageExists(stage);

  if (payload.name !== undefined) {
    await checkDuplicateName(payload.name, stageId);
  }

  if (payload.sequenceOrder !== undefined) {
    await checkDuplicateSequence(payload.sequenceOrder, stageId);
  }

  return prisma.ecoStage.update({
    where: { id: stageId },
    data: {
      name: payload.name ?? stage.name,
      sequenceOrder: payload.sequenceOrder ?? stage.sequenceOrder,
      approvalRequired: payload.approvalRequired ?? stage.approvalRequired
    }
  });
};

export const deleteStage = async (stageId) => {
  const [stage, totalStages, ecoCount, approvalCount, ruleCount] = await prisma.$transaction([
    prisma.ecoStage.findUnique({
      where: { id: stageId }
    }),
    prisma.ecoStage.count(),
    prisma.eco.count({
      where: { currentStageId: stageId }
    }),
    prisma.ecoApproval.count({
      where: { stageId }
    }),
    prisma.approvalRule.count({
      where: {
        isArchived: false,
        stageIds: { has: stageId }
      }
    })
  ]);

  ensureStageExists(stage);

  if (totalStages <= 1) {
    const error = new Error('At least one ECO stage must remain');
    error.statusCode = 409;
    throw error;
  }

  if (ecoCount > 0 || approvalCount > 0) {
    const error = new Error('Stage cannot be removed while linked to ECOs or approvals');
    error.statusCode = 409;
    throw error;
  }

  if (ruleCount > 0) {
    const error = new Error('Stage cannot be removed while linked to approval rules');
    error.statusCode = 409;
    throw error;
  }

  return prisma.ecoStage.delete({
    where: { id: stageId }
  });
};

export default {
  listStages,
  createStage,
  updateStage,
  deleteStage
};
