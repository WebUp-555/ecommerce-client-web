// controllers/order.controller.js
import crypto from "crypto";
import Order from "../models/order.models.js";
import { razorpay } from "../config/razorpay.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Cart } from "../models/addToCart.model.js";

/**
 * STATUS FLOW (Final)
 * pending_payment -> paid -> processing -> shipped -> delivered
 * paid/processing can be cancelled
 * failed/cancelled/delivered are terminal
 */

// ✅ 1) PAYNOW (Create Razorpay Order from Cart)
export const createPaymentOrderFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Cart is empty");

  let amount = 0;
  const itemsForOrder = [];

  for (const item of cart.items) {
    const product = item.product; // populated product
    if (!product) throw new ApiError(404, "Product not found in cart");

    const qty = Number(item.quantity);
    if (!qty || qty <= 0) throw new ApiError(400, "Invalid quantity");

    amount += product.price * qty;

    itemsForOrder.push({
      productId: product._id,
      title: product.name,
      price: product.price,
      quantity: qty,
    });
  }

  if (amount <= 0) throw new ApiError(400, "Invalid amount");

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

  const dbOrder = await Order.create({
    user: userId,
    items: itemsForOrder,
    amount, // rupees
    status: "pending_payment",
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

// ✅ 2) VERIFY PAYMENT (Signature verification + mark PAID + clear cart)
export const verifyPaymentAndCreateOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment fields");
  }

  const dbOrder = await Order.findOne({ _id: orderId, user: userId });
  if (!dbOrder) throw new ApiError(404, "Order not found");

  // ✅ Prevent mismatch attacks
  if (dbOrder.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Razorpay order id mismatch");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    dbOrder.status = "failed";
    await dbOrder.save();
    throw new ApiError(400, "Payment verification failed");
  }

  // ✅ Mark PAID
  dbOrder.status = "paid";
  dbOrder.razorpayPaymentId = razorpay_payment_id;
  dbOrder.razorpaySignature = razorpay_signature;
  await dbOrder.save();

  // ✅ Clear cart after successful payment
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

  return res
    .status(200)
    .json(new ApiResponse(200, { order: dbOrder }, "Payment verified & order confirmed"));
});

// ✅ 3) USER: Get My Orders (pagination + optional status filter)
export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

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

// ✅ 4) USER: Get My Order By Id
export const getMyOrderById = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const order = await Order.findOne({ _id: id, user: userId }).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");

  return res.status(200).json(new ApiResponse(200, { order }, "Order details fetched"));
});

// ✅ 5) USER: Cancel My Order
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { id } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) throw new ApiError(404, "Order not found");

  const cancellableStatuses = ["pending_payment", "paid", "processing"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled. Current status: ${order.status}`);
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = "Cancelled by user";
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order cancelled successfully"));
});

// ✅ ---------------- ADMIN CONTROLLERS ---------------- ✅

// ✅ 6) ADMIN: Get All Orders (pagination + optional status filter)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Order.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        limit: Number(limit),
        orders,
      },
      "All orders fetched"
    )
  );
});

// ✅ 7) ADMIN: Get Any Order By Id
export const adminGetOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");

  return res.status(200).json(new ApiResponse(200, { order }, "Order details fetched"));
});

// ✅ 8) ADMIN: Update Order Status (with safe transitions)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "failed",
  ];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const allowedTransitions = {
    pending_payment: ["failed", "cancelled"],
    paid: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
    failed: [],
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

// ✅ 9) ADMIN: Cancel Order
export const cancelOrderByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const cancellableStatuses = ["pending_payment", "paid", "processing"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled. Current status: ${order.status}`);
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason || "Cancelled by admin";
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order cancelled by admin"));
});

// ✅ 10) ADMIN: Delete Order (Only pending_payment/failed - optional)
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (!["pending_payment", "failed"].includes(order.status)) {
    throw new ApiError(400, "Only unpaid/failed orders can be deleted");
  }

  await Order.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, "Order deleted successfully"));
});
