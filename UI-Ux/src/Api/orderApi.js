import api from "./axiosInstance.js";

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const res = await api.post("/orders", orderData);
    return res.data;
  } catch (error) {
    console.log("Create Order Error:", error.response?.data);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  } catch (error) {
    console.log("Get Order Error:", error.response?.data);
    throw error;
  }
};

// Get all orders of the logged-in user
export const getMyOrders = async () => {
  try {
    const res = await api.get("/orders/user");
    return res.data;
  } catch (error) {
    console.log("Get My Orders Error:", error.response?.data);
    throw error;
  }
};

// Get all orders (admin only)
export const getAllOrders = async () => {
  try {
    const res = await api.get("/orders");
    return res.data;
  } catch (error) {
    console.log("Get All Orders Error:", error.response?.data);
    throw error;
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await api.patch(`/orders/${orderId}/status`, { status });
    return res.data;
  } catch (error) {
    console.log("Update Order Status Error:", error.response?.data);
    throw error;
  }
};

// Delete order (admin only)
export const deleteOrder = async (orderId) => {
  try {
    const res = await api.delete(`/orders/${orderId}`);
    return res.data;
  } catch (error) {
    console.log("Delete Order Error:", error.response?.data);
    throw error;
  }
};
