import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: createBaseQuery('/attendance'),
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    getAttendance: builder.query({
      query: ({ group, date }) => `?group=${group}&date=${date}`,
      providesTags: ['Attendance'],
    }),
    markAttendance: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getGroupStats: builder.query({
      query: (groupId) => `/stats/${groupId}`,
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useGetGroupStatsQuery,
} = attendanceApi;
