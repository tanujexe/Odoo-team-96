import { Router } from 'express';
import { checkIn, checkOut, correctAttendance, listAttendance } from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { enforceEmployeeSelfService } from '../middleware/ownership.js';
import { ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', enforceEmployeeSelfService, checkIn);
router.post('/check-out', enforceEmployeeSelfService, checkOut);
router.post('/:id/check-out', enforceEmployeeSelfService, checkOut);

router.get('/', enforceEmployeeSelfService, listAttendance);

router.patch(
  '/:id/correction',
  requireRole(ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN),
  correctAttendance
);

export default router;
