/**
 * @file api.js
 * @description Configures the shared Axios HTTP client for communicating with the backend API.
 * Attaches authentication Bearer headers from Supabase user sessions automatically.
 */

import axios from "axios";
import { getSession } from "@/services/authService";
import { logger } from "@/utils/logger";

const log = logger.child("api");

// Backend target base URL configured via environment variables
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Shared Axios Instance
 */
export const api = axios.create({
  baseURL,
  timeout: 30000, // Terminate requests exceeding 30 seconds
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor: Automatically fetches and appends JWT Authorization header
api.interceptors.request.use(async (config) => {
  let token = null;

  try {
    const session = await getSession();
    token = session?.access_token;
  } catch (e) {
    log.error("Failed to get session token for API request:", e);
  }

  // Inject Bearer token into configuration headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  log.debug(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response Interceptor: Standardizes error extraction and structured logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    log.error(`Request failed (${status ?? "network"}):`, message);
    return Promise.reject(error);
  },
);

export default api;

