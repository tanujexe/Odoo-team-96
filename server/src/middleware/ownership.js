import { ROLES } from '../models/User.js';
import { Employee } from '../models/Employee.js';

export async function enforceEmployeeSelfService(req, res, next) {
  if (!req.actor) {
    return res.fail('UNAUTHORIZED', 'Authentication context missing', 401);
  }

  // Auto-link employeeId by email if unlinked in database
  if (!req.actor.employeeId && req.actor.email) {
    try {
      const emp = await Employee.findOne({ email: req.actor.email.toLowerCase().trim() });
      if (emp) {
        req.actor.employeeId = emp._id.toString();
      }
    } catch (err) {
      console.warn('[SelfService] Auto-link employee lookup error:', err);
    }
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

  // If endpoint accesses a specific employee resource via :employeeId param or employee route with :id
  const paramId = req.params.employeeId || (req.baseUrl?.includes('employee') || req.originalUrl?.includes('employee') ? req.params.id : null);
  if (paramId && String(paramId) !== String(req.actor.employeeId)) {
    return res.fail('FORBIDDEN', 'Access denied. You can only access your own employee records.', 403);
  }

  next();
}
