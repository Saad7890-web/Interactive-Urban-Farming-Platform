import { login, me, register } from "../services/auth.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

export async function registerController(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await register(parsed.data);

    return successResponse(res, {
      statusCode: 201,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }

    const result = await login(parsed.data);

    return successResponse(res, {
      statusCode: 200,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(req, res, next) {
  try {
    const result = await me(req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: "Profile fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}