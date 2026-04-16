import {
    approveCertByAdmin,
    approveVendorByAdmin,
    listCertifications,
    listVendors,
    rejectCertByAdmin,
    rejectVendorByAdmin,
    viewVendor,
} from "../services/admin.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { paginationSchema, reviewSchema } from "../validators/admin.validator.js";

export async function getVendorsController(req, res, next) {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await listVendors(parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Vendors fetched successfully",
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

export async function getVendorByIdController(req, res, next) {
  try {
    const vendor = await viewVendor(req.params.vendorId);

    return successResponse(res, {
      statusCode: 200,
      message: "Vendor fetched successfully",
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveVendorController(req, res, next) {
  try {
    const vendor = await approveVendorByAdmin(req.params.vendorId, req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: "Vendor approved successfully",
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectVendorController(req, res, next) {
  try {
    const vendor = await rejectVendorByAdmin(req.params.vendorId, req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: "Vendor rejected successfully",
      data: vendor,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCertificationsController(req, res, next) {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await listCertifications(parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Certifications fetched successfully",
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

export async function approveCertificationController(req, res, next) {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const cert = await approveCertByAdmin(
      req.params.certId,
      req.user.id,
      parsed.data.notes || null
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Certification approved successfully",
      data: cert,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectCertificationController(req, res, next) {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const cert = await rejectCertByAdmin(
      req.params.certId,
      req.user.id,
      parsed.data.notes || null
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Certification rejected successfully",
      data: cert,
    });
  } catch (error) {
    next(error);
  }
}