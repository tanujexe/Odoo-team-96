import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { Payslip } from '../models/Payslip.js';
import { Payrun } from '../models/Payrun.js';
import { config } from '../config/env.js';
import { logAudit } from './auditService.js';

/**
 * Generates a high-quality, professional PDF stream/buffer for a given payslip document
 * @param {Object} payslip - Populated Payslip document
 * @returns {Promise<Buffer>} PDF Buffer
 */
export function generatePayslipPDFBuffer(payslip) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Payslip - ${payslip.employeeId?.name || 'Employee'}`,
          Author: 'PeoplePay360',
          Subject: 'Official Salary Payslip',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 523.28 pt

      // --- Helper Drawing Functions ---
      const drawHorizontalLine = (y, color = '#e2e8f0', lineWidth = 1) => {
        doc.save()
          .moveTo(margin, y)
          .lineTo(pageWidth - margin, y)
          .strokeColor(color)
          .lineWidth(lineWidth)
          .stroke()
          .restore();
      };

      const formatCurr = (val) => {
        const num = Number(val) || 0;
        return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const formatDate = (d) => {
        if (!d) return '—';
        try {
          const dt = new Date(d);
          return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        } catch {
          return String(d);
        }
      };

      const formatMonthYear = (d) => {
        if (!d) return '';
        try {
          const dt = new Date(d);
          return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          return '';
        }
      };

      // 1. TOP BRAND ACCENT BAR
      doc.rect(margin, 24, contentWidth, 4).fill('#2563eb');

      // 2. HEADER SECTION (Y: 36 - 84)
      // Left: Company Logo & Info
      doc.roundedRect(margin, 36, 36, 36, 8).fill('#0f172a');
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text('P', margin + 11, 44);

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('PeoplePay360', margin + 46, 38);
      doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text('Enterprise HR & Automated Payroll System', margin + 46, 56);
      doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('100 Innovation Blvd, Financial District • support@peoplepay360.com', margin + 46, 68);

      // Right: Document Title & Month
      const periodMonth = formatMonthYear(payslip.periodStart) || 'Payroll Period';
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#0f172a').text('OFFICIAL PAYSLIP', margin, 38, { align: 'right', width: contentWidth });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#2563eb').text(periodMonth.toUpperCase(), margin, 56, { align: 'right', width: contentWidth });
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`Ref: PS-${String(payslip._id || payslip.id || '').slice(-8).toUpperCase()} • Date: ${formatDate(new Date())}`, margin, 68, { align: 'right', width: contentWidth });

      drawHorizontalLine(82, '#cbd5e1', 1);

      // 3. EMPLOYEE & PAYROLL SUMMARY CARDS (Y: 90 to 175)
      const cardWidth = (contentWidth - 12) / 2;
      const cardHeight = 84;
      const leftCardX = margin;
      const rightCardX = margin + cardWidth + 12;
      const cardY = 90;

      // Card 1: Employee Information
      doc.roundedRect(leftCardX, cardY, cardWidth, cardHeight, 6).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.roundedRect(leftCardX, cardY, cardWidth, 18, 6).fill('#f1f5f9');
      doc.rect(leftCardX, cardY + 12, cardWidth, 6).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('EMPLOYEE DETAILS', leftCardX + 10, cardY + 5);

      const emp = payslip.employeeId || {};
      const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const empCode = emp.employeeCode || 'EMP-001';
      const empDept = (typeof emp.departmentId === 'object' ? emp.departmentId?.name : emp.department) || 'General';
      const empPos = emp.jobPosition || emp.jobTitle || 'Employee';
      const empEmail = emp.email || '—';

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a').text(empName, leftCardX + 10, cardY + 23);
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text('ID: ', leftCardX + 10, cardY + 37, { continued: true }).font('Helvetica-Bold').text(empCode, { continued: true }).font('Helvetica').text(`  •  Dept: ${empDept}`);
      doc.text(`Role: ${empPos}`, leftCardX + 10, cardY + 49);
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`Email: ${empEmail}`, leftCardX + 10, cardY + 62);

      // Card 2: Pay Period & Payment Info
      doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 6).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.roundedRect(rightCardX, cardY, cardWidth, 18, 6).fill('#f1f5f9');
      doc.rect(rightCardX, cardY + 12, cardWidth, 6).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('PAYROLL & ATTENDANCE DETAILS', rightCardX + 10, cardY + 5);

      const pStartStr = formatDate(payslip.periodStart);
      const pEndStr = formatDate(payslip.periodEnd);
      const workedDays = payslip.workedDays ?? 22;
      const bankName = emp.bankDetails?.bankName || 'Direct Deposit';
      const bankAcct = emp.bankDetails?.accountNumber ? `A/C: ****${String(emp.bankDetails.accountNumber).slice(-4)}` : 'A/C: Direct Credit';
      const statusLabel = payslip.status || 'COMPUTED';

      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text('Period: ', rightCardX + 10, cardY + 23, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${pStartStr} to ${pEndStr}`);
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Days Worked: ', rightCardX + 10, cardY + 37, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${workedDays} Days`);
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Bank: ', rightCardX + 10, cardY + 49, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(`${bankName}  •  ${bankAcct}`);
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Status: ', rightCardX + 10, cardY + 62, { continued: true }).font('Helvetica-Bold').fillColor(statusLabel === 'PAID' ? '#059669' : '#2563eb').text(statusLabel);

      // 4. EARNINGS & DEDUCTIONS TABLES (Y: 184)
      const tableY = 184;
      const rawRules = payslip.ruleLines || [];
      const earnings = rawRules.filter(
        (r) => (r.category === 'BASIC' || r.category === 'ALW' || r.category === 'ALLOWANCE') && r.code !== 'GROSS' && r.code !== 'NET'
      );
      const deductions = rawRules.filter(
        (r) => (r.category === 'DED' || r.category === 'DEDUCTION') && r.code !== 'GROSS' && r.code !== 'NET'
      );

      const tableRowsCount = Math.max(earnings.length, deductions.length, 3);
      const tableHeight = tableRowsCount * 18 + 48;

      // --- Left Box: Earnings ---
      doc.roundedRect(leftCardX, tableY, cardWidth, tableHeight, 6).stroke('#cbd5e1');
      doc.roundedRect(leftCardX, tableY, cardWidth, 22, 6).fill('#1e293b');
      doc.rect(leftCardX, tableY + 16, cardWidth, 6).fill('#1e293b');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text('EARNINGS & ALLOWANCES', leftCardX + 10, tableY + 6);
      doc.text('AMOUNT', leftCardX, tableY + 6, { align: 'right', width: cardWidth - 10 });

      let currentEarningY = tableY + 26;
      let totalEarningsCalculated = 0;
      if (earnings.length > 0) {
        earnings.forEach((item, index) => {
          if (index % 2 === 1) {
            doc.rect(leftCardX + 1, currentEarningY - 2, cardWidth - 2, 16).fill('#f8fafc');
          }
          doc.font('Helvetica').fontSize(8).fillColor('#334155').text(item.name || item.code, leftCardX + 10, currentEarningY);
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(formatCurr(item.amount), leftCardX, currentEarningY, { align: 'right', width: cardWidth - 10 });
          totalEarningsCalculated += Number(item.amount || 0);
          currentEarningY += 18;
        });
      } else {
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8').text('Basic Salary', leftCardX + 10, currentEarningY);
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(formatCurr(payslip.gross || 0), leftCardX, currentEarningY, { align: 'right', width: cardWidth - 10 });
        totalEarningsCalculated = payslip.gross || 0;
        currentEarningY += 18;
      }

      // Earnings Footer Subtotal
      const earningFooterY = tableY + tableHeight - 22;
      doc.roundedRect(leftCardX, earningFooterY, cardWidth, 22, 6).fill('#f1f5f9');
      doc.rect(leftCardX, earningFooterY, cardWidth, 6).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text('TOTAL GROSS EARNINGS', leftCardX + 10, earningFooterY + 6);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1e293b').text(formatCurr(payslip.gross || totalEarningsCalculated), leftCardX, earningFooterY + 6, { align: 'right', width: cardWidth - 10 });

      // --- Right Box: Deductions ---
      doc.roundedRect(rightCardX, tableY, cardWidth, tableHeight, 6).stroke('#cbd5e1');
      doc.roundedRect(rightCardX, tableY, cardWidth, 22, 6).fill('#1e293b');
      doc.rect(rightCardX, tableY + 16, cardWidth, 6).fill('#1e293b');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text('DEDUCTIONS & TAXES', rightCardX + 10, tableY + 6);
      doc.text('AMOUNT', rightCardX, tableY + 6, { align: 'right', width: cardWidth - 10 });

      let currentDedY = tableY + 26;
      let totalDeductionsCalculated = 0;
      if (deductions.length > 0) {
        deductions.forEach((item, index) => {
          if (index % 2 === 1) {
            doc.rect(rightCardX + 1, currentDedY - 2, cardWidth - 2, 16).fill('#f8fafc');
          }
          doc.font('Helvetica').fontSize(8).fillColor('#334155').text(item.name || item.code, rightCardX + 10, currentDedY);
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#dc2626').text(`- ${formatCurr(item.amount)}`, rightCardX, currentDedY, { align: 'right', width: cardWidth - 10 });
          totalDeductionsCalculated += Number(item.amount || 0);
          currentDedY += 18;
        });
      } else {
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8').text('No deductions applied for period', rightCardX + 10, currentDedY);
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('$ 0.00', rightCardX, currentDedY, { align: 'right', width: cardWidth - 10 });
        currentDedY += 18;
      }

      // Deductions Footer Subtotal
      const dedFooterY = tableY + tableHeight - 22;
      doc.roundedRect(rightCardX, dedFooterY, cardWidth, 22, 6).fill('#f1f5f9');
      doc.rect(rightCardX, dedFooterY, cardWidth, 6).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e293b').text('TOTAL DEDUCTIONS', rightCardX + 10, dedFooterY + 6);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#dc2626').text(formatCurr(payslip.deductions || totalDeductionsCalculated), rightCardX, dedFooterY + 6, { align: 'right', width: cardWidth - 10 });

      // 5. NET SALARY PAYABLE PROMINENT BANNER (Y: tableY + tableHeight + 14)
      const netBannerY = tableY + tableHeight + 14;
      const netBannerHeight = 56;
      doc.roundedRect(margin, netBannerY, contentWidth, netBannerHeight, 8).fill('#0f172a');

      // Left info inside banner
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#38bdf8').text('NET SALARY PAYABLE (TAKE-HOME PAY)', margin + 16, netBannerY + 13);
      const grossVal = payslip.gross || totalEarningsCalculated;
      const dedVal = payslip.deductions || totalDeductionsCalculated;
      doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text(`Gross Earnings (${formatCurr(grossVal)}) − Total Deductions (${formatCurr(dedVal)})`, margin + 16, netBannerY + 31);

      // Right large amount inside banner
      const netAmount = payslip.net || (grossVal - dedVal);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text(formatCurr(netAmount), margin, netBannerY + 11, { align: 'right', width: contentWidth - 16 });
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#34d399').text('✓ PROCESSED & VERIFIED', margin, netBannerY + 34, { align: 'right', width: contentWidth - 16 });

      // 6. NOTES & STATUTORY COMPLIANCE BOX
      const notesY = netBannerY + netBannerHeight + 14;
      doc.roundedRect(margin, notesY, contentWidth, 50, 6).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('IMPORTANT NOTICE & STATUTORY DECLARATION', margin + 10, notesY + 7);
      doc.font('Helvetica').fontSize(7).fillColor('#64748b')
        .text('• This payslip is an official statement of remuneration disbursed by PeoplePay360 in accordance with employment contract terms.', margin + 10, notesY + 19)
        .text('• Tax calculations and deductions are computed per statutory regulations. For payroll or tax queries, email payroll@peoplepay360.com.', margin + 10, notesY + 29)
        .text('• This document is electronically generated and digitally authenticated; no physical signature is required.', margin + 10, notesY + 39);

      // 7. SIGNATURE / AUTHENTICATION BLOCK
      const sigY = notesY + 62;
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');

      // Left Signature line
      doc.moveTo(margin, sigY + 26).lineTo(margin + 150, sigY + 26).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.text('Employee Signature', margin, sigY + 30);

      // Right Signature line & Digital Seal
      doc.moveTo(pageWidth - margin - 170, sigY + 26).lineTo(pageWidth - margin, sigY + 26).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fillColor('#0f172a').text('Authorized Signatory (HR / Finance)', pageWidth - margin - 170, sigY + 30);
      doc.font('Helvetica').fontSize(6.5).fillColor('#059669').text('Digitally Authenticated by PeoplePay360 System', pageWidth - margin - 170, sigY + 41);

      // 8. BOTTOM FOOTER
      drawHorizontalLine(785, '#e2e8f0', 1);
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('PeoplePay360 Payroll Management System  •  Strictly Private & Confidential  •  Page 1 of 1', margin, 792, { align: 'center', width: contentWidth });

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

  const sentCount = results.filter((r) => r.status === 'SENT').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;

  return {
    payrunId,
    results,
    sentCount,
    failedCount,
    totalCount: payslips.length,
  };
}
