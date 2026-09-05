import { Router } from 'express';
import { listEmployees, getEmployee, createEmployee, updateEmployee } from '../controllers/employeeController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { enforceEmployeeSelfService } from '../middleware/ownership.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/', enforceEmployeeSelfService, listEmployees);
router.get('/:id', enforceEmployeeSelfService, getEmployee);

router.post(
  '/',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createEmployee
);

router.patch(
  '/:id',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  updateEmployee
);

export default router;
