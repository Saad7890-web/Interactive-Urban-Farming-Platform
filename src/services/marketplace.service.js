import {
    createOrderTransactional,
    listOrders,
} from "../repositories/order.repository.js";
import {
    createProduct,
    getProductById,
    listProducts,
    softDeleteOwnProduct,
    softDeleteProductById,
    updateOwnProductById,
    updateProductById,
} from "../repositories/product.repository.js";
import { getVendorProfileByUserId } from "../repositories/vendor.repository.js";
import AppError from "../utils/AppError.js";

export async function browseProducts(query) {
  return listProducts(query);
}

export async function viewProduct(productId) {
  const product = await getProductById(productId);
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return product;
}

export async function addProduct(user, payload) {
  let vendorProfileId = null;
  let certificationStatus = payload.certificationStatus || "approved";

  if (user.role === "admin") {
    if (!payload.vendorId) {
      throw new AppError("vendorId is required for admin product creation", 400, "VALIDATION_ERROR");
    }
    vendorProfileId = payload.vendorId;
  } else if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    if (vendorProfile.certification_status !== "approved") {
      throw new AppError("Vendor is not approved for product listing", 403, "VENDOR_NOT_APPROVED");
    }
    vendorProfileId = vendorProfile.id;
    certificationStatus = "approved";
  } else {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const product = await createProduct({
    vendorId: vendorProfileId,
    name: payload.name,
    description: payload.description ?? null,
    price: payload.price,
    category: payload.category,
    availableQuantity: payload.availableQuantity ?? 0,
    certificationStatus,
  });

  return product;
}

export async function editProduct(user, productId, payload) {
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.price !== undefined) updates.price = payload.price;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.availableQuantity !== undefined) updates.available_quantity = payload.availableQuantity;
  if (payload.certificationStatus !== undefined) updates.certification_status = payload.certificationStatus;
  if (payload.isActive !== undefined) updates.is_active = payload.isActive;

  let updated = null;

  if (user.role === "admin") {
    updated = await updateProductById(productId, updates);
  } else if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    if (vendorProfile.certification_status !== "approved") {
      throw new AppError("Vendor is not approved", 403, "VENDOR_NOT_APPROVED");
    }

    updated = await updateOwnProductById(productId, vendorProfile.id, updates);
  } else {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (!updated) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return updated;
}

export async function removeProduct(user, productId) {
  let deleted = null;

  if (user.role === "admin") {
    deleted = await softDeleteProductById(productId);
  } else if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    deleted = await softDeleteOwnProduct(productId, vendorProfile.id);
  } else {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (!deleted) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return deleted;
}

export async function placeOrder(user, payload) {
  if (user.role !== "customer") {
    throw new AppError("Only customers can place orders", 403, "FORBIDDEN");
  }

  return createOrderTransactional({
    userId: user.id,
    produceId: payload.produceId,
    quantity: payload.quantity,
  });
}

export async function browseOrders(user, query) {
  if (user.role === "admin") {
    return listOrders(query);
  }

  if (user.role === "vendor") {
    const vendorProfile = await getVendorProfileByUserId(user.id);
    if (!vendorProfile) {
      throw new AppError("Vendor profile not found", 404, "VENDOR_PROFILE_NOT_FOUND");
    }
    return listOrders({
      ...query,
      vendorProfileId: vendorProfile.id,
    });
  }

  return listOrders({
    ...query,
    userId: user.id,
  });
}