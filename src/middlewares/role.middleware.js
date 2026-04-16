import AppError from "../utils/AppError.js";

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    }

    next();
  };
}