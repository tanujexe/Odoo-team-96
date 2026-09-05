import { loginSchema, registerSchema } from '../validators/authValidator.js';
import { loginUser, getUserById, registerUser } from '../services/authService.js';
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

export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await registerUser(validated);

    await logAudit({
      actorId: result.user.id,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: result.user.id,
    });

    return res.success(result, undefined, 201);
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
