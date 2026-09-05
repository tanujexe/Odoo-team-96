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

export async function checkIn({ employeeId, checkInTime = new Date() }) {
  const dateObj = getStartOfDay(checkInTime);

  const existing = await Attendance.findOne({ employeeId, date: dateObj });
  if (existing) {
    const err = new Error('Attendance record already exists for today');
    err.code = 'ATTENDANCE_EXISTS';
    err.statusCode = 400;
    throw err;
  }

  const attendance = new Attendance({
    employeeId,
    date: dateObj,
    checkIn: checkInTime,
    status: 'PRESENT',
  });

  await attendance.save();
  return attendance.populate('employeeId');
}

export async function checkOut({ attendanceId, employeeId, checkOutTime = new Date() }) {
  const filter = attendanceId ? { _id: attendanceId } : { employeeId, checkOut: null };
  const attendance = await Attendance.findOne(filter);

  if (!attendance) {
    const err = new Error('No open check-in attendance record found');
    err.code = 'ATTENDANCE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  const durationMs = new Date(checkOutTime).getTime() - new Date(attendance.checkIn).getTime();
  const workedHours = Math.max(0, Number((durationMs / (1000 * 60 * 60)).toFixed(2)));

  attendance.checkOut = checkOutTime;
  attendance.workedHours = workedHours;

  await attendance.save();
  return attendance.populate('employeeId');
}

export async function correctAttendance({ attendanceId, checkIn, checkOut, status, reason, actorId }) {
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
  if (query.employeeId) filter.employeeId = query.employeeId;
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
