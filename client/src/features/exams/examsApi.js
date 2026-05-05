import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const examsApi = createApi({
  reducerPath: 'examsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Exam'],
  endpoints: (builder) => ({
    getExams: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.groupId) searchParams.set('groupId', params.groupId);
        if (params.teacherId) searchParams.set('teacherId', params.teacherId);
        const queryStr = searchParams.toString();
        return `/exams${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: ['Exam'],
      transformResponse: (response) => response.data,
    }),
    getExamById: builder.query({
      query: (id) => `/exams/${id}`,
      providesTags: (result, error, id) => [{ type: 'Exam', id }],
      transformResponse: (response) => response.data,
    }),
    createExam: builder.mutation({
      query: (data) => ({
        url: '/exams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exam'],
    }),
    updateExam: builder.mutation({
      query: ({ id, data }) => ({
        url: `/exams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Exam', id }, 'Exam'],
    }),
    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),
    addExamResults: builder.mutation({
      query: ({ id, data }) => ({
        url: `/exams/${id}/results`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Exam', id }, 'Exam'],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useGetExamByIdQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useAddExamResultsMutation,
} = examsApi;
