import { apiSlice } from '../../app/api/apiSlice';

export const paymentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: get payment info for a specific student
    getStudentPayments: builder.query({
      query: (studentId) => `/payments/student/${studentId}`,
      providesTags: (result, error, studentId) => [{ type: 'Payment', id: studentId }],
    }),

    // Admin: create a new payment plan
    createPaymentPlan: builder.mutation({
      query: (data) => ({
        url: '/payments/plan',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { studentId }) => [
        { type: 'Payment', id: studentId },
      ],
    }),

    // Admin: update existing payment plan
    updatePaymentPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/payments/plan/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Payment', id: arg.studentId },
      ],
    }),

    // Admin: delete payment plan
    deletePaymentPlan: builder.mutation({
      query: (id) => ({
        url: `/payments/plan/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment'],
    }),

    // Admin: approve a specific payment entry
    approvePayment: builder.mutation({
      query: ({ planId, historyId, ...data }) => ({
        url: `/payments/${planId}/approve/${historyId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Admin: undo approval
    unapprovePayment: builder.mutation({
      query: ({ planId, historyId }) => ({
        url: `/payments/${planId}/unapprove/${historyId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Payment'],
    }),

    // Student: get own payment info
    getMyPayments: builder.query({
      query: () => '/payments/my',
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetStudentPaymentsQuery,
  useCreatePaymentPlanMutation,
  useUpdatePaymentPlanMutation,
  useDeletePaymentPlanMutation,
  useApprovePaymentMutation,
  useUnapprovePaymentMutation,
  useGetMyPaymentsQuery,
} = paymentsApi;
