import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employeeValidator.js';
import * as employeeService from '../services/employeeService.js';
import { logAudit } from '../services/auditService.js';

export async function listEmployees(req, res, next) {
  try {
    const result = await employeeService.getEmployees(req.query);
    return res.success(result.employees, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getEmployee(req, res, next) {
  try {
    const result = await employeeService.getEmployeeById(req.params.id);
    return res.success(result);
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req, res, next) {
  try {
    const validated = createEmployeeSchema.parse(req.body);
    const employee = await employeeService.createEmployee(validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'CREATE_EMPLOYEE',
      entityType: 'Employee',
      entityId: employee._id,
      after: employee.toObject(),
    });

    return res.success(employee, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req, res, next) {
  try {
    const validated = updateEmployeeSchema.parse(req.body);
    const oldEmployee = await employeeService.getEmployeeById(req.params.id);
    const updated = await employeeService.updateEmployee(req.params.id, validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'UPDATE_EMPLOYEE',
      entityType: 'Employee',
      entityId: updated._id,
      before: oldEmployee.employee.toObject(),
      after: updated.toObject(),
    });

    return res.success(updated);
  } catch (error) {
    next(error);
  }
}
