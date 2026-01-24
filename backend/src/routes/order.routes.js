// routes/order.routes.js
import express from "express";
import {
	createPaymentOrderFromCart,
	verifyPaymentAndCreateOrder,
	getAllOrders,
	adminGetOrderById,
	getMyOrderById,
	deleteOrder,
	cancelMyOrder,
	cancelOrderByAdmin,
	getMyOrders,
	updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyJWT} from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/paynow", verifyJWT, createPaymentOrderFromCart);
router.post("/verify", verifyJWT, verifyPaymentAndCreateOrder);
router.get("/", verifyJWT, requireAdmin, getAllOrders);
router.get("/my", verifyJWT, getMyOrders);
router.get("/my/:id", verifyJWT, getMyOrderById);
router.put("/:id", verifyJWT, requireAdmin, updateOrderStatus);
router.get("/:id", verifyJWT, requireAdmin, adminGetOrderById);
router.delete("/:id", verifyJWT, requireAdmin, deleteOrder);
router.post("/cancel/myorder/:id", verifyJWT, cancelMyOrder);
router.post("/cancel/order/:id", verifyJWT, requireAdmin, cancelOrderByAdmin);

export default router;
