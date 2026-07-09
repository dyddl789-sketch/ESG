import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

const isAuthEndpoint = (url = "") =>
  [
    "/auth/login",
    "/auth/signup",
    "/auth/refresh",
    "/auth/oauth/exchange",
    "/auth/check-login-id",
    "/auth/check-email",
    "/auth/check-phone",
    "/auth/email-verifications/send",
    "/auth/email-verifications/confirm",
  ].some((path) =>
    url.includes(path),
  );

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const unauthorized = error.response?.status === 401;

    if (!unauthorized || !originalRequest || originalRequest.__retried || isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest.__retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh")
          .then((response) => {
            const session = response.data?.data;
            tokenStorage.setAccessToken(session?.accessToken);
            window.dispatchEvent(new CustomEvent("auth:token-refreshed", { detail: session }));
            return session?.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) throw new Error("Access token refresh failed");

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStorage.clear();
      window.dispatchEvent(new Event("auth:expired"));
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
