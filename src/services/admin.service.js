import {
    approveCertification,
    approveVendor,
    getCertifications,
    getVendorById,
    getVendors,
    rejectCertification,
    rejectVendor,
} from "../repositories/admin.repository.js";
import AppError from "../utils/AppError.js";

export async function listVendors(query) {
  return getVendors(query);
}

export async function viewVendor(vendorId) {
  const vendor = await getVendorById(vendorId);
  if (!vendor) {
    throw new AppError("Vendor not found", 404, "VENDOR_NOT_FOUND");
  }
  return vendor;
}

export async function approveVendorByAdmin(vendorId, adminId) {
  const vendor = await approveVendor(vendorId, adminId);
  if (!vendor) {
    throw new AppError("Vendor not found", 404, "VENDOR_NOT_FOUND");
  }
  return vendor;
}

export async function rejectVendorByAdmin(vendorId, adminId) {
  const vendor = await rejectVendor(vendorId, adminId);
  if (!vendor) {
    throw new AppError("Vendor not found", 404, "VENDOR_NOT_FOUND");
  }
  return vendor;
}

export async function listCertifications(query) {
  return getCertifications(query);
}

export async function approveCertByAdmin(certId, adminId, notes = null) {
  const cert = await approveCertification(certId, adminId, notes);
  if (!cert) {
    throw new AppError("Certification not found", 404, "CERTIFICATION_NOT_FOUND");
  }
  return cert;
}

export async function rejectCertByAdmin(certId, adminId, notes = null) {
  const cert = await rejectCertification(certId, adminId, notes);
  if (!cert) {
    throw new AppError("Certification not found", 404, "CERTIFICATION_NOT_FOUND");
  }
  return cert;
}