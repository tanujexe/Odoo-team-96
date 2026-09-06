import mongoose from 'mongoose';
import { Payslip } from '../models/Payslip.js';
import { ROLES } from '../models/User.js';
import { generatePayslipPDFBuffer } from '../services/payslipDocumentService.js';
import {
  getPayslipsList,
  getPayslipById,
  createSinglePayslip,
  recomputeSinglePayslip,
  markSinglePayslipPaid,
} from '../services/payrollService.js';

export async function listPayslips(req, res, next) {
  try {
    const query = { ...req.query };
    if (req.actor?.role === ROLES.EMPLOYEE && req.actor?.employeeId) {
      query.employeeId = req.actor.employeeId;
    }

    const result = await getPayslipsList(query);
    return res.success(result.payslips, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getPayslip(req, res, next) {
  try {
    const payslip = await getPayslipById(req.params.id);
    if (!payslip) {
      return res.fail('PAYSLIP_NOT_FOUND', 'Payslip not found', 404);
    }
    if (
      req.actor?.role === ROLES.EMPLOYEE &&
      req.actor?.employeeId &&
      payslip.employeeId &&
      String(payslip.employeeId) !== String(req.actor.employeeId)
    ) {
      return res.fail('FORBIDDEN', 'Access denied', 403);
    }
    return res.success(payslip);
  } catch (error) {
    next(error);
  }
}

export async function createPayslip(req, res, next) {
  try {
    const { employeeId, salaryStructureId, periodStart, periodEnd, workedDays, payrunId } = req.body;
    if (!employeeId) {
      return res.fail('EMPLOYEE_REQUIRED', 'Employee ID is required', 400);
    }

    const payslip = await createSinglePayslip({
      employeeId,
      salaryStructureId,
      periodStart,
      periodEnd,
      workedDays,
      payrunId,
      actorId: req.actor?.userId,
    });

    return res.success(payslip, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function computePayslip(req, res, next) {
  try {
    const payslip = await recomputeSinglePayslip(req.params.id, req.actor?.userId);
    return res.success(payslip);
  } catch (error) {
    next(error);
  }
}

export async function markPayslipPaid(req, res, next) {
  try {
    const payslip = await markSinglePayslipPaid(req.params.id, req.actor?.userId);
    return res.success(payslip);
  } catch (error) {
    next(error);
  }
}

export async function downloadPayslipPDF(req, res, next) {
  try {
    const payslip = await Payslip.findById(req.params.id).populate({
      path: 'employeeId',
      populate: { path: 'departmentId' },
    });
    if (!payslip) {
      return res.fail('PAYSLIP_NOT_FOUND', 'Payslip not found', 404);
    }
    if (
      req.actor?.role === ROLES.EMPLOYEE &&
      req.actor?.employeeId &&
      payslip.employeeId &&
      payslip.employeeId._id.toString() !== req.actor.employeeId.toString()
    ) {
      return res.fail('FORBIDDEN', 'Access denied', 403);
    }
    const pdfBuffer = await generatePayslipPDFBuffer(payslip);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Payslip_${payslip.employeeId?.employeeCode || 'EMP'}_${payslip._id}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}


