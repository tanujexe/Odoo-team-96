import { Router } from 'express';
import { listRules, createRule, updateRule, deleteRule } from '../controllers/salaryRuleController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/', listRules);

router.post(
  '/',
  requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createRule
);

router.patch(
  '/:id',
  requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  updateRule
);

router.delete(
  '/:id',
  requireRole(ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  deleteRule
);

export default router;

