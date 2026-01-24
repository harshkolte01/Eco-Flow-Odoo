import * as stagesService from './stages.service.js';
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

export default {
  listStagesController,
  createStageController,
  updateStageController,
  deleteStageController
};
