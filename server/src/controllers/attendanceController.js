import { checkInSchema, checkOutSchema, correctAttendanceSchema } from '../validators/attendanceValidator.js';
import * as attendanceService from '../services/attendanceService.js';

export async function checkIn(req, res, next) {
  try {
    const validated = checkInSchema.parse(req.body);
    const employeeId = validated.employeeId || req.actor.employeeId;

    if (!employeeId) {
      return res.fail('VALIDATION_ERROR', 'Employee ID is required', 400);
    }

    const attendance = await attendanceService.checkIn({
      employeeId,
      checkInTime: validated.checkInTime ? new Date(validated.checkInTime) : new Date(),
      actorId: req.actor?.userId,
    });

    return res.success(attendance, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req, res, next) {
  try {
    const validated = checkOutSchema.parse(req.body);
    const employeeId = validated.employeeId || req.actor.employeeId;
    const attendanceId = req.params.id || validated.attendanceId;

    const attendance = await attendanceService.checkOut({
      attendanceId,
      employeeId,
      checkOutTime: validated.checkOutTime ? new Date(validated.checkOutTime) : new Date(),
      actorId: req.actor?.userId,
    });

    return res.success(attendance);
  } catch (error) {
    next(error);
  }
}

export async function correctAttendance(req, res, next) {
  try {
    const validated = correctAttendanceSchema.parse(req.body);
    const attendance = await attendanceService.correctAttendance({
      attendanceId: req.params.id,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      status: validated.status,
      reason: validated.reason,
      actorId: req.actor.userId,
    });

    return res.success(attendance);
  } catch (error) {
    next(error);
  }
}

export async function listAttendance(req, res, next) {
  try {
    const result = await attendanceService.getAttendanceList(req.query);
    return res.success(result.records, result.meta);
  } catch (error) {
    next(error);
  }
}
