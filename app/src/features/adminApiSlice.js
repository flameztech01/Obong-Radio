// src/features/adminApiSlice.js
import { apiSlice } from "./apiSlice.js";

const ADMIN_URL = "/admin";

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ============================================================
       USERS & ROLES
       ============================================================ */
    getAllUsers: builder.query({
      query: ({ search = "", role = "", page = 1, limit = 20 } = {}) => {
        const q = new URLSearchParams();
        if (search) q.set("search", search);
        if (role) q.set("role", role);
        q.set("page", page);
        q.set("limit", limit);
        return { url: `${ADMIN_URL}/users?${q.toString()}`, method: "GET" };
      },
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map((u) => ({ type: "AdminUser", id: u._id })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),

    getUserById: builder.query({
      query: (id) => ({ url: `${ADMIN_URL}/users/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "AdminUser", id }],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, role, extraRoles }) => ({
        url: `${ADMIN_URL}/users/${id}/role`,
        method: "PATCH",
        body: { role, ...(extraRoles !== undefined ? { extraRoles } : {}) },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
        "User", // also refresh the current user's "me" cache if they edited themselves
      ],
    }),

    toggleUserActive: builder.mutation({
      query: (id) => ({
        url: `${ADMIN_URL}/users/${id}/active`,
        method: "PATCH",
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({ url: `${ADMIN_URL}/users/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),

    /* ============================================================
       SCHEDULE (Scheduler)
       ============================================================ */
    getAdminSchedule: builder.query({
      query: () => ({ url: `${ADMIN_URL}/schedule`, method: "GET" }),
      providesTags: ["AdminSchedule"],
    }),

    createScheduleItem: builder.mutation({
      query: (body) => ({
        url: `${ADMIN_URL}/schedule`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminSchedule", "Schedule"], // also refresh public schedule
    }),

    updateScheduleItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${ADMIN_URL}/schedule/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminSchedule", "Schedule"],
    }),

    deleteScheduleItem: builder.mutation({
      query: (id) => ({
        url: `${ADMIN_URL}/schedule/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminSchedule", "Schedule"],
    }),
  }),
});

export const {
  // Users & Roles
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useDeleteUserMutation,

  // Schedule
  useGetAdminScheduleQuery,
  useCreateScheduleItemMutation,
  useUpdateScheduleItemMutation,
  useDeleteScheduleItemMutation,
} = adminApiSlice;