import { errorResponse } from "../utils/apiResponse.js";

export function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  return errorResponse(res, {
    message: err.message || "Internal server error",
    code,
    statusCode,
    details: err.details || null,
  });
}