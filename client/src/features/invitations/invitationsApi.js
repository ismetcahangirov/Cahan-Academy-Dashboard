import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const invitationsApi = createApi({
  reducerPath: 'invitationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || ''}/invitations`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Invitation'],
  endpoints: (builder) => ({
    getInvitations: builder.query({
      query: () => '/',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Invitation', id: _id })),
              { type: 'Invitation', id: 'LIST' },
            ]
          : [{ type: 'Invitation', id: 'LIST' }],
    }),
    sendInvitation: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Invitation', id: 'LIST' }],
    }),
    deleteInvitation: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Invitation', id: 'LIST' }],
    }),
    verifyInvitation: builder.query({
      query: (token) => `/verify/${token}`,
    }),
  }),
});

export const {
  useGetInvitationsQuery,
  useSendInvitationMutation,
  useDeleteInvitationMutation,
  useLazyVerifyInvitationQuery,
} = invitationsApi;
