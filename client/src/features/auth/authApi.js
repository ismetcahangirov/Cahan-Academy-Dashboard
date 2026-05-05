import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: createBaseQuery(),
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
