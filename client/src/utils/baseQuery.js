import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * The backend API base URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://server-eosin-zeta.vercel.app/api');

/**
 * Creates a pre-configured fetchBaseQuery.
 * Note: Newer code should use apiSlice.injectEndpoints instead of createApi directly.
 * 
 * @param {string} [pathSuffix=''] - Optional path appended to the base URL
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
