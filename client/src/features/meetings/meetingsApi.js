import { apiSlice } from '../../app/api/apiSlice';

export const meetingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    joinOrCreateMeeting: builder.mutation({
      query: ({ scheduleId, date }) => ({
        url: `/meetings/join-or-create/${scheduleId}`,
        method: 'POST',
        body: date ? { date } : {},
      }),
      transformResponse: (response) => response.data,
    }),
    startMeeting: builder.mutation({
      query: (meetingId) => ({
        url: `/meetings/${meetingId}/start`,
        method: 'POST',
      }),
    }),
    leaveMeeting: builder.mutation({
      query: (meetingId) => ({
        url: `/meetings/${meetingId}/leave`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useJoinOrCreateMeetingMutation,
  useStartMeetingMutation,
  useLeaveMeetingMutation,
} = meetingsApi;
