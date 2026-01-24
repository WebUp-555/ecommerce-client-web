import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============ AUTH APIs ============
export const adminLogin = async (credentials) => {
  const response = await api.post('/admin/login', credentials);
  return response.data;
};

export const adminLogout = async () => {
  const response = await api.post('/admin/logout');
  return response.data;
};

// ============ PRODUCT APIs ============
export const getAllProducts = async () => {
  const response = await api.get('/admin/products');
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/admin/products/${id}`);
  return response.data;
};

export const addProduct = async (formData) => {
  const response = await api.post('/admin/addproduct', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProduct = async (id, formData) => {
  const response = await api.put(`/admin/updateproduct/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/admin/deleteproduct/${id}`);
  return response.data;
};

// ============ CATEGORY APIs ============
export const getAllCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
};

export const addCategory = async (categoryData) => {
  const response = await api.post('/admin/addcategory', categoryData);
  return response.data;
};

// ============ USER APIs ============
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// ============ ORDER APIs ============
export const getAllOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}`, { status });
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};

// ============ BANNER APIs ============
export const getAllBanners = async () => {
  const response = await api.get('/admin/banners');
  return response.data;
};

export const addBanner = async (formData) => {
  const response = await api.post('/admin/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateBanner = async (id, formData) => {
  const response = await api.put(`/admin/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteBanner = async (id) => {
  const response = await api.delete(`/admin/banners/${id}`);
  return response.data;
};

export default api;
