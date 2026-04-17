import {
    addPlantTrackingEvent,
    createPlantTrack,
    getPlantTrackById,
    listPlantTrackingEvents,
    listPlantTracks,
    updatePlantTrackById,
} from "../repositories/tracking.repository.js";
import { getVendorProfileByUserId } from "../repositories/vendor.repository.js";
import AppError from "../utils/AppError.js";

async function assertTrackAccess(user, track) {
  if (user.role === "admin") return;

  if (user.role === "customer") {
    if (track.userId !== user.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return;
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }

    if (track.vendorId !== vendorProfile.id) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    return;
  }

  throw new AppError("Forbidden", 403, "FORBIDDEN");
}

function emitTrackEvent(io, eventName, payload, trackId, userId = null) {
  if (!io) return;

  io.to(`plant:${trackId}`).emit(eventName, payload);

  if (userId) {
    io.to(`user:${userId}`).emit(eventName, payload);
  }
}

export async function browsePlantTracks(user, query) {
  if (user.role === "admin") {
    return listPlantTracks(query);
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }

    return listPlantTracks({
      ...query,
      vendorId: vendorProfile.id,
    });
  }

  return listPlantTracks({
    ...query,
    userId: user.id,
  });
}

export async function viewPlantTrack(user, plantId) {
  const track = await getPlantTrackById(plantId);
  if (!track) {
    throw new AppError("Plant track not found", 404, "PLANT_TRACK_NOT_FOUND");
  }

  await assertTrackAccess(user, track);
  return track;
}

export async function addTrack(user, payload, io = null) {
  let userId = payload.userId || user.id;
  let vendorId = payload.vendorId || null;

  if (user.role === "customer") {
    userId = user.id;
  } else if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    vendorId = vendorProfile.id;
    if (userId !== user.id && !payload.userId) {
      userId = user.id;
    }
  } else if (user.role === "admin") {
    if (!payload.userId) {
      userId = user.id;
    }
  } else {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const track = await createPlantTrack({
    userId,
    vendorId,
    rentalBookingId: payload.rentalBookingId ?? null,
    plantName: payload.plantName,
    species: payload.species ?? null,
    plantedAt: payload.plantedAt ?? null,
    expectedHarvestDate: payload.expectedHarvestDate ?? null,
    healthStatus: payload.healthStatus,
    growthStage: payload.growthStage,
    currentNotes: payload.currentNotes ?? null,
  });

  const payloadForSocket = {
    plantTrack: track,
  };

  emitTrackEvent(io, "plant:created", payloadForSocket, track.id, track.user_id);
  return track;
}

export async function editTrack(user, plantId, payload, io = null) {
  const existing = await getPlantTrackById(plantId);
  if (!existing) {
    throw new AppError("Plant track not found", 404, "PLANT_TRACK_NOT_FOUND");
  }

  await assertTrackAccess(user, existing);

  const updates = {};
  if (payload.healthStatus !== undefined) updates.health_status = payload.healthStatus;
  if (payload.growthStage !== undefined) updates.growth_stage = payload.growthStage;
  if (payload.currentNotes !== undefined) updates.current_notes = payload.currentNotes;
  if (payload.expectedHarvestDate !== undefined) updates.expected_harvest_date = payload.expectedHarvestDate;

  const updated = await updatePlantTrackById(plantId, updates);

  if (!updated) {
    throw new AppError("Plant track not found", 404, "PLANT_TRACK_NOT_FOUND");
  }

  emitTrackEvent(io, "plant:updated", { plantTrack: updated }, updated.id, existing.userId);
  return updated;
}

export async function browseEvents(user, plantId, query) {
  const track = await getPlantTrackById(plantId);
  if (!track) {
    throw new AppError("Plant track not found", 404, "PLANT_TRACK_NOT_FOUND");
  }

  await assertTrackAccess(user, track);
  return listPlantTrackingEvents({ plantId, ...query });
}

export async function createEvent(user, plantId, payload, io = null) {
  const track = await getPlantTrackById(plantId);
  if (!track) {
    throw new AppError("Plant track not found", 404, "PLANT_TRACK_NOT_FOUND");
  }

  await assertTrackAccess(user, track);

  const event = await addPlantTrackingEvent({
    plantTrackId: plantId,
    eventType: payload.eventType,
    eventPayload: payload.eventPayload ?? null,
  });

  emitTrackEvent(
    io,
    "plant:event_created",
    { event, plantTrackId: plantId },
    plantId,
    track.userId
  );

  return event;
}