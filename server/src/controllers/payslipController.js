import mongoose from 'mongoose';
import { Payslip } from '../models/Payslip.js';
import { ROLES } from '../models/User.js';
import { generatePayslipPDFBuffer } from '../services/payslipDocumentService.js';

export async function listPayslips(req, res, next) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const pageSize = parseInt(req.query.pageSize || 20, 10);
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (req.query.employeeId && mongoose.isValidObjectId(req.query.employeeId)) filter.employeeId = req.query.employeeId;
    if (req.query.payrunId && mongoose.isValidObjectId(req.query.payrunId)) filter.payrunId = req.query.payrunId;
    if (req.query.status) filter.status = req.query.status;

    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate('employeeId contractId salaryStructureId payrunId')
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 }),
      Payslip.countDocuments(filter),
    ]);

    return res.success(payslips, { page, pageSize, total });
  } catch (error) {
    next(error);
  }
}


export async function getPayslip(req, res, next) {
  try {
    const payslip = await Payslip.findById(req.params.id).populate(
      'employeeId contractId salaryStructureId payrunId'
    );
    if (!payslip) {
      return res.fail('PAYSLIP_NOT_FOUND', 'Payslip not found', 404);
    }
    return res.success(payslip);
  } catch (error) {
    next(error);
  }
}

export async function downloadPayslipPDF(req, res, next) {
  try {
    const payslip = await Payslip.findById(req.params.id).populate('employeeId');
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

