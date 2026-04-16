export function successResponse(res, { message = "Success", data = null, meta = null, statusCode = 200 }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function errorResponse(res, { message = "Something went wrong", code = "ERROR", statusCode = 500, details = null }) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details,
    },
  });
}