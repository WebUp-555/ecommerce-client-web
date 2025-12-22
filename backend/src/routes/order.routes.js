import express from "express";
import { verifyJWT, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  getAllOrders,
  deleteOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// ============ USER ORDER ROUTES ============
router.post("/", verifyJWT, createOrder); // Create order
router.get("/user", verifyJWT, getOrdersByUser); // Get user's orders
router.get("/:id", verifyJWT, getOrderById); // Get order by ID

// ============ ADMIN ORDER ROUTES ============
router.get("/", verifyJWT, requireAdmin, getAllOrders); // Get all orders (admin)
router.patch("/:id/status", verifyJWT, requireAdmin, updateOrderStatus); // Update order status (admin)
router.delete("/:id", verifyJWT, requireAdmin, deleteOrder); // Delete order (admin)

export default router;
