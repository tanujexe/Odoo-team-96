import { Router } from 'express';
import {
  listPayslips,
  getPayslip,
  createPayslip,
  computePayslip,
  markPayslipPaid,
  downloadPayslipPDF,
} from '../controllers/payslipController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { enforceEmployeeSelfService } from '../middleware/ownership.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/', enforceEmployeeSelfService, listPayslips);
router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  createPayslip
);
router.get('/:id/pdf', downloadPayslipPDF);
router.post(
  '/:id/compute',
  requireRole(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  computePayslip
);
router.post(
  '/:id/pay',
  requireRole(ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER),
  markPayslipPaid
);
router.get('/:id', enforceEmployeeSelfService, getPayslip);

export default router;



