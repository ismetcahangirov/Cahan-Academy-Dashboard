import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '../../utils/baseQuery';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: createBaseQuery('/dashboard'),
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getStats: builder.query({
      query: () => '/stats',
      providesTags: ['Dashboard'],
    }),
    getActivities: builder.query({
      query: () => '/activities',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetStatsQuery, useGetActivitiesQuery } = dashboardApi;
