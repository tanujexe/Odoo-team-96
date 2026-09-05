import { createScheduleSchema, updateScheduleSchema } from '../validators/scheduleValidator.js';
import * as scheduleService from '../services/scheduleService.js';
import { logAudit } from '../services/auditService.js';

export async function listSchedules(req, res, next) {
  try {
    const result = await scheduleService.getSchedules(req.query, req.query);
    return res.success(result.schedules, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getSchedule(req, res, next) {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    return res.success(schedule);
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req, res, next) {
  try {
    const validated = createScheduleSchema.parse(req.body);
    const schedule = await scheduleService.createSchedule(validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'CREATE_WORKING_SCHEDULE',
      entityType: 'WorkingSchedule',
      entityId: schedule._id,
      after: schedule.toObject(),
    });

    return res.success(schedule, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const validated = updateScheduleSchema.parse(req.body);
    const oldSchedule = await scheduleService.getScheduleById(req.params.id);
    const updated = await scheduleService.updateSchedule(req.params.id, validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'UPDATE_WORKING_SCHEDULE',
      entityType: 'WorkingSchedule',
      entityId: updated._id,
      before: oldSchedule.toObject(),
      after: updated.toObject(),
    });

    return res.success(updated);
  } catch (error) {
    next(error);
  }
}
