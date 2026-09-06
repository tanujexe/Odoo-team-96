import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance.js';
import { logAudit } from './auditService.js';

/**
 * Returns date-only UTC start instant for a given Date
 */
function getStartOfDay(dateInput = new Date()) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function checkIn({ employeeId, checkInTime = new Date(), actorId = null }) {
  const dateObj = getStartOfDay(checkInTime);

  const existing = await Attendance.findOne({ employeeId, date: dateObj });
  if (existing) {
    if (!existing.checkOut) {
      return existing.populate('employeeId');
    }
    // Re-open existing record if checked out previously today
    const beforeObj = existing.toObject();
    existing.checkOut = null;
    existing.workedHours = 0;
    existing.checkIn = checkInTime;
    await existing.save();

    await logAudit({
      actorId,
      action: 'REOPEN_CHECK_IN',
      entityType: 'Attendance',
      entityId: existing._id,
      before: beforeObj,
      after: existing.toObject(),
    });

    return existing.populate('employeeId');
  }

  const attendance = new Attendance({
    employeeId,
    date: dateObj,
    checkIn: checkInTime,
    status: 'PRESENT',
  });

  await attendance.save();

  await logAudit({
    actorId,
    action: 'CHECK_IN',
    entityType: 'Attendance',
    entityId: attendance._id,
    before: null,
    after: attendance.toObject(),
  });

  return attendance.populate('employeeId');
}

export async function checkOut({ attendanceId, employeeId, checkOutTime = new Date(), actorId = null }) {
  let attendance = null;

  if (attendanceId && mongoose.isValidObjectId(attendanceId)) {
    attendance = await Attendance.findById(attendanceId);
  }

  if (!attendance && employeeId && mongoose.isValidObjectId(employeeId)) {
    attendance = await Attendance.findOne({ employeeId, checkOut: null }).sort({ checkIn: -1 });
    if (!attendance) {
      attendance = await Attendance.findOne({ employeeId }).sort({ checkIn: -1 });
    }
  }

  if (!attendance) {
    const err = new Error('No open check-in attendance record found');
    err.code = 'ATTENDANCE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const beforeObj = attendance.toObject();
  const durationMs = new Date(checkOutTime).getTime() - new Date(attendance.checkIn).getTime();
  const workedHours = Math.max(0, Number((durationMs / (1000 * 60 * 60)).toFixed(2)));

  attendance.checkOut = checkOutTime;
  attendance.workedHours = workedHours;

  await attendance.save();

  await logAudit({
    actorId,
    action: 'CHECK_OUT',
    entityType: 'Attendance',
    entityId: attendance._id,
    before: beforeObj,
    after: attendance.toObject(),
  });

  return attendance.populate('employeeId');
}

export async function correctAttendance({ attendanceId, checkIn, checkOut, status, reason, actorId }) {
  if (!mongoose.isValidObjectId(attendanceId)) {
    const err = new Error('Attendance record not found');
    err.code = 'ATTENDANCE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.code = 'ATTENDANCE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const beforeObj = attendance.toObject();

  if (checkIn) attendance.checkIn = new Date(checkIn);
  if (checkOut) attendance.checkOut = new Date(checkOut);
  if (status) attendance.status = status;

  if (attendance.checkIn && attendance.checkOut) {
    const durationMs = new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime();
    attendance.workedHours = Math.max(0, Number((durationMs / (1000 * 60 * 60)).toFixed(2)));
  }

  attendance.correctionReason = reason;
  attendance.correctedBy = actorId;

  await attendance.save();

  await logAudit({
    actorId,
    action: 'CORRECT_ATTENDANCE',
    entityType: 'Attendance',
    entityId: attendance._id,
    before: beforeObj,
    after: attendance.toObject(),
  });

  return attendance.populate('employeeId correctedBy');
}

export async function getAttendanceList(query = {}) {
  const page = parseInt(query.page || 1, 10);
  const pageSize = parseInt(query.pageSize || 20, 10);
  const skip = (page - 1) * pageSize;

  const filter = {};
  if (query.employeeId && mongoose.isValidObjectId(query.employeeId)) filter.employeeId = query.employeeId;
  if (query.status) filter.status = query.status;

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter).populate('employeeId correctedBy').skip(skip).limit(pageSize).sort({ date: -1 }),
    Attendance.countDocuments(filter),
  ]);

  return { records, meta: { page, pageSize, total } };
}

