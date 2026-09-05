import { Router } from 'express';
import { listContracts, getContract, createContract, updateContract, resolveContract } from '../controllers/contractController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/resolve', resolveContract);
router.get('/', listContracts);
router.get('/:id', getContract);

router.post(
  '/',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createContract
);

router.patch(
  '/:id',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  updateContract
);

export default router;
