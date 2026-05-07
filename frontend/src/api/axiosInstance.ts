import axios from 'axios';
import useAuthStore from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. Request Interceptor
 * Before every request, if there is an accessToken in the Zustand store, it is sent in the header.
 */
apiClient.interceptors.request.use(
  (config) => {
    // .getState() allows you to retrieve the value regardless of React hook rules.
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 2. Response Interceptor
 * If a 401 (Unauthorized) error is received from the server, a token renewal is attempted.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If a 401 error occurred and the request has not already been retried (prevent infinite loop)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh API using a separate axios instance (or default axios)
        // If you use apiClient as is, you may fall into an infinite loop if 401 is returned here.
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { withCredentials: true },
        );

        const { accessToken } = response.data;

        // 1. Save new tokens to the store
        useAuthStore.getState().setAccessToken(accessToken);

        // 2. Replace the header of the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // 3. Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Even the refresh token has expired (session expiration)
        console.error('Session expired. Please log in again.');
        useAuthStore.getState().logout(); // Reset the store and go to the login page
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
