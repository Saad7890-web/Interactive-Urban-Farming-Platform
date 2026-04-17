import {
    addSpace,
    adminUpdateBookingStatus,
    bookSpace,
    browseBookings,
    browseSpaces,
    cancelBooking,
    editSpace,
    removeSpace,
    viewBooking,
    viewSpace,
} from "../services/rental.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
    bookingFiltersSchema,
    bookingIdParamsSchema,
    createBookingSchema,
    createRentalSpaceSchema,
    rentalSpaceFiltersSchema,
    rentalSpaceIdParamsSchema,
    updateBookingStatusSchema,
    updateRentalSpaceSchema,
} from "../validators/rental.validator.js";

export async function listRentalSpacesController(req, res, next) {
  try {
    const parsed = rentalSpaceFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browseSpaces(parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Rental spaces fetched successfully",
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.page * result.limit < result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRentalSpaceController(req, res, next) {
  try {
    const parsed = rentalSpaceIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const space = await viewSpace(parsed.data.spaceId);

    return successResponse(res, {
      statusCode: 200,
      message: "Rental space fetched successfully",
      data: space,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRentalSpaceController(req, res, next) {
  try {
    const parsed = createRentalSpaceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const space = await addSpace(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Rental space created successfully",
      data: space,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRentalSpaceController(req, res, next) {
  try {
    const paramsParsed = rentalSpaceIdParamsSchema.safeParse(req.params);
    const bodyParsed = updateRentalSpaceSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const space = await editSpace(req.user, paramsParsed.data.spaceId, bodyParsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Rental space updated successfully",
      data: space,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRentalSpaceController(req, res, next) {
  try {
    const parsed = rentalSpaceIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const space = await removeSpace(req.user, parsed.data.spaceId);

    return successResponse(res, {
      statusCode: 200,
      message: "Rental space removed successfully",
      data: space,
    });
  } catch (error) {
    next(error);
  }
}

export async function listBookingsController(req, res, next) {
  try {
    const parsed = bookingFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browseBookings(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Bookings fetched successfully",
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: result.page * result.limit < result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingController(req, res, next) {
  try {
    const parsed = bookingIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const booking = await viewBooking(req.user, parsed.data.bookingId);

    return successResponse(res, {
      statusCode: 200,
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBookingController(req, res, next) {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const booking = await bookSpace(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelBookingController(req, res, next) {
  try {
    const parsed = bookingIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const booking = await cancelBooking(req.user, parsed.data.bookingId);

    return successResponse(res, {
      statusCode: 200,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateBookingStatusController(req, res, next) {
  try {
    const paramsParsed = bookingIdParamsSchema.safeParse(req.params);
    const bodyParsed = updateBookingStatusSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const booking = await adminUpdateBookingStatus(
      paramsParsed.data.bookingId,
      bodyParsed.data.status
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}