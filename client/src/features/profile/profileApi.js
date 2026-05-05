import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: createBaseQuery(),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['Profile'],
      transformResponse: (response) => response.data,
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
      transformResponse: (response) => response.data,
    }),
    updatePassword: builder.mutation({
      query: (data) => ({
        url: '/users/profile/password',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
} = profileApi;
