const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.0.107:3005';

// ─── In-memory access token (never persisted to localStorage) ────────────────
let memoryAccessToken = null;

// ─── Refresh queue to prevent race conditions ────────────────────────────────
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

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
async function customFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Always send cookies for HttpOnly refresh token support
  options.credentials = 'include';

  // Setup headers
  if (!(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  } else {
    options.headers = { ...options.headers };
  }

  // Attach in-memory access token if present
  if (memoryAccessToken) {
    options.headers['Authorization'] = `Bearer ${memoryAccessToken}`;
  }

  try {
    const response = await fetch(url, options);

    // Intercept 401 (Unauthorized) or 403 (Forbidden) — access token expired
    const isAuthError = response.status === 401 || response.status === 403;
    if (isAuthError && !options._retry && !endpoint.startsWith('/api/public')) {
      if (isRefreshing) {
        // Queue this request while the active refresh is in progress
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

      try {
        const newAccessToken = await _doRefresh();
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original failed request with the new token
        options.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return customFetch(endpoint, options);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogoutRedirect();
        throw refreshError;
      }
    }

    // Intercept 402 Payment Required — subscription expired
    if (response.status === 402) {
      let payload = {};
      try { payload = await response.json(); } catch (_) { }
      if (payload.code === 'SUBSCRIPTION_EXPIRED') {
        window.dispatchEvent(new CustomEvent('subscription-expired'));
      }
      const err = new Error(payload.message || 'Subscription expired.');
      err.status = 402;
      err.code = payload.code;
      throw err;
    }

    // Handle other error responses (status codes >= 400)
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

    // Return parsed JSON if present
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    throw error;
  }
}

// ─── Internal refresh logic (shared by interceptor and startup) ──────────────
async function _doRefresh() {
  // Try cookie-based refresh first (withCredentials: true via credentials: 'include').
  // Also send the fallback refresh token in the body for cross-domain / blocked-cookie scenarios.
  const fallbackRefreshToken = localStorage.getItem('fallback_refresh_token');

  const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: fallbackRefreshToken }),
  });

  if (!refreshRes.ok) {
    throw new Error('Refresh token invalid or expired');
  }

  const refreshData = await refreshRes.json();
  const dataObj = refreshData.data || refreshData;
  const { accessToken, refreshToken: newRefreshToken } = dataObj;

  // Store new access token in memory only
  memoryAccessToken = accessToken;

  // Rotate the fallback refresh token in localStorage (token rotation)
  if (newRefreshToken) {
    localStorage.setItem('fallback_refresh_token', newRefreshToken);
  }

  return accessToken;
}

// ─── Logout helper ───────────────────────────────────────────────────────────
function handleLogoutRedirect() {
  memoryAccessToken = null;
  localStorage.removeItem('fallback_refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-logout'));
}

// ─── Public API surface ──────────────────────────────────────────────────────
export const api = {
  get: (endpoint, options = {}) =>
    customFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    customFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: (endpoint, body, options = {}) =>
    customFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: (endpoint, options = {}) =>
    customFetch(endpoint, { ...options, method: 'DELETE' }),

  upload: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image', file);
    return customFetch('/api/upload', {
      ...options,
      method: 'POST',
      body: formData,
    });
  },

  /**
   * loginUser — stores access token in memory and fallback refresh token in
   * localStorage. Called from LoginPage after a successful /api/auth/login.
   */
  loginUser: (accessToken, refreshToken, user) => {
    memoryAccessToken = accessToken;
    if (refreshToken) {
      localStorage.setItem('fallback_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * logoutUser — invalidates the server-side session, clears all local state
   * and redirects to /login.
   */
  logoutUser: async () => {
    try {
      await customFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      handleLogoutRedirect();
      window.location.href = '/login';
    }
  },

  /**
   * checkSessionPersistence — called on app startup to silently restore a
   * session if a valid refresh token exists (either via HttpOnly cookie or
   * localStorage fallback). Returns true if session was restored.
   */
  checkSessionPersistence: async () => {
    const hasFallbackToken = !!localStorage.getItem('fallback_refresh_token');

    // No local indicator of a prior session — skip the network call
    if (!hasFallbackToken) {
      // Still attempt if the browser might have an HttpOnly cookie;
      // but guard with a simple flag to avoid an unnecessary 401 on first load.
      return false;
    }

    try {
      await _doRefresh();
      return true;
    } catch (err) {
      console.warn('No active persistent session found.');
      handleLogoutRedirect();
      return false;
    }
  },

  /** @deprecated Use checkSessionPersistence instead */
  refreshSession: async () => {
    return api.checkSessionPersistence();
  },

  /** Exposes the current in-memory access token (read-only). */
  get accessToken() {
    return memoryAccessToken;
  },
};

export default api;
