import { apiSlice } from '../../app/api/apiSlice';

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendance: builder.query({
      query: ({ group, date }) => `/attendance?group=${group}&date=${date}`,
      providesTags: ['Attendance'],
    }),
    markAttendance: builder.mutation({
      query: (data) => ({
        url: '/attendance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getGroupStats: builder.query({
      query: (groupId) => `/attendance/stats/${groupId}`,
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useGetGroupStatsQuery,
} = attendanceApi;
