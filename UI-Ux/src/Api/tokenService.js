import api from "./axiosInstance.js";

/**
 * Token Service - Manages all token operations
 */

export const tokenService = {
  /**
   * Manually refresh the access token
   * @returns {Promise<{accessToken, refreshToken}>}
   */
  refreshToken: async () => {
    try {
      const response = await api.post("/users/refresh-token", {}, { withCredentials: true });
      const { accessToken, refreshToken } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      console.log('Token refreshed successfully');
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
      throw error;
    }
  },

  /**
   * Get the current access token from localStorage
   * @returns {string|null}
   */
  getAccessToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Get the current refresh token from localStorage
   * @returns {string|null}
   */
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Store tokens in localStorage
   * @param {string} accessToken
   * @param {string} refreshToken
   */
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  /**
   * Clear all tokens from localStorage
   */
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Check if token exists
   * @returns {boolean}
   */
  hasToken: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Decode JWT token to check expiration
   * @param {string} token
   * @returns {object|null}
   */
  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   * @returns {boolean}
   */
  isTokenExpired: () => {
    const token = tokenService.getAccessToken();
    if (!token) return true;

    const decoded = tokenService.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // Check if token expires within the next 5 minutes
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    return timeUntilExpiry < 5 * 60 * 1000; // 5 minutes in milliseconds
  }
};

export default tokenService;
