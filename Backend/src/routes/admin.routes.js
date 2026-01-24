import express from "express";
import { verifyJWT, requireAdmin, requireAdminOrigin } from "../middlewares/auth.middleware.js";
import { adminLogin, adminLogout, getAllUsers, getUserById, addProduct, addCategory, deleteProduct, deleteUserById, getAllCategories, getProductById, getAllProducts, updateProduct, createBanner, getAllBanners, updateBanner, deleteBanner } from "../controllers/admin.controller.js";

import multer from "multer";



const upload = multer({ dest: "uploads/" });

const router = express.Router();

// ============ AUTH ROUTES ============
router.post("/login", requireAdminOrigin, adminLogin);
router.post("/logout", requireAdminOrigin, verifyJWT, requireAdmin, adminLogout);

// ============ USER MANAGEMENT ROUTES ============
router.get("/users", verifyJWT, requireAdmin, getAllUsers);
router.get("/users/:id", verifyJWT, requireAdmin, getUserById);
router.delete("/users/:id", verifyJWT, requireAdmin, deleteUserById);

// ============ PRODUCT ROUTES ============
router.post("/addproduct", verifyJWT, requireAdmin, upload.single("image"), addProduct);
router.put("/updateproduct/:id", verifyJWT, requireAdmin, upload.single("image"), updateProduct);
router.delete("/deleteproduct/:id", verifyJWT, requireAdmin, deleteProduct);
router.get("/products", verifyJWT, requireAdmin, getAllProducts);
router.get("/products/:id", verifyJWT, requireAdmin, getProductById);

// ============ CATEGORY ROUTES ============
router.post("/addcategory", verifyJWT, requireAdmin, addCategory);
router.get("/categories", verifyJWT, requireAdmin, getAllCategories);

// ============ BANNER ROUTES ============
router.get("/banners", verifyJWT, requireAdmin, getAllBanners);
router.post("/banners", verifyJWT, requireAdmin, upload.single("image"), createBanner);
router.put("/banners/:id", verifyJWT, requireAdmin, upload.single("image"), updateBanner);
router.delete("/banners/:id", verifyJWT, requireAdmin, deleteBanner);

export default router;
