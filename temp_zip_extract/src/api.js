const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.104:3005';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function customFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Setup headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach memory access token if present
  if (window.__accessToken) {
    options.headers['Authorization'] = `Bearer ${window.__accessToken}`;
  }

  try {
    const response = await fetch(url, options);

    // Access token expired (403 Forbidden as per integration guide)
    if (response.status === 403 && !options._retry) {
      if (isRefreshing) {
        // Queue this request while refreshing token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            options.headers['Authorization'] = `Bearer ${token}`;
            options._retry = true;
            return customFetch(endpoint, options);
          })
          .catch((err) => Promise.reject(err));
      }

      options._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        handleLogoutRedirect();
        throw new Error('Session expired');
      }

      try {
        const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error('Invalid refresh token');
        }

        const refreshData = await refreshRes.json();
        const { accessToken, refreshToken: newRefreshToken } = refreshData.data;

        // Save tokens
        window.__accessToken = accessToken;
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);

        // Retry original request
        options.headers['Authorization'] = `Bearer ${accessToken}`;
        return customFetch(endpoint, options);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogoutRedirect();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // Handle error responses (status codes >= 400)
    if (!response.ok) {
      let errorMessage = `API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (_) { }

      const err = new Error(errorMessage);
      err.status = response.status;
      throw err;
    }

    // Return parsed json if exists
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    throw error;
  }
}

function handleLogoutRedirect() {
  window.__accessToken = null;
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-logout'));
}

export const api = {
  get: (endpoint, options = {}) => customFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => customFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  }),
  put: (endpoint, body, options = {}) => customFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  delete: (endpoint, options = {}) => customFetch(endpoint, { ...options, method: 'DELETE' }),

  // Explicit refresh session call
  refreshSession: async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return null;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      if (!res.ok) throw new Error();
      const refreshData = await res.json();
      const { accessToken, refreshToken: newRefreshToken } = refreshData.data;
      window.__accessToken = accessToken;
      localStorage.setItem('refreshToken', newRefreshToken);
      return refreshData;
    } catch (e) {
      handleLogoutRedirect();
      return null;
    }
  }
};

export default api;
