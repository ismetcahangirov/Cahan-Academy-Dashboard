import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const groupsApi = createApi({
  reducerPath: 'groupsApi',
  baseQuery: createBaseQuery('/groups'),
  tagTypes: ['Group'],
  endpoints: (builder) => ({
    getGroups: builder.query({
      query: () => '/',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Group', id: _id })),
              { type: 'Group', id: 'LIST' },
            ]
          : [{ type: 'Group', id: 'LIST' }],
    }),
    getGroupById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
    createGroup: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
    updateGroup: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Group', id },
        { type: 'Group', id: 'LIST' },
      ],
    }),
    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
    addStudentToGroup: builder.mutation({
      query: ({ groupId, studentId }) => ({
        url: `/${groupId}/students`,
        method: 'POST',
        body: { studentId },
      }),
      invalidatesTags: (result, error, { groupId }) => [{ type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddStudentToGroupMutation,
} = groupsApi;
