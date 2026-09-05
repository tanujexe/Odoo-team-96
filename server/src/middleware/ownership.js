import { ROLES } from '../models/User.js';

export function enforceEmployeeSelfService(req, res, next) {
  if (!req.actor) {
    return res.fail('UNAUTHORIZED', 'Authentication context missing', 401);
  }

  // HR Managers, HR Payroll Users/Managers, and Admins can query any employee
  if (req.actor.role !== ROLES.EMPLOYEE) {
    return next();
  }

  // Employee role must have an associated employeeId
  if (!req.actor.employeeId) {
    return res.fail('FORBIDDEN', 'No employee profile linked to user account', 403);
  }

  // Override query or body employeeId parameter server-side
  if (req.query) {
    req.query.employeeId = req.actor.employeeId;
  }
  if (req.body && typeof req.body === 'object') {
    req.body.employeeId = req.actor.employeeId;
  }

  // If endpoint accesses a specific employee resource via :id or :employeeId param
  const paramId = req.params.employeeId || req.params.id;
  if (paramId && String(paramId) !== String(req.actor.employeeId)) {
    return res.fail('FORBIDDEN', 'Access denied. You can only access your own employee records.', 403);
  }

  next();
}
