import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const quizzesApi = createApi({
  reducerPath: 'quizzesApi',
  baseQuery: createBaseQuery(),
  tagTypes: ['Quiz'],
  endpoints: (builder) => ({
    getQuizzes: builder.query({
      query: (groupId) => {
        let url = '/quizzes';
        if (groupId) {
          url += `?groupId=${groupId}`;
        }
        return url;
      },
      providesTags: ['Quiz'],
      transformResponse: (response) => response.data,
    }),
    getQuizById: builder.query({
      query: (id) => `/quizzes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quiz', id }],
      transformResponse: (response) => response.data,
    }),
    createQuiz: builder.mutation({
      query: (data) => ({
        url: '/quizzes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quiz'],
    }),
    updateQuiz: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quizzes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quiz', id },
        'Quiz',
      ],
    }),
    submitQuiz: builder.mutation({
      query: ({ id, data }) => ({
        url: `/quizzes/${id}/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Quiz', id },
        'Quiz',
      ],
    }),
    deleteQuiz: builder.mutation({
      query: (id) => ({
        url: `/quizzes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quiz'],
    }),
  }),
});

export const {
  useGetQuizzesQuery,
  useGetQuizByIdQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useSubmitQuizMutation,
  useDeleteQuizMutation,
} = quizzesApi;
