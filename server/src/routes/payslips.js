import { Router } from 'express';
import { listPayslips, getPayslip, downloadPayslipPDF } from '../controllers/payslipController.js';
import { authenticate } from '../middleware/authenticate.js';
import { enforceEmployeeSelfService } from '../middleware/ownership.js';

const router = Router();

router.use(authenticate);

router.get('/', enforceEmployeeSelfService, listPayslips);
router.get('/:id/pdf', downloadPayslipPDF);
router.get('/:id', enforceEmployeeSelfService, getPayslip);

export default router;

