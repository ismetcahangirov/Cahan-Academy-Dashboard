import { apiSlice } from '../../app/api/apiSlice';

export const profileApi = apiSlice.injectEndpoints(({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['Profile'],
      // Backend returns { success, data: user } — keep the full shape
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
      // Backend returns { success, data: user } — keep the full shape
    }),
    updatePassword: builder.mutation({
      query: (data) => ({
        url: '/users/profile/password',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
}));

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
} = profileApi;
