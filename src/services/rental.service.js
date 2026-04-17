import {
    cancelBookingById,
    createBookingTransactional,
    createRentalSpace,
    getBookingById,
    getRentalSpaceById,
    listBookings,
    listRentalSpaces,
    softDeleteRentalSpace,
    updateBookingStatusById,
    updateRentalSpaceById,
} from "../repositories/rental.repository.js";
import { getVendorProfileByUserId } from "../repositories/vendor.repository.js";
import AppError from "../utils/AppError.js";

async function assertBookingAccess(user, booking) {
  if (user.role === "admin") return;

  if (user.role === "customer") {
    if (booking.customerId !== user.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return;
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    if (booking.vendorId !== vendorProfile.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return;
  }

  throw new AppError("Forbidden", 403, "FORBIDDEN");
}

export async function browseSpaces(query) {
  return listRentalSpaces(query);
}

export async function viewSpace(spaceId) {
  const space = await getRentalSpaceById(spaceId);
  if (!space) {
    throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
  }
  return space;
}

export async function addSpace(user, payload) {
  if (user.role !== "vendor" && user.role !== "admin") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  let vendorId = payload.vendorId || null;

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    if (vendorProfile.certification_status !== "approved") {
      throw new AppError("Vendor is not approved", 403, "VENDOR_NOT_APPROVED");
    }
    vendorId = vendorProfile.id;
  }

  const space = await createRentalSpace({
    vendorId,
    location: payload.location,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    size: payload.size,
    price: payload.price,
    availability: payload.availability ?? true,
  });

  return space;
}

export async function editSpace(user, spaceId, payload) {
  const existing = await getRentalSpaceById(spaceId);
  if (!existing) {
    throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
  }

  const updates = {};
  if (payload.location !== undefined) updates.location = payload.location;
  if (payload.latitude !== undefined) updates.latitude = payload.latitude;
  if (payload.longitude !== undefined) updates.longitude = payload.longitude;
  if (payload.size !== undefined) updates.size = payload.size;
  if (payload.price !== undefined) updates.price = payload.price;
  if (payload.availability !== undefined) updates.availability = payload.availability;

  if (user.role === "admin") {
    const updated = await updateRentalSpaceById(spaceId, updates);
    if (!updated) throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
    return updated;
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }

    if (existing.vendorId !== vendorProfile.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const updated = await updateRentalSpaceById(spaceId, updates);
    if (!updated) throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
    return updated;
  }

  throw new AppError("Forbidden", 403, "FORBIDDEN");
}

export async function removeSpace(user, spaceId) {
  const existing = await getRentalSpaceById(spaceId);
  if (!existing) {
    throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
  }

  if (user.role === "admin") {
    const deleted = await softDeleteRentalSpace(spaceId);
    if (!deleted) throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
    return deleted;
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }

    if (existing.vendorId !== vendorProfile.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const deleted = await softDeleteRentalSpace(spaceId);
    if (!deleted) throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
    return deleted;
  }

  throw new AppError("Forbidden", 403, "FORBIDDEN");
}

export async function browseBookings(user, query) {
  if (user.role === "admin") {
    return listBookings(query);
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }

    return listBookings({
      ...query,
      vendorId: vendorProfile.id,
    });
  }

  return listBookings({
    ...query,
    userId: user.id,
  });
}

export async function viewBooking(user, bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  await assertBookingAccess(user, booking);
  return booking;
}

export async function bookSpace(user, payload) {
  if (user.role !== "customer") {
    throw new AppError("Only customers can book rental spaces", 403, "FORBIDDEN");
  }

  if (new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new AppError("endDate must be after startDate", 400, "VALIDATION_ERROR");
  }

  const clientBooking = await createBookingTransactional({
    rentalSpaceId: payload.rentalSpaceId,
    customerId: user.id,
    vendorId: null,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  if (!clientBooking) {
    throw new AppError("Rental space not found", 404, "RENTAL_SPACE_NOT_FOUND");
  }

  const booking = await getBookingById(clientBooking.id);
  return booking || clientBooking;
}

export async function cancelBooking(user, bookingId) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  await assertBookingAccess(user, booking);

  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new AppError("Booking cannot be cancelled", 400, "INVALID_BOOKING_STATE");
  }

  const cancelled = await cancelBookingById(bookingId);
  if (!cancelled) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  return cancelled;
}

export async function adminUpdateBookingStatus(bookingId, status) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  const updated = await updateBookingStatusById(bookingId, status);
  if (!updated) {
    throw new AppError("Booking not found", 404, "BOOKING_NOT_FOUND");
  }

  return updated;
}