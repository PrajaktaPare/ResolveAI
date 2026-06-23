import axios from "axios";
import { supabase } from "./supabase";
import { logger } from "@/utils/logger";

const log = logger.child("api");

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Pre-configured Axios instance for the ResolveAI backend.
 * Automatically attaches the Supabase access token to each request.
 */
export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  let token = null;
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  } else {
    const stored = localStorage.getItem("resolve_ai_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        token = session?.access_token;
      } catch (e) {}
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  log.debug(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

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
