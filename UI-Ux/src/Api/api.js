import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Create axios instance with base URL and request interceptor
 * Automatically attaches JWT token from localStorage to all requests
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Initiate payment by creating Razorpay order
 * POST /api/v1/orders/paynow
 * Returns: { orderId, razorpayOrderId, amount, currency, key }
 */
export const payNow = async (shippingAddress) => {
  try {
    const response = await api.post('/orders/paynow', { shippingAddress });
    return response.data?.data ?? response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to initiate payment');
  }
};

/**
 * Verify payment after successful Razorpay transaction
 * POST /api/v1/orders/verify
 * Payload: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyPayment = async (payload) => {
  try {
    const response = await api.post('/orders/verify', payload);
    return response.data?.data ?? response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
};

/**
 * Get all orders for logged-in user with pagination and filters
 * GET /api/v1/orders/my
 * Params: { page, limit, status }
 */
export const getMyOrders = async (params) => {
  try {
    const response = await api.get('/orders/my', { params });
    return response.data?.data ?? response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch orders');
  }
};

/**
 * Get single order (customer view)
 * GET /api/v1/orders/my/:id
 */
export const getMyOrderById = async (id) => {
  try {
    const response = await api.get(`/orders/my/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch order');
  }
};

/**
 * Get single order (admin)
 * GET /api/v1/orders/:id
 */
export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch order');
  }
};

export default api;
