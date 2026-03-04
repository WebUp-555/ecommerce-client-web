import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Product } from "../models/products.model.js";
import { Category } from "../models/category.model.js";
import { Banner } from "../models/banner.model.js";
import { Contact } from "../models/contact.model.js";

const ADMIN_ROLE = "admin";

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const adminUser = await User.findOne({ email, role: ADMIN_ROLE });
  if (!adminUser) {
    throw new ApiError(401, "Admin not found or not an admin");
  }

  const isPasswordValid = await adminUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    { _id: adminUser._id, email: adminUser.email, role: adminUser.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" }
  );

  res.status(200).json({
    success: true,
    token,
    message: "Admin logged in successfully",
  });
});

export const adminLogout = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/admin",
  };

  try {
    res.clearCookie("adminAccessToken", cookieOptions);
  } catch {}

  try {
    res.clearCookie("accessToken", cookieOptions);
  } catch {}

  res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.status(200).json({ success: true, users, message: "All users fetched successfully" });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ success: true, user, message: "User fetched successfully" });
});

export const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ success: true, message: "User deleted successfully" });
});

export const addCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description });

  res.status(201).json({
    success: true,
    message: "Category added successfully",
    category,
  });
});

export const addProduct = asyncHandler(async (req, res) => {
  let { name, description, category, price, stock, discount, type } = req.body;

  if (type && type !== "catalog") {
    throw new ApiError(400, "Admin can only create catalog products");
  }

  if (category && !mongoose.isValidObjectId(category)) {
    const catDoc = await Category.findOne({ name: category }).lean();
    if (!catDoc) {
      throw new ApiError(400, "Invalid category name");
    }
    category = catDoc._id;
  }

  let image = null;
  if (req.file?.secure_url) {
    image = req.file.secure_url;
  } else if (req.file?.filename) {
    image = `/uploads/${req.file.filename}`;
  }

  const product = await Product.create({
    type: "catalog",
    name,
    description,
    category,
    price: price ? Number(price) : undefined,
    discount: discount ? Number(discount) : 0,
    stock: stock ? Number(stock) : undefined,
    image,
    isPublic: true,
  });

  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { name, description, category, price, stock, discount } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (price !== undefined) updateData.price = Number(price);
  if (discount !== undefined) updateData.discount = Number(discount) || 0;
  if (stock !== undefined) updateData.stock = Number(stock);

  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      const catDoc = await Category.findOne({ name: category }).lean();
      if (!catDoc) {
        throw new ApiError(400, "Invalid category name");
      }
      updateData.category = catDoc._id;
    } else {
      updateData.category = category;
    }
  }

  if (req.file?.secure_url) {
    updateData.image = req.file.secure_url;
  } else if (req.file?.filename) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true })
    .populate("category", "name slug")
    .lean();

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, product: updatedProduct });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Product deleted successfully" });
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const isAdmin = (req.user?.role || "").toLowerCase() === "admin";
  const query = isAdmin
    ? {}
    : {
        $and: [
          {
            $or: [{ type: "catalog" }, { type: { $exists: false } }, { type: null }],
          },
          {
            $or: [{ isPublic: true }, { isPublic: { $exists: false } }, { isPublic: null }],
          },
        ],
      };

  const products = await Product.find(query).populate("category", "name slug").lean();
  res.json({ success: true, products });
});

export const getProductById = asyncHandler(async (req, res) => {
  const isAdmin = (req.user?.role || "").toLowerCase() === "admin";
  const product = await Product.findById(req.params.id).populate("category", "name slug").lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const isCatalogLike = !product.type || product.type === "catalog";
  const isPublicLike = product.isPublic !== false;

  if (!isAdmin && (!isCatalogLike || !isPublicLike)) {
    throw new ApiError(404, "Product not found");
  }

  res.json({ success: true, product });
});

export const getAllCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().lean();
  res.json({ success: true, categories });
});

export const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, badge, ctaText, ctaLink, order, active } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  let image = null;
  if (req.file?.secure_url) {
    image = req.file.secure_url;
  } else if (req.file?.filename) {
    image = `/uploads/${req.file.filename}`;
  } else if (req.body.image) {
    image = req.body.image;
  }

  if (!image) {
    throw new ApiError(400, "Banner image is required");
  }

  const banner = await Banner.create({
    title,
    subtitle,
    badge,
    ctaText,
    ctaLink,
    image,
    order: Number(order) || 0,
    active: active === undefined ? true : active === "true" || active === true,
  });

  res.status(201).json({ success: true, banner });
});

export const getAllBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ success: true, banners });
});

export const getActiveBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
  res.json({ success: true, banners });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, badge, ctaText, ctaLink, order, active } = req.body;
  const updateData = {};

  if (title) updateData.title = title;
  if (subtitle !== undefined) updateData.subtitle = subtitle;
  if (badge !== undefined) updateData.badge = badge;
  if (ctaText !== undefined) updateData.ctaText = ctaText;
  if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
  if (order !== undefined) updateData.order = Number(order) || 0;
  if (active !== undefined) updateData.active = active === "true" || active === true;

  if (req.file?.secure_url) {
    updateData.image = req.file.secure_url;
  } else if (req.file?.filename) {
    updateData.image = `/uploads/${req.file.filename}`;
  } else if (req.body.image) {
    updateData.image = req.body.image;
  }

  const banner = await Banner.findByIdAndUpdate(id, updateData, { new: true });
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  res.json({ success: true, banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  res.json({ success: true, message: "Banner deleted successfully" });
});

export const getAllContacts = asyncHandler(async (_req, res) => {
  const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, contacts });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  res.json({ success: true, message: "Contact deleted successfully" });
});
