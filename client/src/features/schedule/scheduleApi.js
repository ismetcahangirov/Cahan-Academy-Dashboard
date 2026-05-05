import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: createBaseQuery(),
  tagTypes: ['Schedule'],
  endpoints: (builder) => ({
    getSchedule: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.groupId) searchParams.set('groupId', params.groupId);
        if (params.teacherId) searchParams.set('teacherId', params.teacherId);
        if (params.dayOfWeek !== undefined) searchParams.set('dayOfWeek', params.dayOfWeek);
        const queryStr = searchParams.toString();
        return `/schedule${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),
    getScheduleById: builder.query({
      query: (id) => `/schedule/${id}`,
      providesTags: (result, error, id) => [{ type: 'Schedule', id }],
      transformResponse: (response) => response.data,
    }),
    createScheduleEntry: builder.mutation({
      query: (data) => ({
        url: '/schedule',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Schedule'],
    }),
    updateScheduleEntry: builder.mutation({
      query: ({ id, data }) => ({
        url: `/schedule/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Schedule', id }, 'Schedule'],
    }),
    deleteScheduleEntry: builder.mutation({
      query: (id) => ({
        url: `/schedule/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Schedule'],
    }),
  }),
});

export const {
  useGetScheduleQuery,
  useGetScheduleByIdQuery,
  useCreateScheduleEntryMutation,
  useUpdateScheduleEntryMutation,
  useDeleteScheduleEntryMutation,
} = scheduleApi;
