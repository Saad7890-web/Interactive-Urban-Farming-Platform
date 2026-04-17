import { ZodError } from "zod";
import AppError from "../utils/AppError.js";
import { errorResponse } from "../utils/apiResponse.js";

function mapPgError(err) {
  switch (err.code) {
    case "23505":
      return {
        message: "Duplicate value already exists",
        code: "DUPLICATE_KEY",
        statusCode: 409,
      };
    case "23503":
      return {
        message: "Referenced record does not exist",
        code: "FOREIGN_KEY_VIOLATION",
        statusCode: 400,
      };
    case "23502":
      return {
        message: "A required field is missing",
        code: "NOT_NULL_VIOLATION",
        statusCode: 400,
      };
    case "23514":
      return {
        message: "Data failed validation constraints",
        code: "CHECK_CONSTRAINT_VIOLATION",
        statusCode: 400,
      };
    case "23P01":
      return {
        message: "Booking conflict detected",
        code: "CONFLICT_CONSTRAINT_VIOLATION",
        statusCode: 409,
      };
    default:
      return null;
  }
}

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return errorResponse(res, {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return errorResponse(res, {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "NotBeforeError"
  ) {
    return errorResponse(res, {
      message: "Invalid or expired token",
      code: "INVALID_TOKEN",
      statusCode: 401,
    });
  }

  const pgMapped = err.code ? mapPgError(err) : null;
  if (pgMapped) {
    return errorResponse(res, {
      message: pgMapped.message,
      code: pgMapped.code,
      statusCode: pgMapped.statusCode,
      details: err.detail || null,
    });
  }

  console.error("Unhandled error:", err);

  return errorResponse(res, {
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
  });
}