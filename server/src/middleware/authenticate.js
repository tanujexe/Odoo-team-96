import { verifyToken } from '../services/authService.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('UNAUTHORIZED', 'Authentication token is required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.actor = {
      userId: decoded.userId,
      role: decoded.role,
      employeeId: decoded.employeeId || null,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.fail('TOKEN_EXPIRED', 'Authentication token has expired', 401);
    }
    return res.fail('INVALID_TOKEN', 'Invalid authentication token', 401);
  }
}
