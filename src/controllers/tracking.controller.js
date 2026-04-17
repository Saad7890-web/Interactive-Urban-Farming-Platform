import {
    addTrack,
    browseEvents,
    browsePlantTracks,
    createEvent,
    editTrack,
    viewPlantTrack,
} from "../services/tracking.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
    createPlantEventSchema,
    createPlantTrackSchema,
    plantFiltersSchema,
    plantIdParamsSchema,
    updatePlantTrackSchema,
} from "../validators/tracking.validator.js";

export async function listPlantTracksController(req, res, next) {
  try {
    const parsed = plantFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browsePlantTracks(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Plant tracks fetched successfully",
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

export async function getPlantTrackController(req, res, next) {
  try {
    const paramsParsed = plantIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const track = await viewPlantTrack(req.user, paramsParsed.data.plantId);

    return successResponse(res, {
      statusCode: 200,
      message: "Plant track fetched successfully",
      data: track,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPlantTrackController(req, res, next) {
  try {
    const parsed = createPlantTrackSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const io = req.app.get("io");
    const track = await addTrack(req.user, parsed.data, io);

    return successResponse(res, {
      statusCode: 201,
      message: "Plant track created successfully",
      data: track,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePlantTrackController(req, res, next) {
  try {
    const paramsParsed = plantIdParamsSchema.safeParse(req.params);
    const bodyParsed = updatePlantTrackSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const io = req.app.get("io");
    const track = await editTrack(req.user, paramsParsed.data.plantId, bodyParsed.data, io);

    return successResponse(res, {
      statusCode: 200,
      message: "Plant track updated successfully",
      data: track,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPlantEventsController(req, res, next) {
  try {
    const paramsParsed = plantIdParamsSchema.safeParse(req.params);
    const querySchema = plantFiltersSchema.pick({ page: true, limit: true });
    const queryParsed = querySchema.safeParse(req.query);

    if (!paramsParsed.success || !queryParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browseEvents(req.user, paramsParsed.data.plantId, queryParsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Plant tracking events fetched successfully",
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

export async function createPlantEventController(req, res, next) {
  try {
    const paramsParsed = plantIdParamsSchema.safeParse(req.params);
    const bodyParsed = createPlantEventSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const io = req.app.get("io");
    const event = await createEvent(req.user, paramsParsed.data.plantId, bodyParsed.data, io);

    return successResponse(res, {
      statusCode: 201,
      message: "Plant tracking event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
}