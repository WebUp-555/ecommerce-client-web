import axios from './axiosInstance';

export const addToCart = async (productId, quantity = 1) => {
  const res = await axios.post('/cart/add', { productId, quantity });
  return res.data;
};

export const removeFromCart = async (productId) => {
  const res = await axios.post('/cart/remove', { productId });
  return res.data;
};

export const getCart = async () => {
  const res = await axios.get('/cart');
  return res.data;
};