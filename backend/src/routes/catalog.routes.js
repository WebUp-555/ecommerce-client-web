import { Router } from "express";
import { getAllProducts, getProductById, getAllCategories, getActiveBanners } from "../controllers/admin.controller.js";
import { addToCart, removeFromCart, getCart } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { resolveCartItemByType } from "../middlewares/productType.middleware.js";

const router = Router();

// Public catalog endpoints (no auth)
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);
router.get("/categories", getAllCategories);
router.get("/banners", getActiveBanners);
router.post("/cart/add", verifyJWT, resolveCartItemByType, addToCart);
router.post("/cart/remove", verifyJWT, removeFromCart);
router.get("/cart", verifyJWT, getCart);


export default router;
