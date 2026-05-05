import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || ''}/dashboard`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
