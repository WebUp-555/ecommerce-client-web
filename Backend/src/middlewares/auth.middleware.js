import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Prefer explicit Authorization header over cookies to avoid cross-app interference
    const token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized request - Token missing");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = user; // make user available in routes
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

export const requireAdmin = (req, _, next) => {
  const role = (req.user?.role || "").trim().toLowerCase();
  if (role !== "admin") {
    throw new ApiError(403, "Forbidden: Admins only");
  }
  next();
};

export const requireUser = (req, _, next) => {
  const role = (req.user?.role || "").trim().toLowerCase();
  if (role !== "user") {
    throw new ApiError(403, "Forbidden: Users only");
  }
  next();
};

// Restrict admin login/logout endpoints to admin dashboard origins only
export const requireAdminOrigin = (req, _, next) => {
  const origin = req.headers?.origin || "";
  const adminOrigins = new Set([
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ]);

  // Allow requests without origin (e.g., Postman, curl)
  if (!origin) return next();

  if (!adminOrigins.has(origin)) {
    throw new ApiError(403, "Admin auth allowed only from admin dashboard origin");
  }
  next();
};
