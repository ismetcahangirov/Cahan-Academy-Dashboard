import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'http://localhost:5000/api'
      : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
    prepareHeaders: (headers, { getState }) => {
      const user = getState().auth.user;
      if (user && user.token) {
        headers.set('authorization', `Bearer ${user.token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    refreshToken: builder.mutation({
      query: (data) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation({
      query: (credentials) => ({
        url: '/auth/google',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation, 
  useRefreshTokenMutation,
  useGoogleLoginMutation 
} = authApi;
