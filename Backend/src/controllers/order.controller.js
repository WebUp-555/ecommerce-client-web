import { Order } from "../models/order.models";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
export const createOrder = asyncHandler(async (req, res) => {
  const { items, address, pricing } = req.body;
  const userId = req.user._id;  
    const order = new Order({
        user: userId,
        items,
        address,
        pricing,
    });
    await order.save();
    res.status(201).json({ success: true, data: order });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId).populate('user', 'name email').populate('items.productId', 'name price');
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  res.status(200).json({ success: true, data: order });
});
export const getOrdersByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId })
    .populate('user', 'name email')
    .populate('items.productId', 'name price')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  // Check authorization - only admin can update order status
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Not authorized to update order status");
  }
  
  const orderId = req.params.id;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed values: ${validStatuses.join(', ')}`);
  }
  
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  } 
  order.status = status;
  await order.save();
  res.status(200).json({ success: true, data: order });
});
export const getAllOrders = asyncHandler(async (req, res) => {
  // Check authorization - only admin can view all orders
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Not authorized to view all orders");
  }
  
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('items.productId', 'name price')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: orders });
});
export const deleteOrder = asyncHandler(async (req, res) => {
  // Check authorization - only admin can delete orders
  if (req.user.role !== 'admin') {
    throw new ApiError(403, "Not authorized to delete orders");
  }
  
  const orderId = req.params.id;
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  res.status(200).json({ success: true, data: order });
});
