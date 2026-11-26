// src/features/radioApiSlice.js
import { apiSlice } from "./apiSlice.js";

const RADIO_URL = "/radio";

export const radioApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // LIVE SESSION (Admin)
    // ==========================================
    startLiveSession: builder.mutation({
      query: (formData) => ({
        url: `${RADIO_URL}/start-session`,
        method: "POST",
        body: formData, // FormData: poster (file), title, description, isVideoEnabled
      }),
      invalidatesTags: ["RadioSession"],
    }),
    endLiveSession: builder.mutation({
      // sessionId is optional now — backend falls back to "the live one"
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

    // ==========================================
    // MUSIC MANAGEMENT (Admin)
    // ==========================================
    // Upload a track: FormData with audio (required), cover (optional), title, artist, duration
    uploadMusicTrack: builder.mutation({
      query: (formData) => ({
        url: `${RADIO_URL}/music/upload`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),

    // Force the auto-queue to refetch from Audius/Jamendo
    refreshMusicQueue: builder.mutation({
      query: () => ({
        url: `${RADIO_URL}/music/refresh`,
        method: "POST",
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),

    // Jump everyone to a specific track. Body: { trackId }
    setCurrentTrack: builder.mutation({
      query: ({ trackId }) => ({
        url: `${RADIO_URL}/music/play`,
        method: "POST",
        body: { trackId },
      }),
      invalidatesTags: ["NowPlaying"],
    }),

    // Delete an admin-uploaded track (by Mongo _id)
    deleteMusicTrack: builder.mutation({
      query: (id) => ({
        url: `${RADIO_URL}/music/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MusicQueue", "NowPlaying"],
    }),

    // ==========================================
    // LISTENER / PUBLIC
    // ==========================================
    getListenerToken: builder.query({
      query: () => ({
        url: `${RADIO_URL}/listener-token`,
        method: "GET",
      }),
      keepUnusedDataFor: 0,
      providesTags: ["RadioSession"],
    }),

    // Full queue + current synchronized nowPlaying snapshot
    getMusicQueue: builder.query({
      query: () => ({
        url: `${RADIO_URL}/music/queue`,
        method: "GET",
      }),
      providesTags: ["MusicQueue", "NowPlaying"],
    }),

    // Lightweight nowPlaying poll (used every ~30–60s to re-sync)
    getNowPlaying: builder.query({
      query: () => ({
        url: `${RADIO_URL}/music/now`,
        method: "GET",
      }),
      providesTags: ["NowPlaying"],
      keepUnusedDataFor: 0, // never cache — always fetch fresh offset
    }),

    // ==========================================
    // HISTORICAL
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
  useLazyGetNowPlayingQuery, // handy for imperative "poll now" after socket events

  // Historical
  useGetPastSessionsQuery,
} = radioApiSlice;