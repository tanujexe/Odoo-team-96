import { Router } from 'express';
import {
  listPayruns,
  getPayrun,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
} from '../controllers/payrunController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN));

router.get('/', listPayruns);
router.get('/:id', getPayrun);
router.post('/', createPayrun);
router.post('/:id/compute', computePayrun);
router.post('/:id/validate', validatePayrun);
router.post('/:id/pay', markPayrunPaid);

export default router;
