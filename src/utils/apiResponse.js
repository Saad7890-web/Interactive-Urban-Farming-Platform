export function successResponse(
  res,
  {
    message = "Success",
    data = null,
    meta = null,
    statusCode = 200,
  } = {}
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    error: null,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(
  res,
  {
    message = "Something went wrong",
    code = "INTERNAL_SERVER_ERROR",
    statusCode = 500,
    details = null,
    meta = null,
  } = {}
) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    meta,
    error: {
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}

export function paginationMeta({ total, page, limit }) {
  return {
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}