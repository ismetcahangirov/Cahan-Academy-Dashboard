import { apiSlice } from '../../app/api/apiSlice';

export const coursesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query({
      query: () => '/courses',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Course', id: _id })),
              { type: 'Course', id: 'LIST' },
            ]
          : [{ type: 'Course', id: 'LIST' }],
    }),
    getCourseById: builder.query({
      query: (id) => `/courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    createCourse: builder.mutation({
      query: (data) => ({
        url: '/courses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),
    addLesson: builder.mutation({
      query: ({ courseId, ...lessonData }) => ({
        url: `/courses/${courseId}/lessons`,
        method: 'POST',
        body: lessonData,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: 'Course', id: courseId },
      ],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useAddLessonMutation,
} = coursesApi;
