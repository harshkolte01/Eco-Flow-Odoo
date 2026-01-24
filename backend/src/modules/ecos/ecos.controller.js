import * as ecosService from './ecos.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * ECO Controllers
 * Handle HTTP requests for ECO endpoints
 */

export const createEcoController = asyncHandler(async (req, res) => {
  const eco = await ecosService.createEco(req.body, req.user);

  success(res, { eco }, 201);
});

export const updateEcoController = asyncHandler(async (req, res) => {
  const ecoId = parseInt(req.params.id, 10);

  const eco = await ecosService.updateEco(ecoId, req.body);

  success(res, { eco }, 200);
});

export const startEcoController = asyncHandler(async (req, res) => {
  const ecoId = parseInt(req.params.id, 10);

  const eco = await ecosService.startEco(ecoId);

  success(res, { eco }, 200);
});

export const listEcosController = asyncHandler(async (req, res) => {
  const { q, ecoType, scope } = req.query;

  const ecos = await ecosService.listEcos({ q, ecoType, scope, currentUser: req.user });

  success(res, { ecos }, 200);
});

export const getEcoByIdController = asyncHandler(async (req, res) => {
  const ecoId = parseInt(req.params.id, 10);

  const eco = await ecosService.getEcoById(ecoId);

  success(res, { eco }, 200);
});

export default {
  createEcoController,
  updateEcoController,
  startEcoController,
  listEcosController,
  getEcoByIdController
};
