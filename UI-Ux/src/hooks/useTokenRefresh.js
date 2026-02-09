import { useState } from 'react';
import tokenService from '../Api/tokenService.js';

/**
 * useTokenRefresh Hook - Manually refresh access token
 * Useful for components that need to refresh token on demand
 */
export const useTokenRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const refresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      setSuccess(false);

      const result = await tokenService.refreshToken();
      
      setSuccess(true);
      console.log('Token refreshed successfully');
      
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to refresh token';
      setError(errorMessage);
      console.error('Token refresh failed:', errorMessage);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    refresh,
    isRefreshing,
    error,
    success,
    clearError,
    clearSuccess
  };
};

export default useTokenRefresh;
