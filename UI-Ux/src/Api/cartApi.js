import axios from './axiosInstance';

export const addToCart = async (payload) => {
  const res = await axios.post('/cart/add', payload);
  return res.data;
};

export const removeFromCart = async (payload) => {
  const res = await axios.post('/cart/remove', payload);
  return res.data;
};

export const getCart = async () => {
  const res = await axios.get('/cart');
  return res.data;
};
