import * as stagesService from './stages.service.js';
import approversService from './approvers.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * ECO Stages Controllers
 * Handle HTTP requests for ECO stage management
 */

export const listStagesController = asyncHandler(async (req, res) => {
  const stages = await stagesService.listStages();

  success(res, { stages }, 200);
});

export const createStageController = asyncHandler(async (req, res) => {
  const stage = await stagesService.createStage(req.body);

  success(res, { stage }, 201);
});

export const updateStageController = asyncHandler(async (req, res) => {
  const stageId = parseInt(req.params.id, 10);

  const stage = await stagesService.updateStage(stageId, req.body);

  success(res, { stage }, 200);
});

export const deleteStageController = asyncHandler(async (req, res) => {
  const stageId = parseInt(req.params.id, 10);

  const stage = await stagesService.deleteStage(stageId);

  success(res, { stage }, 200);
});

/**
 * Stage Approvers Controllers
 */

export const getStageApproversController = asyncHandler(async (req, res) => {
  const stageId = parseInt(req.params.id, 10);
  const approvers = await approversService.getStageApprovers(stageId);

  success(res, { approvers }, 200);
});

export const addStageApproverController = asyncHandler(async (req, res) => {
  const stageId = parseInt(req.params.id, 10);
  const { userId, approvalCategory } = req.body;

  const approver = await approversService.addStageApprover(stageId, userId, approvalCategory);

  success(res, { approver }, 201);
});

export const updateApproverCategoryController = asyncHandler(async (req, res) => {
  const approverId = parseInt(req.params.approverId, 10);
  const { approvalCategory } = req.body;

  const approver = await approversService.updateApproverCategory(approverId, approvalCategory);

  success(res, { approver }, 200);
});

export const removeStageApproverController = asyncHandler(async (req, res) => {
  const approverId = parseInt(req.params.approverId, 10);

  const result = await approversService.removeStageApprover(approverId);

  success(res, result, 200);
});

export default {
  listStagesController,
  createStageController,
  updateStageController,
  deleteStageController,
  getStageApproversController,
  addStageApproverController,
  updateApproverCategoryController,
  removeStageApproverController
};
