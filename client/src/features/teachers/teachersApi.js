import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const teachersApi = createApi({
  reducerPath: 'teachersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || ''}/teachers`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.user?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Teacher'],
  endpoints: (builder) => ({
    getTeachers: builder.query({
      query: (params) => ({
        url: '/',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Teacher', id: _id })),
              { type: 'Teacher', id: 'LIST' },
            ]
          : [{ type: 'Teacher', id: 'LIST' }],
    }),
    getTeacherById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Teacher', id }],
    }),
    inviteTeacher: builder.mutation({
      query: (data) => ({
        url: '/invite',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Teacher', id: 'LIST' }],
    }),
    updateTeacher: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teacher', id },
        { type: 'Teacher', id: 'LIST' },
      ],
    }),
    deleteTeacher: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Teacher', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useInviteTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = teachersApi;
