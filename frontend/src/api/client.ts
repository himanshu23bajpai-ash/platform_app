import axios from "axios";
import { acquireIdToken, ssoEnabled } from "@/auth/msal";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "/api",
  withCredentials: true,
});

if (ssoEnabled) {
  api.interceptors.request.use(async (config) => {
    const token = await acquireIdToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    },
  );
}
