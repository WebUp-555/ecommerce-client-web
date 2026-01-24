import { Router } from "express";
import { getAllProducts, getProductById, getAllCategories, addToCart, removeFromCart, getCart, getActiveBanners } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public catalog endpoints (no auth)
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);
router.get("/categories", getAllCategories);
router.get("/banners", getActiveBanners);
router.post("/cart/add", verifyJWT, addToCart);
router.post("/cart/remove", verifyJWT, removeFromCart);
router.get("/cart", verifyJWT, getCart);


export default router;
