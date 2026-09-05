import { Router } from 'express';
import { listStructures, getStructure, createStructure, updateStructure } from '../controllers/salaryStructureController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/', listStructures);
router.get('/:id', getStructure);

router.post(
  '/',
  requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createStructure
);

router.patch(
  '/:id',
  requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  updateStructure
);

export default router;
