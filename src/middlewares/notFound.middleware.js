import AppError from "../utils/AppError.js";

export function notFoundMiddleware(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
}