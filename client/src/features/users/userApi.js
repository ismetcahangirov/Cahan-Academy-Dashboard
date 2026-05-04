import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/users',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/',
        params: {
          pageNumber: params?.page || 1,
          keyword: params?.keyword || '',
          pageSize: params?.pageSize || 10,
        },
      }),
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ['User'],
    }),
    addUser: builder.mutation({
      query: (user) => ({
        url: '/',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...user }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
