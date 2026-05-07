import { apiSlice } from '../../app/api/apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getActivities: builder.query({
      query: () => '/dashboard/activities',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetStatsQuery, useGetActivitiesQuery } = dashboardApi;
