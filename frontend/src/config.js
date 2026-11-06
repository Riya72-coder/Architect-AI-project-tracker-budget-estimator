/**
 * Centralised API configuration.
 *
 * Set VITE_API_BASE_URL and VITE_CHATBOT_API_URL in your .env file.
 * The values below are used automatically when those variables are not defined
 * (local-dev fallback only — never use these in production).
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const CHATBOT_API_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://127.0.0.1:8000";
