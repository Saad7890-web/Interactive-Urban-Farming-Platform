import { findUserById } from "../repositories/user.repository.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await findUserById(decoded.userId);
    if (!user) {
      throw new AppError("User not found", 401, "UNAUTHORIZED");
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", 403, "ACCOUNT_INACTIVE");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
      ? new AppError("Invalid or expired token", 401, "INVALID_TOKEN")
      : error);
  }
}