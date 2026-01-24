// routes/order.routes.js
import express from "express";
import { createPaymentOrderFromCart, verifyPaymentAndCreateOrder,getAllOrders,getOrderById,deleteOrder,cancelMyOrder,cancelOrderByAdmin,getMyOrders } from "../controllers/order.controller.js";
import { verifyJWT} from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/paynow", verifyJWT, createPaymentOrderFromCart);
router.post("/verify", verifyJWT, verifyPaymentAndCreateOrder);
router.get("/", verifyJWT, requireAdmin, getAllOrders);
router.get("/:orderId", verifyJWT, requireAdmin, getOrderById);
router.delete("/:orderId", verifyJWT, requireAdmin, deleteOrder);
router.post("/cancel/myorder/:orderId", verifyJWT, cancelMyOrder);
router.post("/cancel/order/:orderId", verifyJWT, requireAdmin, cancelOrderByAdmin);
router.get("/myorders", verifyJWT, getMyOrders);

export default router;
