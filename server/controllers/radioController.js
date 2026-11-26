// controllers/radioController.js
import { AccessToken, EgressClient } from 'livekit-server-sdk';
import { v2 as cloudinary } from "cloudinary";
import mongoose from 'mongoose';
import RadioSession from '../models/radioSessionModel.js';
import RadioMusic from '../models/radioMusicModel.js';
import RadioState from '../models/radioStateModel.js';
import { getIO } from '../socket.js';

const egressClient = new EgressClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const MAIN_ROOM = "obong_radio_main_studio";

/* ============================================================
   AUTO-DJ SETTINGS
   ============================================================ */
const MIN_AUTO_TRACKS = 8;
const REFRESH_MS      = 6 * 60 * 60 * 1000;
const AUDIUS_HOST     = 'https://api.audius.co';
const AUDIUS_APP_NAME = 'OBONG_RADIO';
const DEFAULT_COVER   = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200';
const DEFAULT_DURATION = 180; // seconds — used only when a source omits duration

let isFetchingMusic   = false;
let lastMusicRefresh  = 0;

/* ============================================================
   CLOUDINARY HELPER
   ============================================================ */
const uploadFileToCloudinary = async (fileBuffer, folder, resourceType = "image", options = {}) => {
  if (!fileBuffer) return null;
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: resourceType, ...options }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(fileBuffer);
  });
};

/* ============================================================
   LIVEKIT TOKEN HELPER
   ============================================================ */
const createLiveKitToken = async (identity, name, role, isAdmin = false) => {
  const canPublish = isAdmin || role === 'guest';
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity, name, ttl: '6h',
  });
  at.addGrant({
    roomJoin: true,
    room: MAIN_ROOM,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });
  return await at.toJwt();
};

/* ============================================================
   AUTO-DJ HELPERS
   ============================================================ */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fetchMusicFromAudius = async () => {
  const queries = ['afrobeats', 'afrobeat', 'afropop', 'naija', 'afro fusion'];
  const results = [];

  for (const q of queries) {
    try {
      const url = `${AUDIUS_HOST}/v1/tracks/search?query=${encodeURIComponent(q)}&limit=30&app_name=${AUDIUS_APP_NAME}`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Audius search "${q}" failed with status ${response.status}`);
        continue;
      }
      const json = await response.json();
      for (const t of json?.data || []) {
        const genreOk   = /afro/i.test(t.genre || '') || /afro|naija/i.test(`${t.title} ${(t.tags || '')}`);
        const longEnough = (t.duration || 0) >= 90;
        if (!genreOk || !longEnough || t.is_streamable === false) continue;

        results.push({
          id: `audius_${t.id}`,
          name: t.title,
          artist_name: t.user?.name || 'Unknown Artist',
          audio: `${AUDIUS_HOST}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
          image: t.artwork?.['480x480'] || t.artwork?.['150x150'] || DEFAULT_COVER,
          duration: Number(t.duration) || 0, // Audius returns seconds
        });
      }
    } catch (error) {
      console.error(`Audius error for "${q}":`, error.message);
    }
  }
  return results;
};

