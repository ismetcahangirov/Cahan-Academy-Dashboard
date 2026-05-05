import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * The backend API base URL.
 *
 * Priority:
 *  1. VITE_API_URL env var  (set this in Vercel → client project → Environment Variables)
 *  2. localhost:5000/api    (local development fallback)
 *  3. Deployed backend URL  (hardcoded safety net so production never sends requests to itself)
 *
 * To configure for production, add this env var in your CLIENT Vercel project:
 *   VITE_API_URL = https://server-eosin-zeta.vercel.app/api
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://server-eosin-zeta.vercel.app/api');

/**
 * Creates a pre-configured fetchBaseQuery with:
 *  - Correct backend base URL (with optional path suffix, e.g. '/teachers')
 *  - Authorization Bearer token injected from Redux auth.token state
 *
 * @param {string} [pathSuffix=''] - Optional path appended to the base URL
 * @example
 *   baseQuery: createBaseQuery('/teachers')
 *   // → baseUrl: 'https://server-eosin-zeta.vercel.app/api/teachers'
 */
export const createBaseQuery = (pathSuffix = '') =>
  fetchBaseQuery({
    baseUrl: `${API_BASE_URL}${pathSuffix}`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  });
