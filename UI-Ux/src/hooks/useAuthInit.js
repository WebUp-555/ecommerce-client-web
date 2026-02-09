import { useEffect, useState } from 'react';
import tokenService from '../Api/tokenService.js';

/**
 * useAuthInit Hook - Initialize authentication on app load
 * Refreshes token if it exists and is about to expire
 */
export const useAuthInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user has a token
        const hasToken = tokenService.hasToken();
        
        if (hasToken) {
          // Check if token is expired or about to expire
          if (tokenService.isTokenExpired()) {
            console.log('Token expired or expiring soon, refreshing...');
            try {
              await tokenService.refreshToken();
              console.log('Token refreshed successfully on app load');
            } catch (refreshError) {
              console.log('Failed to refresh token on app load:', refreshError);
              // Token refresh failed, user needs to login again
              setError('Session expired. Please login again.');
            }
          } else {
            console.log('Token is still valid');
          }
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message || 'Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return { isInitialized, isLoading, error };
};

export default useAuthInit;
