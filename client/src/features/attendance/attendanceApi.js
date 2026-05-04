import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || ''}/attendance`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.user?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
