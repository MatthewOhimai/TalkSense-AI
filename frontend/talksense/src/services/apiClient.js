import axios from "axios";

const AUTH_STORAGE_KEY = "talksense_auth";
const SESSION_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

let memoryAccessToken = null;

const getStoredAuth = () => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    const loginAt = auth?.loginAt;

    // Drop sessions older than the max allowed window
    if (!loginAt || Date.now() - loginAt > SESSION_MAX_AGE_MS) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    // If we have an access token in the raw JSON (legacy), move it to memory
    // and cleanup persistence if this is the first run
    if (auth?.tokens?.access && !memoryAccessToken) {
      memoryAccessToken = auth.tokens.access;
    }

    return auth;
  } catch (e) {
    console.error("Failed to read stored auth:", e);
    return null;
  }
};

const persistTokens = (updater) => {
  try {
    if (typeof window === "undefined") return;
    const current = getStoredAuth();
    const next = typeof updater === "function" ? updater(current) : updater;

    if (!next) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      memoryAccessToken = null;
    } else {
      const loginAt = next.loginAt ?? current?.loginAt ?? Date.now();
      // Extract access token for memory storage
      if (next.tokens?.access) {
        memoryAccessToken = next.tokens.access;
      }

      // Clone and strip access token from persistence
      const toPersist = {
        ...next,
        loginAt,
        tokens: {
          ...next.tokens,
          access: null, // Never store access token in localStorage
        },
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(toPersist));
    }
  } catch (e) {
    console.error("Failed to persist updated tokens:", e);
  }
};

const clearAuthAndRedirect = (shouldRedirect = true) => {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      memoryAccessToken = null;
      if (shouldRedirect) {
        window.location.href = "/login";
      }
    }
  } catch (e) {
    console.error("Failed to clear auth:", e);
    if (typeof window !== "undefined") {
      memoryAccessToken = null;
      if (shouldRedirect) {
        window.location.href = "/login";
      }
    }
  }
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Attach access token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    // Priority: Memory Token > Stored Token (legacy)
    const accessToken = memoryAccessToken || getStoredAuth()?.tokens?.access;

    // If sending FormData, let Axios set the correct multipart boundary
    if (config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    if (accessToken) {
      config.headers = config.headers || {};
      if (typeof config.headers.set === "function") {
        // Axios v1 Headers-like object
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      } else {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401s by attempting a token refresh before forcing logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config || {};
    const url = originalRequest.url || "";

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Let auth verification endpoints handle their own 401s
    if (
      url.includes("/auth/magic-link/verify/") ||
      url.includes("/auth/magic-link/request/") ||
      url.includes("/auth/google/") ||
      url.includes("/auth/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    const auth = getStoredAuth();
    const refreshToken = auth?.tokens?.refresh;

    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;

      const refreshResponse = await axios.post(
        `${apiClient.defaults.baseURL}/auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newAccess = refreshResponse?.data?.access;
      const newRefresh = refreshResponse?.data?.refresh || refreshToken;

      if (!newAccess) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // Update stored tokens while keeping user data and timestamp
      persistTokens((current) => {
        if (!current) return current;
        return {
          ...current,
          tokens: {
            ...(current.tokens || {}),
            access: newAccess,
            refresh: newRefresh,
          },
        };
      });

      // Retry original request with new access token
      const headers = originalRequest.headers || {};
      if (typeof headers.set === "function") {
        headers.set("Authorization", `Bearer ${newAccess}`);
      } else {
        headers["Authorization"] = `Bearer ${newAccess}`;
      }
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export const authAPI = {
  // Use form-encoded for signup to avoid browser preflight OPTIONS (simple request)
  signup: (data) => {
    const params = new URLSearchParams();
    Object.keys(data || {}).forEach((k) => params.append(k, data[k]));
    return apiClient.post("/auth/signup", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  verifyEmail: (data) => apiClient.post("/auth/verify-email", data),
  login: (data) => apiClient.post("/auth/login", data),
  logout: (data) => apiClient.post("/auth/logout", data),
  // Resend OTP as form-encoded to avoid preflight
  resendOTP: (data) => {
    const params = new URLSearchParams();
    Object.keys(data || {}).forEach((k) => params.append(k, data[k]));
    return apiClient.post("/auth/resend-otp", params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  requestPasswordReset: (data) =>
    apiClient.post("/auth/password-reset/request", data),
  confirmPasswordReset: (data) =>
    apiClient.post("/auth/password-reset/confirm", data),
  changePassword: (data) => apiClient.post("/auth/change-password", data),
  googleLogin: (data) => apiClient.post("/auth/google/login", data),
  refreshToken: (data) => apiClient.post("/auth/token/refresh/", data),
};

export const userAPI = {
  getProfile: () => apiClient.get("/profile"),
  updateProfile: (data) => apiClient.put("/profile", data),
};

export const getAccessToken = () =>
  memoryAccessToken || getStoredAuth()?.tokens?.access;

export {
  getStoredAuth,
  persistTokens,
  clearAuthAndRedirect,
  SESSION_MAX_AGE_MS,
};
export default apiClient;
