// controllers/order.controller.js
import crypto from "crypto";
import Order from "../models/order.models.js";
import { razorpay } from "../config/razorpay.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Cart} from "../models/addToCart.model.js";


import {Product} from "../models/products.model.js";

export const createPaymentOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  let amount = 0;
  const itemsForOrder = [];

  for (const item of cart.items) {
    const product = item.product; // ✅ already populated

    if (!product) throw new ApiError(404, "Product not found in cart");

    const qty = Number(item.quantity);
    if (!qty || qty <= 0) throw new ApiError(400, "Invalid quantity");

    amount += product.price * qty;

    itemsForOrder.push({
      productId: product._id,
      title: product.name, // ✅ your product uses `name` not `title`
      price: product.price,
      quantity: qty,
    });
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const dbOrder = await Order.create({
    user: userId,
    items: itemsForOrder,
    amount,
    status: "PENDING_PAYMENT",
    razorpayOrderId: razorpayOrder.id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: dbOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: amount * 100,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      },
      "Razorpay order created from cart"
    )
  );
});


// ✅ Verify payment -> mark PAID
export const verifyPaymentAndCreateOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment fields");
  }

  const dbOrder = await Order.findOne({ _id: orderId, user: userId });
  if (!dbOrder) throw new ApiError(404, "Order not found");

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    dbOrder.status = "FAILED";
    await dbOrder.save();
    throw new ApiError(400, "Payment verification failed");
  }

  dbOrder.status = "PAID";
  dbOrder.razorpayPaymentId = razorpay_payment_id;
  dbOrder.razorpaySignature = razorpay_signature;
  await dbOrder.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { order: dbOrder }, "Payment verified & order confirmed"));
});

// Additional admin controllers can be added here, e.g., getAllOrders, getOrderById, updateOrderStatus, deleteOrder
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, { total, page: Number(page), limit: Number(limit), orders }, "All orders fetched")
  );
});


export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, { order }, "Order details fetched"));
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "PENDING_PAYMENT",
    "PAID",
    "ACCEPTED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "FAILED",
    "REJECTED",
  ];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  // ✅ allowed transitions map
  const allowedTransitions = {
    PENDING_PAYMENT: ["FAILED", "CANCELLED"],
    PAID: ["ACCEPTED", "REJECTED", "CANCELLED"],
    ACCEPTED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
    FAILED: [],
    REJECTED: [],
  };

  const current = order.status;
  const allowedNext = allowedTransitions[current] || [];

  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Cannot change status from ${current} to ${status}`);
  }

  order.status = status;
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order status updated"));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  // ✅ allow delete only for unpaid/failed orders
  if (!["PENDING_PAYMENT", "FAILED"].includes(order.status)) {
    throw new ApiError(400, "Only unpaid/failed orders can be deleted");
  }

  await Order.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, "Order deleted successfully"));
});


export const cancelMyOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) throw new ApiError(404, "Order not found");

  const cancellableStatuses = ["PENDING_PAYMENT", "PAID", "ACCEPTED"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled. Current status: ${order.status}`);
  }

  order.status = "CANCELLED";
  order.cancelledAt = new Date();
  order.cancelReason = "Cancelled by user";
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order cancelled successfully"));
});

export const cancelOrderByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const cancellableStatuses = ["PENDING_PAYMENT", "PAID", "ACCEPTED"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled. Current status: ${order.status}`);
  }

  order.status = "CANCELLED";
  order.cancelledAt = new Date();
  order.cancelReason = reason || "Cancelled by admin";
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order cancelled by admin"));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const status = req.query.status;

  const filter = { user: userId };
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page,
        limit,
        orders,
      },
      "User orders fetched"
    )
  );
});

