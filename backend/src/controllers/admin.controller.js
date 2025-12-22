import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Product } from "../models/products.model.js";
import { Category } from "../models/category.model.js";
import { Cart } from "../models/addToCart.model.js";
import { Banner } from "../models/banner.model.js";

import mongoose from "mongoose";

const ADMIN_ROLE = "admin";

// 🧑‍💼 Admin Login
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

  // Do NOT set a global cookie to avoid affecting the main site.
  // Admin dashboard uses Authorization: Bearer <token> from localStorage.

  res.status(200).json({
    success: true,
    token,
    message: "Admin logged in successfully",
  });
});

// 👥 Get All Users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.status(200).json({
    success: true,
    users,
    message: "All users fetched successfully",
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json({
    success: true,
    user,
    message: "User fetched successfully",
  });
});

export const deleteUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
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

// ✅ Add product (supports category name or ObjectId)
export const addProduct = asyncHandler(async (req, res) => {
  let { name, description, category, price, stock } = req.body;

  if (category && !mongoose.isValidObjectId(category)) {
    const catDoc = await Category.findOne({ name: category }).lean();
    if (!catDoc) {
      throw new ApiError(400, 'Invalid category name');
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
    name,
    description,
    category,
    price: price ? Number(price) : undefined,
    stock: stock ? Number(stock) : undefined,
    image
  });

  res.status(201).json({ success: true, product });
});

// ✅ Delete product (removes from DB + Cloudinary)
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const imageUrl = product.image || product.productImage;
  if (imageUrl && /res\.cloudinary\.com/i.test(imageUrl)) {
    const publicId = imageUrl.split("/").pop().split(".")[0];
    try { await deleteFromCloudinary(publicId); } catch (_) { /* ignore */ }
  }

  await Product.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "🗑️ Product deleted successfully" });
});

// 🚪 Admin Logout
export const adminLogout = asyncHandler(async (req, res) => {
  // Clear any admin-scoped cookie if it exists (backward compatibility)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/admin"
  };
  try { res.clearCookie("adminAccessToken", cookieOptions); } catch (_) {}
  try { res.clearCookie("accessToken", cookieOptions); } catch (_) {}
  res.status(200).json({ success: true, message: "Admin logged out successfully" });
});

// List all products (public)
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("category", "name slug")
    .lean();
  res.json({ success: true, products });
});

// Single product (public)
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .lean();
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  res.json({ success: true, product });
});

// List categories (public)
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().lean();
  res.json({ success: true, categories });
});

export const updateProduct = asyncHandler(async (req, res) => {  
  const { id } = req.params;
  let { name, description, category, price, stock } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (price) updateData.price = Number(price);
  if (stock) updateData.stock = Number(stock);
  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      const catDoc = await Category.findOne({ name: category }).lean();
      if (!catDoc) {
        throw new ApiError(400, 'Invalid category name');
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

// 🎞️ Create a banner (admin)
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

// 📋 Get all banners (admin)
export const getAllBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ success: true, banners });
});

// 🏠 Get active banners (public)
export const getActiveBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({ active: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json({ success: true, banners });
});

// ✏️ Update banner (admin)
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

// 🗑️ Delete banner (admin)
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  res.json({ success: true, message: "Banner deleted successfully" });
});


export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  let { productId, quantity } = req.body;
  quantity = Number(quantity) || 0;
  
  if (!productId || quantity < 1) {
    throw new ApiError(400, "Product ID and valid quantity are required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let cart = await Cart.findOne({ user: userId });
  let existingQuantity = 0;

  if (cart) {
    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingQuantity = existingItem.quantity;
    }
  }

  // Check total quantity against stock
  if (product.stock < (quantity + existingQuantity)) {
    throw new ApiError(400, `Insufficient stock. Available: ${product.stock}, Requested: ${quantity + existingQuantity}`);
  }

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [{ product: productId, quantity }] });
  } else {
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();
  }

  res.status(200).json({ success: true, message: "Product added to cart successfully", cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const { productId } = req.body;
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  if (cart.items.length === initialLength) {
    throw new ApiError(404, "Product not found in cart");
  }

  await cart.save();
  res.status(200).json({ success: true, message: "Product removed from cart successfully", cart });
});

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) {
    return res.status(200).json({ success: true, cart: null, totalAmount: 0, items: [] });
  }

  // Filter out items where product no longer exists
  const validItems = cart.items.filter(item => item.product != null);
  
  const totalAmount = validItems.reduce((sum, item) => {
    const price = Number(item.product.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  // Update cart if invalid items were found
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  res.status(200).json({ success: true, cart, totalAmount });
});

