import { Router } from 'express';
import {
  listTypes,
  createType,
  getBalances,
  listAllocations,
  createAllocation,
  listRequests,
  createRequest,
  approveRequest,
  refuseRequest,
  cancelRequest,
} from '../controllers/timeOffController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { enforceEmployeeSelfService } from '../middleware/ownership.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

// Balances
router.get('/balances', enforceEmployeeSelfService, getBalances);

// Types
router.get('/types', listTypes);
router.post(
  '/types',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createType
);

// Allocations
router.get('/allocations', enforceEmployeeSelfService, listAllocations);
router.post(
  '/allocations',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createAllocation
);

// Requests
router.get('/requests', enforceEmployeeSelfService, listRequests);
router.post('/requests', enforceEmployeeSelfService, createRequest);

// Workflows
router.post(
  '/requests/:id/approve',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  approveRequest
);

router.post(
  '/requests/:id/refuse',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  refuseRequest
);

router.post('/requests/:id/cancel', cancelRequest);

export default router;
