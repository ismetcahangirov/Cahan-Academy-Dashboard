import { apiSlice } from '../../app/api/apiSlice';

export const classworksApi = apiSlice.injectEndpoints({
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
