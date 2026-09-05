import { Router } from 'express';
import { listSchedules, getSchedule, createSchedule, updateSchedule } from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.get('/', listSchedules);
router.get('/:id', getSchedule);

router.post(
  '/',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  createSchedule
);

router.patch(
  '/:id',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  updateSchedule
);

export default router;