const fetchMusicFromJamendo = async () => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) return [];

  const tagList = ['afrobeat', 'afropop', 'african'];
  const results = [];

  for (const tag of tagList) {
    try {
      const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&tags=${tag}&audioformat=mp32&order=popularity_month&include=musicinfo`;
      const response = await fetch(url);
      const data = await response.json();

      for (const s of data?.results || []) {
        if (!s.audio) continue;
        results.push({
          id: `jamendo_${s.id}`,
          name: s.name,
          artist_name: s.artist_name,
          audio: s.audio,
          image: s.image || DEFAULT_COVER,
          duration: Number(s.duration) || 0, // Jamendo returns seconds
        });
      }
    } catch (error) {
      console.error(`Jamendo error for "${tag}":`, error.message);
    }
  }
  return results;
};

const fetchAfrobeatTracks = async (limit = 25) => {
  const [audius, jamendo] = await Promise.all([fetchMusicFromAudius(), fetchMusicFromJamendo()]);
  console.log(`Fetched ${audius.length} from Audius, ${jamendo.length} from Jamendo`);

  const seen = new Set();
  const merged = [];
  for (const song of [...audius, ...jamendo]) {
    const key = `${song.name}`.toLowerCase().trim() + '|' + `${song.artist_name}`.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(song);
  }
  return shuffle(merged).slice(0, limit);
};

const FALLBACK_TRACKS = [
  { id: 'f1', name: 'Fallback Track 1', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', image: DEFAULT_COVER, duration: 372 },
  { id: 'f2', name: 'Fallback Track 2', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', image: DEFAULT_COVER, duration: 330 },
  { id: 'f3', name: 'Fallback Track 3', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', image: DEFAULT_COVER, duration: 284 },
  { id: 'f4', name: 'Fallback Track 4', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', image: DEFAULT_COVER, duration: 358 },
];

const toQueueDoc = (song, index) => ({
  trackId: song.id,
  title: song.name,
  artist: song.artist_name,
  audioUrl: song.audio,
  image: song.image || DEFAULT_COVER,
  duration: Number(song.duration) || DEFAULT_DURATION,
  order: 1000 + index,
  isActive: true,
  source: 'auto',
});

const loadQueue = () => RadioMusic.find({ isActive: true }).sort({ order: 1 }).lean();

/* ============================================================
   PLAYBACK TIMELINE HELPERS (synchronized for ALL listeners)
   ============================================================ */
const getOrCreateState = async () => {
  let state = await RadioState.findOne({ key: 'global' });
  if (!state) {
    state = await RadioState.create({ key: 'global', playlistStartedAt: new Date() });
  }
  return state;
};

const resetTimeline = async (startedAt = new Date()) => {
  await RadioState.updateOne(
    { key: 'global' },
    { playlistStartedAt: startedAt },
    { upsert: true }
  );
};

const trackDurationSec = (t) => Math.max(1, Number(t.duration) || DEFAULT_DURATION);

/**
 * Given the queue and the epoch, return which track should be playing right now
 * and the number of seconds into it. Pure math → identical for all callers.
 */
const computeNowPlaying = (queue, startedAt) => {
  if (!queue || queue.length === 0) {
    return { track: null, index: -1, offsetSec: 0, durationSec: 0, nextTrack: null };
  }

  const totalSec = queue.reduce((sum, t) => sum + trackDurationSec(t), 0);
  const elapsedSec = Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 1000);
  let positionSec = elapsedSec % totalSec;

  for (let i = 0; i < queue.length; i++) {
    const dur = trackDurationSec(queue[i]);
    if (positionSec < dur) {
      return {
        track: queue[i],
        index: i,
        offsetSec: positionSec,
        durationSec: dur,
        nextTrack: queue[(i + 1) % queue.length],
      };
    }
    positionSec -= dur;
  }

  return { track: queue[0], index: 0, offsetSec: 0, durationSec: trackDurationSec(queue[0]), nextTrack: queue[1] || null };
};

const formatNowPlaying = (np) => ({
  track: np.track,
  index: np.index,
  offsetSec: Math.floor(np.offsetSec),         // how far into the track (seconds)
  durationSec: np.durationSec,
  nextTrack: np.nextTrack,
});

/* ============================================================
   QUEUE LOADER (with auto-refresh + timeline reset)
   ============================================================ */
const ensureMusicQueueExists = async () => {
  let queue = await loadQueue();

  const autoCount = queue.filter((t) => t.source !== 'admin').length;
  const stale     = Date.now() - lastMusicRefresh > REFRESH_MS;
  const needsRefresh = autoCount < MIN_AUTO_TRACKS || stale;

  if (!needsRefresh) return queue;

  if (isFetchingMusic) {
    console.log("Already fetching music, returning current queue...");
    return queue;
  }

  isFetchingMusic = true;
  try {
    console.log("Refreshing Afrobeat auto-queue...");
    const songs = await fetchAfrobeatTracks(25);

    if (songs.length >= MIN_AUTO_TRACKS) {
      await RadioMusic.deleteMany({ source: { $ne: 'admin' } });
      await RadioMusic.insertMany(songs.map(toQueueDoc));
      lastMusicRefresh = Date.now();
      // New queue → reset the epoch so everyone jumps to track 0 together.
      await resetTimeline(new Date());
      console.log(`Saved ${songs.length} Afrobeat tracks and reset the timeline.`);
    } else if (queue.length === 0) {
      console.log("Sources returned too few songs and queue is empty. Using fallback tracks.");
      await RadioMusic.insertMany(FALLBACK_TRACKS.map(toQueueDoc));
      await resetTimeline(new Date());
    } else {
      console.log(`Only ${songs.length} songs fetched, keeping existing queue.`);
    }

    queue = await loadQueue();
  } catch (error) {
    console.error("Failed to refresh music queue:", error);
  } finally {
    isFetchingMusic = false;
  }

  return queue;
};

/* ============================================================
   1. GO LIVE (Admin Only)
   ============================================================ */
export const startLiveSession = async (req, res) => {
  try {
    const { title, description, isVideoEnabled } = req.body;
    const posterFile = req.files?.poster?.[0];

    if (!posterFile) {
      return res.status(400).json({ message: "A poster image is required to start a session" });
    }

    const upload = await uploadFileToCloudinary(
      posterFile.buffer,
      "obong_radio/session_posters",
      "image"
    );

    await RadioSession.updateMany({ status: 'live' }, { status: 'ended', endedAt: new Date() });

    const session = await RadioSession.create({
      title: title || "Live Radio Broadcast",
      description: description || "Streaming live from Obong University",
      host: req.user.id,
      status: 'live',
      isVideoEnabled: isVideoEnabled === 'true' || isVideoEnabled === true,
      posterImage: upload.secure_url,
      startedAt: new Date(),
    });

    try {
      const egressInfo = await egressClient.startRoomCompositeEgress(MAIN_ROOM, {
        file: {
          filepath: `session_${session._id}.mp3`,
          output: {
            case: 'http',
            value: {
              url: `${process.env.BACKEND_URL}/api/radio/webhook/recording-complete`,
              headers: { 'x-session-id': session._id.toString() },
            },
          },
        },
      }, { layout: 'grid', audioOnly: true });

      session.egressId = egressInfo.egressId;
      await session.save();
    } catch (egressError) {
      console.error("Egress recording failed to start:", egressError);
    }

    const token = await createLiveKitToken(req.user.id, req.user.name, 'admin', true);

    return res.status(200).json({
      message: "Live session started",
      sessionId: session._id,
      roomName: MAIN_ROOM,
      token,
    });
  } catch (err) {
    console.error("startLiveSession error:", err);
    return res.status(500).json({ message: "Failed to start live session" });
  }
};

/* ============================================================
   2. END LIVE SESSION (Admin Only) — survives bad/missing IDs
   ============================================================ */
export const endLiveSession = async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    let session = null;

    if (sessionId && mongoose.Types.ObjectId.isValid(String(sessionId))) {
      session = await RadioSession.findById(sessionId);
    }
    if (!session) session = await RadioSession.findOne({ status: 'live' });
    if (!session) return res.status(404).json({ message: "No active session to end" });

    if (session.egressId) {
      try { await egressClient.stopEgress(session.egressId); }
      catch (err) { console.error("Failed to stop egress:", err); }
    }

    session.status  = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({ message: "Live session ended successfully" });
  } catch (err) {
    console.error("endLiveSession error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. LISTENER TOKEN
   ============================================================ */
export const getListenerToken = async (req, res) => {
  try {
    const user = req.user;
    const identity = user ? user.id : `anon_${Date.now()}`;
    const name     = user ? user.name : 'Anonymous Listener';
    const isAdmin  = !!user && (user.role === 'admin' || user.isAdmin === true);

    const activeSession = await RadioSession.findOne({ status: 'live' }).populate('host', 'name');

    // No live show → return synchronized music state (auto-DJ)
    if (!activeSession) {
      const queue = await ensureMusicQueueExists();
      const state = await getOrCreateState();
      const np    = computeNowPlaying(queue, state.playlistStartedAt);

      return res.status(200).json({
        active: false,
        mode: 'music',
        message: "No live session. Auto-playing synchronized Afrobeat.",
        queue,
        nowPlaying: formatNowPlaying(np),
        serverTime: Date.now(),
      });
    }

    const token = await createLiveKitToken(
      identity,
      name,
      isAdmin ? 'admin' : 'listener',
      isAdmin
    );

    return res.status(200).json({
      active: true,
      token,
      roomName: MAIN_ROOM,
      sessionId: activeSession._id.toString(),   // <-- needed by End-Session
      session: {
        title: activeSession.title,
        hostName: activeSession.host.name,
        posterImage: activeSession.posterImage,
        isVideoEnabled: activeSession.isVideoEnabled,
      },
    });
  } catch (err) {
    console.error("getListenerToken error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. GET MUSIC QUEUE (with synchronized nowPlaying)
   ============================================================ */
export const getMusicQueue = async (req, res) => {
  try {
    const queue = await ensureMusicQueueExists();
    const state = await getOrCreateState();
    const np    = computeNowPlaying(queue, state.playlistStartedAt);

    return res.status(200).json({
      queue,
      nowPlaying: formatNowPlaying(np),
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error("getMusicQueue error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4a. LIGHTWEIGHT NOW-PLAYING (for client sync polling)
   ============================================================ */
export const getNowPlaying = async (req, res) => {
  try {
    const queue = await ensureMusicQueueExists();
    const state = await getOrCreateState();
    const np    = computeNowPlaying(queue, state.playlistStartedAt);

    return res.status(200).json({
      nowPlaying: formatNowPlaying(np),
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error("getNowPlaying error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4b. FORCE REFRESH AUTO QUEUE (Admin Only)
   ============================================================ */
export const refreshMusicQueue = async (req, res) => {
  try {
    lastMusicRefresh = 0; // mark stale so ensureMusicQueueExists refetches
    const queue = await ensureMusicQueueExists();
    const state = await getOrCreateState();
    const np    = computeNowPlaying(queue, state.playlistStartedAt);

    return res.status(200).json({
      message: "Queue refreshed",
      count: queue.length,
      queue,
      nowPlaying: formatNowPlaying(np),
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error("refreshMusicQueue error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4c. UPLOAD YOUR OWN TRACK (Admin Only)
   Body: title, artist, duration (seconds). Files: audio (required), cover (optional)
   ============================================================ */
export const uploadMusicTrack = async (req, res) => {
  try {
    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.cover?.[0];
    const { title, artist, duration } = req.body;

    if (!audioFile) return res.status(400).json({ message: "Audio file is required" });
    if (!title)     return res.status(400).json({ message: "Title is required" });

    const audioUpload = await uploadFileToCloudinary(
      audioFile.buffer,
      "obong_radio/music",
      "video" // Cloudinary stores audio under the "video" resource type
    );

    let image = DEFAULT_COVER;
    if (coverFile) {
      const coverUpload = await uploadFileToCloudinary(coverFile.buffer, "obong_radio/music_covers", "image");
      image = coverUpload.secure_url;
    }

    const adminCount = await RadioMusic.countDocuments({ source: 'admin' });

    const track = await RadioMusic.create({
      trackId: `admin_${Date.now()}`,
      title,
      artist: artist || 'Unknown Artist',
      audioUrl: audioUpload.secure_url,
      image,
      duration: Number(duration) || DEFAULT_DURATION,
      order: adminCount, // admin tracks sit at the front of the queue
      isActive: true,
      source: 'admin',
    });

    // New track changed the playlist length → re-anchor the epoch
    // so clients don't jump mid-song when the total duration changed.
    // (We simply start the timeline at the current moment; all clients
    //  will then re-sync from track 0 on next fetch.)
    await resetTimeline(new Date());

    return res.status(201).json({ message: "Track added", track });
  } catch (err) {
    console.error("uploadMusicTrack error:", err);
    return res.status(500).json({ message: "Failed to upload track" });
  }
};

/* ============================================================
   4d. DELETE A TRACK (Admin Only)
   ============================================================ */
export const deleteMusicTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RadioMusic.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Track not found" });

    // Playlist length changed → re-anchor epoch for a clean re-sync.
    await resetTimeline(new Date());

    return res.status(200).json({ message: "Track removed" });
  } catch (err) {
    console.error("deleteMusicTrack error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4e. PLAY NOW (Admin Only) — force a specific track to play for EVERYONE
   ============================================================ */
export const setCurrentTrack = async (req, res) => {
  try {
    const { trackId } = req.body || {};
    if (!trackId) return res.status(400).json({ message: "trackId is required" });

    const queue = await loadQueue();
    const idx = queue.findIndex(
      (t) => String(t._id) === String(trackId) || t.trackId === String(trackId)
    );
    if (idx === -1) return res.status(404).json({ message: "Track not in queue" });

    // Position (in seconds) of the selected track's start within the playlist.
    const beforeSec = queue
      .slice(0, idx)
      .reduce((sum, t) => sum + trackDurationSec(t), 0);

    // Shift the epoch backwards by that many seconds → "now" points at offset 0 of the chosen track.
    const startedAt = new Date(Date.now() - beforeSec * 1000);
    await resetTimeline(startedAt);

    const np = computeNowPlaying(queue, startedAt);

    // Broadcast to everyone currently listening so their players jump instantly.
    try {
      const io = getIO();
      io.to(MAIN_ROOM).emit('radio:track_changed', {
        nowPlaying: formatNowPlaying(np),
        serverTime: Date.now(),
      });
    } catch (e) {
      console.warn("Socket broadcast failed (this is fine if socket isn't ready):", e.message);
    }

    return res.status(200).json({
      message: "Now playing updated for all listeners",
      nowPlaying: formatNowPlaying(np),
      serverTime: Date.now(),
    });
  } catch (err) {
    console.error("setCurrentTrack error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5. GENERATE GUEST INVITE LINK (Admin Only)
   ============================================================ */
export const generateGuestLink = async (req, res) => {
  try {
    const activeSession = await RadioSession.findOne({ status: 'live' });
    if (!activeSession) return res.status(400).json({ message: "Cannot invite guests when not live" });

    const guestIdentity = `guest_${Date.now()}`;
    const token = await createLiveKitToken(guestIdentity, 'Guest Caller', 'guest', false);

    return res.status(200).json({
      token,
      roomName: MAIN_ROOM,
      expiresIn: "6 hours",
    });
  } catch (err) {
    console.error("generateGuestLink error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. RECORDING WEBHOOK
   ============================================================ */
export const handleRecordingWebhook = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) return res.status(400).json({ message: "Missing session ID in headers" });

    let fileBuffer;
    if (Buffer.isBuffer(req.body)) {
      fileBuffer = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      fileBuffer = Buffer.concat(chunks);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ message: "Empty audio file received" });
    }

    const upload = await uploadFileToCloudinary(
      fileBuffer,
      "obong_radio/session_recordings",
      "video",
      { format: 'mp3' }
    );

    await RadioSession.findByIdAndUpdate(sessionId, { recordingUrl: upload.secure_url });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("handleRecordingWebhook error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   7. PAST SESSIONS
   ============================================================ */
export const getPastSessions = async (req, res) => {
  try {
    const sessions = await RadioSession.find({
      status: 'ended',
      recordingUrl: { $ne: null },
    })
      .sort({ endedAt: -1 })
      .limit(5)
      .populate('host', 'name');

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error("getPastSessions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};