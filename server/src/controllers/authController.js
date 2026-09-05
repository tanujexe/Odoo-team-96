import { loginSchema } from '../validators/authValidator.js';
import { loginUser, getUserById } from '../services/authService.js';
import { logAudit } from '../services/auditService.js';

export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await loginUser(validated.email, validated.password);

    await logAudit({
      actorId: result.user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: result.user.id,
    });

    return res.success(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await getUserById(req.actor.userId);
    return res.success({ user });
  } catch (error) {
    next(error);
  }
}
