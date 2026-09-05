import { updateRoleSchema, createUserAdminSchema, updateUserAdminSchema } from '../validators/authValidator.js';
import * as authService from '../services/authService.js';
import { logAudit } from '../services/auditService.js';

export async function listUsers(req, res, next) {
  try {
    const users = await authService.getAllUsers();
    return res.success(users);
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const validated = createUserAdminSchema.parse(req.body);
    const createdUser = await authService.adminCreateUser(validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'ADMIN_CREATE_USER',
      entityType: 'User',
      entityId: createdUser.id,
      after: createdUser,
    });

    return res.success(createdUser, undefined, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const validated = updateUserAdminSchema.parse(req.body);
    const updatedUser = await authService.updateUserAccount(id, validated);

    await logAudit({
      actorId: req.actor.userId,
      action: 'UPDATE_USER_ACCOUNT',
      entityType: 'User',
      entityId: id,
      after: validated,
    });

    return res.success(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  return updateUser(req, res, next);
}
