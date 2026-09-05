export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.actor || !req.actor.role) {
      return res.fail('UNAUTHORIZED', 'User context missing', 401);
    }

    if (!allowedRoles.includes(req.actor.role)) {
      return res.fail(
        'FORBIDDEN',
        `Access denied. Role '${req.actor.role}' is not authorized to perform this operation.`,
        403
      );
    }

    next();
  };
}
