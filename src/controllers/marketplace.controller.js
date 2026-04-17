import {
    addProduct,
    browseOrders,
    browseProducts,
    editProduct,
    placeOrder,
    removeProduct,
    viewProduct,
} from "../services/marketplace.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import {
    createOrderSchema,
    createProductSchema,
    orderFiltersSchema,
    productFiltersSchema,
    productIdParamsSchema,
    updateProductSchema,
} from "../validators/marketplace.validator.js";

export async function listProductsController(req, res, next) {
  try {
    const parsed = productFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browseProducts(parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Products fetched successfully",
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

export async function getProductController(req, res, next) {
  try {
    const parsed = productIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const product = await viewProduct(parsed.data.productId);

    return successResponse(res, {
      statusCode: 200,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductController(req, res, next) {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log(parsed.error.issues);
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const product = await addProduct(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const paramsParsed = productIdParamsSchema.safeParse(req.params);
    const bodyParsed = updateProductSchema.safeParse(req.body);

    if (!paramsParsed.success || !bodyParsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const product = await editProduct(
      req.user,
      paramsParsed.data.productId,
      bodyParsed.data
    );

    return successResponse(res, {
      statusCode: 200,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(req, res, next) {
  try {
    const parsed = productIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const product = await removeProduct(req.user, parsed.data.productId);

    return successResponse(res, {
      statusCode: 200,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrderController(req, res, next) {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const order = await placeOrder(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function listOrdersController(req, res, next) {
  try {
    const parsed = orderFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await browseOrders(req.user, parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Orders fetched successfully",
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