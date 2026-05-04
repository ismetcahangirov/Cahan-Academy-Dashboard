import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const classworksApi = createApi({
  reducerPath: 'classworksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.user?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Classwork'],
  endpoints: (builder) => ({
    getClassworks: builder.query({
      query: (groupId) => {
        let url = '/classworks';
        if (groupId) {
          url += `?groupId=${groupId}`;
        }
        return url;
      },
      providesTags: ['Classwork'],
      transformResponse: (response) => response.data,
    }),
    getClassworkById: builder.query({
      query: (id) => `/classworks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Classwork', id }],
      transformResponse: (response) => response.data,
    }),
    createClasswork: builder.mutation({
      query: (data) => ({
        url: '/classworks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Classwork'],
    }),
    updateClasswork: builder.mutation({
      query: ({ id, data }) => ({
        url: `/classworks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Classwork', id },
        'Classwork',
      ],
    }),
    deleteClasswork: builder.mutation({
      query: (id) => ({
        url: `/classworks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Classwork'],
    }),
    submitClasswork: builder.mutation({
      query: ({ id, data }) => ({
        url: `/classworks/${id}/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Classwork', id },
        'Classwork',
      ],
    }),
    gradeClasswork: builder.mutation({
      query: ({ id, data }) => ({
        url: `/classworks/${id}/grade`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Classwork', id },
        'Classwork',
      ],
    }),
  }),
});

export const {
  useGetClassworksQuery,
  useGetClassworkByIdQuery,
  useCreateClassworkMutation,
  useUpdateClassworkMutation,
  useDeleteClassworkMutation,
  useSubmitClassworkMutation,
  useGradeClassworkMutation,
} = classworksApi;
