import api from "./axiosInstance.js";
import tokenService from "./tokenService.js";

export const registerUser = async (userData) => {
  try {
    const res = await api.post("/users/register", userData); // removed /v1
    return res.data;
  } catch (error) {
    console.log('Register Error Full:', error);
    console.log('Register Error Response:', error.response);
    console.log('Register Error Data:', error.response?.data);
    throw error;
  }
};

export const loginUser = async (emailOrUsername, password) => {
  try {
    const isEmail = /\S+@\S+\.\S+/.test(emailOrUsername);
    const payload = isEmail
      ? { email: emailOrUsername, password }
      : { username: emailOrUsername, password };

    const response = await api.post("/users/login", payload, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.log('Login Error Full:', error);
    console.log('Login Error Response:', error.response);
    console.log('Login Error Data:', error.response?.data);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const res = await api.post("/users/logout", {}, { withCredentials: true }); // removed /v1
    return res.data;
  } catch (error) {
    console.log('Logout Error:', error.response?.data);
    throw error;
  }
};

export const refreshAccessToken = async () => {
  try {
    const res = await api.post("/users/refresh-token", {}, { withCredentials: true });
    return res.data;
  } catch (error) {
    console.log('Refresh Token Error:', error.response?.data);
    throw error;
  }
};

export const verifyEmailCode = async (email, code) => {
  const res = await api.post("/users/verify-email", { email, code });
  return res.data;
};

export const resendSignupCode = async (email) => {
  const res = await api.post("/users/register/resend-code", { email });
  return res.data;
};

export const sendForgotCode = async (email) => {
  const res = await api.post("/users/forgot-password", { email });
  return res.data;
};

export const resetPasswordWithCode = async (email, code, newPassword) => {
  const res = await api.post("/users/reset-password", { email, code, newPassword });
  return res.data;
};
