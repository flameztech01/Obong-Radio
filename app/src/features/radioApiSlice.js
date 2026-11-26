// src/features/radioApiSlice.js
import { apiSlice } from "./apiSlice.js";

const RADIO_URL = "/radio";

export const radioApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ==========================================
       LIVE SESSION (Admin)
       ========================================== */
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
        body: sessionId ? { sessionId } : {},
      }),
      invalidatesTags: ["RadioSession", "PastSessions"],
    }),
    generateGuestLink: builder.mutation({
      query: () => ({
        url: `${RADIO_URL}/guest-link`,
        method: "POST",
      }),
    }),

    /* ==========================================
       MUSIC MANAGEMENT (Admin)
       ========================================== */
    uploadMusicTrack: builder.mutation({
      query: (formData) => ({
        url: `${RADIO_URL}/music/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),
    refreshMusicQueue: builder.mutation({
      query: () => ({
        url: `${RADIO_URL}/music/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),
    setCurrentTrack: builder.mutation({
      query: ({ trackId }) => ({
        url: `${RADIO_URL}/music/play`,
        method: "POST",
        body: { trackId },
      }),
      invalidatesTags: ["NowPlaying"],
    }),
    deleteMusicTrack: builder.mutation({
      query: (id) => ({
        url: `${RADIO_URL}/music/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),

    /* ==========================================
       LISTENER / PUBLIC
       ========================================== */
    getListenerToken: builder.query({
      query: () => ({
        url: `${RADIO_URL}/listener-token`,
        method: "GET",
      }),
      keepUnusedDataFor: 0,
      providesTags: ["RadioSession"],
    }),
    getMusicQueue: builder.query({
      query: () => ({
        url: `${RADIO_URL}/music/queue`,
        method: "GET",
      }),
      providesTags: ["MusicQueue", "NowPlaying"],
    }),
    getNowPlaying: builder.query({
      query: () => ({
        url: `${RADIO_URL}/music/now`,
        method: "GET",
      }),
      providesTags: ["NowPlaying"],
      keepUnusedDataFor: 0,
    }),

    /* ==========================================
       PUBLIC SCHEDULE (Radio.jsx "Up Next")
       ========================================== */
    getSchedule: builder.query({
      query: () => ({
        url: `${RADIO_URL}/schedule`,
        method: "GET",
      }),
      providesTags: ["Schedule"],
      keepUnusedDataFor: 60,
    }),

    /* ==========================================
       HISTORICAL
       ========================================== */
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
  // Admin
  useStartLiveSessionMutation,
  useEndLiveSessionMutation,
  useGenerateGuestLinkMutation,
  useUploadMusicTrackMutation,
  useRefreshMusicQueueMutation,
  useSetCurrentTrackMutation,
  useDeleteMusicTrackMutation,

  // Listener
  useGetListenerTokenQuery,
  useGetMusicQueueQuery,
  useGetNowPlayingQuery,
  useLazyGetNowPlayingQuery,

  // Public schedule
  useGetScheduleQuery,

  // Historical
  useGetPastSessionsQuery,
} = radioApiSlice;