import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { Payslip } from '../models/Payslip.js';
import { Payrun } from '../models/Payrun.js';
import { config } from '../config/env.js';
import { logAudit } from './auditService.js';

/**
 * Generates a PDF stream/buffer for a given payslip document
 * @param {Object} payslip - Populated Payslip document
 * @returns {Promise<Buffer>} PDF Buffer
 */
export function generatePayslipPDFBuffer(payslip) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('PeoplePay360', { align: 'center' });
      doc.fontSize(14).text('Official Employee Payslip', { align: 'center' });
      doc.moveDown(1);

      // Period & Status
      const pStart = new Date(payslip.periodStart).toISOString().slice(0, 10);
      const pEnd = new Date(payslip.periodEnd).toISOString().slice(0, 10);
      doc.fontSize(10).text(`Pay Period: ${pStart} to ${pEnd}`);
      doc.text(`Status: ${payslip.status}`);
      doc.moveDown(1);

      // Employee Information
      const emp = payslip.employeeId || {};
      doc.fontSize(12).text('Employee Details:', { underline: true });
      doc.fontSize(10).text(`Name: ${emp.name || 'N/A'}`);
      doc.text(`Employee Code: ${emp.employeeCode || 'N/A'}`);
      doc.text(`Email: ${emp.email || 'N/A'}`);
      doc.text(`Worked Days: ${payslip.workedDays || 22}`);
      doc.moveDown(1);

      // Salary Breakdown Table Header
      doc.fontSize(12).text('Salary Breakdown:', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).text('Rule / Component', 50, doc.y, { continued: true });
      doc.text('Category', 250, doc.y, { continued: true });
      doc.text('Amount ($)', 450, doc.y);
      doc.text('----------------------------------------------------------------------------------');

      // Rule Lines
      if (payslip.ruleLines && payslip.ruleLines.length > 0) {
        payslip.ruleLines.forEach((line) => {
          doc.text(line.name, 50, doc.y, { continued: true });
          doc.text(line.category, 250, doc.y, { continued: true });
          doc.text(line.amount.toFixed(2), 450, doc.y);
        });
      }

      doc.moveDown(1);
      doc.text('----------------------------------------------------------------------------------');
      doc.fontSize(11).text(`Gross Salary: $${(payslip.gross || 0).toFixed(2)}`, { align: 'right' });
      doc.text(`Total Deductions: $${(payslip.deductions || 0).toFixed(2)}`, { align: 'right' });
      doc.fontSize(13).text(`Net Salary Paid: $${(payslip.net || 0).toFixed(2)}`, { align: 'right', underline: true });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates Nodemailer transport helper
 */
function createTransporter() {
  if (config.smtp.user && config.smtp.pass && process.env.NODE_ENV !== 'test') {
    return nodemailer.createTransport({

      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  // Fallback dev transport using JSON log transport
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

/**
 * Bulk sends payslips for a given Payrun and records delivery status (SENT or FAILED) per payslip
 */
export async function sendPayrunPayslips(payrunId, actorId) {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.code = 'PAYRUN_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const payslips = await Payslip.find({ payrunId }).populate('employeeId');
  const transporter = createTransporter();

  const results = [];

  for (const payslip of payslips) {
    const emp = payslip.employeeId;
    if (!emp || !emp.email) {
      payslip.deliveryStatus = 'FAILED';
      await payslip.save();
      results.push({ payslipId: payslip._id, status: 'FAILED', reason: 'Missing employee email' });
      continue;
    }

    try {
      const pdfBuffer = await generatePayslipPDFBuffer(payslip);

      await transporter.sendMail({
        from: '"PeoplePay360 Payroll" <no-reply@peoplepay.com>',
        to: emp.email,
        subject: `Your Payslip for Period ${new Date(payslip.periodStart).toISOString().slice(0, 7)}`,
        text: `Hello ${emp.name},\n\nPlease find attached your official payslip for the period ${new Date(payslip.periodStart).toISOString().slice(0, 10)} to ${new Date(payslip.periodEnd).toISOString().slice(0, 10)}.\n\nNet Amount Paid: $${payslip.net.toFixed(2)}\n\nBest regards,\nPeoplePay360 HR Team`,
        attachments: [
          {
            filename: `Payslip_${emp.employeeCode || 'EMP'}_${new Date(payslip.periodStart).toISOString().slice(0, 7)}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      payslip.deliveryStatus = 'SENT';
      await payslip.save();
      results.push({ payslipId: payslip._id, status: 'SENT' });
    } catch (sendErr) {
      console.error(`[PayslipDelivery] Failed to send email to ${emp.email}:`, sendErr.message);
      payslip.deliveryStatus = 'FAILED';
      await payslip.save();
      results.push({ payslipId: payslip._id, status: 'FAILED', reason: sendErr.message });
    }
  }

  await logAudit({
    actorId,
    action: 'BULK_SEND_PAYSLIPS',
    entityType: 'Payrun',
    entityId: payrun._id,
  });

  return { payrunId, results };
}
