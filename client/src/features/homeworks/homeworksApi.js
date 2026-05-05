import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const homeworksApi = createApi({
  reducerPath: 'homeworksApi',
  baseQuery: createBaseQuery(),
  tagTypes: ['Homework'],
  endpoints: (builder) => ({
    getHomeworks: builder.query({
      query: (groupId) => {
        let url = '/homeworks';
        if (groupId) {
          url += `?groupId=${groupId}`;
        }
        return url;
      },
      providesTags: ['Homework'],
      transformResponse: (response) => response.data,
    }),
    getHomeworkById: builder.query({
      query: (id) => `/homeworks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Homework', id }],
      transformResponse: (response) => response.data,
    }),
    createHomework: builder.mutation({
      query: (data) => ({
        url: '/homeworks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Homework'],
    }),
    updateHomework: builder.mutation({
      query: ({ id, data }) => ({
        url: `/homeworks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Homework', id },
        'Homework',
      ],
    }),
    deleteHomework: builder.mutation({
      query: (id) => ({
        url: `/homeworks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Homework'],
    }),
    submitHomework: builder.mutation({
      query: ({ id, data }) => ({
        url: `/homeworks/${id}/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Homework', id },
        'Homework',
      ],
    }),
    gradeHomework: builder.mutation({
      query: ({ id, data }) => ({
        url: `/homeworks/${id}/grade`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Homework', id },
        'Homework',
      ],
    }),
  }),
});

export const {
  useGetHomeworksQuery,
  useGetHomeworkByIdQuery,
  useCreateHomeworkMutation,
  useUpdateHomeworkMutation,
  useDeleteHomeworkMutation,
  useSubmitHomeworkMutation,
  useGradeHomeworkMutation,
} = homeworksApi;
