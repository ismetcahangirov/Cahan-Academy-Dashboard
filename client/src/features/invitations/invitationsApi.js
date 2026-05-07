import { apiSlice } from '../../app/api/apiSlice';

export const invitationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvitations: builder.query({
      query: () => '/invitations',
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
        url: '/invitations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Invitation', id: 'LIST' }],
    }),
    deleteInvitation: builder.mutation({
      query: (id) => ({
        url: `/invitations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Invitation', id: 'LIST' }],
    }),
    verifyInvitation: builder.query({
      query: (token) => `/invitations/verify/${token}`,
    }),
  }),
});

export const {
  useGetInvitationsQuery,
  useSendInvitationMutation,
  useDeleteInvitationMutation,
  useLazyVerifyInvitationQuery,
} = invitationsApi;
