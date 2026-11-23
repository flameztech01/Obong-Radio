// src/features/authApiSlice.js
import { apiSlice } from "./apiSlice.js";

const AUTH_URL = "/auth";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Public ----
    signup: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/signup`,
        method: "POST",
        body: data,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/verify-otp`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"], 
    }),
    resendOtp: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/resend-otp`,
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/login`,
        method: "POST",
        body: data,
      }),
    }),
    getPublicDepartments: builder.query({
      query: () => ({
        url: `${AUTH_URL}/departments`,
        method: "GET",
      }),
      providesTags: ["Department"],
    }),

    // ---- Protected ----
    getMe: builder.query({
      query: () => ({
        url: `${AUTH_URL}/me`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    updateProfilePicture: builder.mutation({
      query: (formData) => ({
        url: `${AUTH_URL}/profile-picture`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteProfilePicture: builder.mutation({
      query: () => ({
        url: `${AUTH_URL}/profile-picture`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: `${AUTH_URL}/account`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginMutation,
  useGetPublicDepartmentsQuery,
  useGetMeQuery,
  useLogoutMutation,
  useUpdateProfilePictureMutation,
  useDeleteProfilePictureMutation,
  useDeleteAccountMutation,
} = authApiSlice;