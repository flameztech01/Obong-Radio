// src/features/radioApiSlice.js
import { apiSlice } from "./apiSlice.js";

const RADIO_URL = "/radio";

export const radioApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // ADMIN ACTIONS
    // ==========================================
    startLiveSession: builder.mutation({
      query: (formData) => ({
        url: `${RADIO_URL}/start-session`,
        method: "POST",
        body: formData, 
      }),
      invalidatesTags: ["RadioSession"],
    }),
    endLiveSession: builder.mutation({
      query: (sessionId) => ({
        url: `${RADIO_URL}/end-session`,
        method: "POST",
        body: { sessionId },
      }),
      invalidatesTags: ["RadioSession", "PastSessions"],
    }),
    generateGuestLink: builder.mutation({
      query: () => ({
        url: `${RADIO_URL}/guest-link`,
        method: "POST",
      }),
    }),
    toggleMusicMode: builder.mutation({
      query: (data) => ({ 
        url: `${RADIO_URL}/music/toggle`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MusicQueue"],
    }),

    // ==========================================
    // PUBLIC / LISTENER ACTIONS
    // ==========================================
    getListenerToken: builder.query({
      query: () => ({
        url: `${RADIO_URL}/listener-token`,
        method: "GET",
      }),
      keepUnusedDataFor: 0, 
    }),
    getMusicQueue: builder.query({
      query: () => ({
        url: `${RADIO_URL}/music/queue`,
        method: "GET",
      }),
      providesTags: ["MusicQueue"],
    }),

    // ==========================================
    // HISTORICAL SESSIONS
    // ==========================================
    getPastSessions: builder.query({
      query: () => ({
        url: `${RADIO_URL}/sessions`, 
        method: "GET",
      }),
      providesTags: ["PastSessions"],
    }),
  }),
});

export const {
  useStartLiveSessionMutation,
  useEndLiveSessionMutation,
  useGenerateGuestLinkMutation,
  useToggleMusicModeMutation,
  useGetListenerTokenQuery,
  useGetMusicQueueQuery,
  useGetPastSessionsQuery,
} = radioApiSlice;