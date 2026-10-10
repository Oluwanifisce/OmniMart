/**
 * Role-Based Access Control (RBAC) middleware factory.
 * @param  {...string} roles - List of roles permitted to access the endpoint (e.g. 'admin', 'vendor', 'customer')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. User authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
