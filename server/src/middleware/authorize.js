export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.actor || !req.actor.role) {
      return res.fail('UNAUTHORIZED', 'User context missing', 401);
    }

    // ADMIN and SUPER_ADMIN possess full system-wide administrative access
    if (
      req.actor.role === 'ADMIN' ||
      req.actor.role === 'SUPER_ADMIN' ||
      allowedRoles.includes(req.actor.role)
    ) {
      return next();
    }

    return res.fail(
      'FORBIDDEN',
      `Access denied. Role '${req.actor.role}' is not authorized to perform this operation.`,
      403
    );
  };
}
