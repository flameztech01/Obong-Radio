// controllers/radioController.js
import { AccessToken, EgressClient } from 'livekit-server-sdk';
import { v2 as cloudinary } from "cloudinary";
import RadioSession from '../models/radioSessionModel.js';
import RadioMusic from '../models/radioMusicModel.js';

const egressClient = new EgressClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const MAIN_ROOM = "obong_radio_main_studio";

// Auto-DJ settings
const MIN_AUTO_TRACKS = 8;                  // refetch if fewer auto tracks than this
const REFRESH_MS = 6 * 60 * 60 * 1000;      // refetch every 6 hours
const AUDIUS_HOST = 'https://api.audius.co';
const AUDIUS_APP_NAME = 'OBONG_RADIO';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200';

let isFetchingMusic = false;
let lastMusicRefresh = 0;

/* ============================================================
   CLOUDINARY HELPER
   ============================================================ */
const uploadFileToCloudinary = async (fileBuffer, folder, resourceType = "image", options = {}) => {
  if (!fileBuffer) return null;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      ...options,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(fileBuffer);
  });
};

/* ============================================================
   HELPER: CREATE LIVEKIT ACCESS TOKEN
   ============================================================ */
const createLiveKitToken = async (identity, name, role, isAdmin = false) => {
  const canPublish = isAdmin || role === 'guest';

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: identity,
    name: name,
    ttl: '6h',
  });

  at.addGrant({
    roomJoin: true,
    room: MAIN_ROOM,
    canPublish: canPublish,
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

// Audius: independent artists, lots of Afrobeats uploads. Free streaming API.
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
      const tracks = json?.data || [];

      for (const t of tracks) {
        const genreOk = /afro/i.test(t.genre || '') || /afro|naija/i.test(`${t.title} ${(t.tags || '')}`);
        const longEnough = (t.duration || 0) >= 90; // skip snippets/intros
        if (!genreOk || !longEnough || t.is_streamable === false) continue;

        results.push({
          id: `audius_${t.id}`,
          name: t.title,
          artist_name: t.user?.name || 'Unknown Artist',
          audio: `${AUDIUS_HOST}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
          image: t.artwork?.['480x480'] || t.artwork?.['150x150'] || DEFAULT_COVER,
        });
      }
    } catch (error) {
      console.error(`Audius error for "${q}":`, error.message);
    }
  }

  return results;
};

// Jamendo: smaller catalog, used as a supplement
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
        });
      }
    } catch (error) {
      console.error(`Jamendo error for "${tag}":`, error.message);
    }
  }

  return results;
};

// Merge all sources, dedupe by title+artist, shuffle
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
  { id: 'f1', name: 'Fallback Track 1', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', image: DEFAULT_COVER },
  { id: 'f2', name: 'Fallback Track 2', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', image: DEFAULT_COVER },
  { id: 'f3', name: 'Fallback Track 3', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', image: DEFAULT_COVER },
  { id: 'f4', name: 'Fallback Track 4', artist_name: 'Auto DJ', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', image: DEFAULT_COVER },
];

const toQueueDoc = (song, index) => ({
  trackId: song.id,
  title: song.name,
  artist: song.artist_name,
  audioUrl: song.audio,
  image: song.image || DEFAULT_COVER,
  order: 1000 + index, // auto tracks come after admin-uploaded ones (which use 0..n)
  isActive: true,
  source: 'auto',
});

const loadQueue = () => RadioMusic.find({ isActive: true }).sort({ order: 1 }).lean();

// Guarantees a decent queue exists, and refreshes it when it is thin or stale
const ensureMusicQueueExists = async () => {
  let queue = await loadQueue();

  const autoCount = queue.filter((t) => t.source !== 'admin').length;
  const stale = Date.now() - lastMusicRefresh > REFRESH_MS;
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
      // Replace only auto tracks. Admin uploads are never touched.
      await RadioMusic.deleteMany({ source: { $ne: 'admin' } });
      await RadioMusic.insertMany(songs.map(toQueueDoc));
      lastMusicRefresh = Date.now();
      console.log(`Saved ${songs.length} Afrobeat tracks to queue.`);
    } else if (queue.length === 0) {
      // Nothing at all to play: last resort so the radio is never silent
      console.log("Sources returned too few songs and queue is empty. Using fallback tracks.");
      await RadioMusic.insertMany(FALLBACK_TRACKS.map(toQueueDoc));
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
              headers: { 'x-session-id': session._id.toString() }
            }
          }
        }
      }, {
        layout: 'grid',
        audioOnly: true,
      });

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
      token: token,
    });
  } catch (err) {
    console.error("startLiveSession error:", err);
    return res.status(500).json({ message: "Failed to start live session" });
  }
};

/* ============================================================
   2. END LIVE SESSION (Admin Only)
   ============================================================ */
export const endLiveSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await RadioSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.egressId) {
      try {
        await egressClient.stopEgress(session.egressId);
      } catch (err) {
        console.error("Failed to stop egress:", err);
      }
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({ message: "Live session ended successfully" });
  } catch (err) {
    console.error("endLiveSession error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3. GET LISTENER TOKEN (Returns Live Session OR Music mode)
   ============================================================ */
export const getListenerToken = async (req, res) => {
  try {
    const user = req.user;
    const identity = user ? user.id : `anon_${Date.now()}`;
    const name = user ? user.name : 'Anonymous Listener';

    const activeSession = await RadioSession.findOne({ status: 'live' }).populate('host', 'name');

    if (!activeSession) {
      const queue = await ensureMusicQueueExists();

      return res.status(200).json({
        active: false,
        message: "No live session. Auto-playing Afrobeat.",
        musicQueue: queue
      });
    }

    const token = await createLiveKitToken(identity, name, 'listener', false);

    return res.status(200).json({
      active: true,
      token: token,
      roomName: MAIN_ROOM,
      session: {
        title: activeSession.title,
        hostName: activeSession.host.name,
        posterImage: activeSession.posterImage,
        isVideoEnabled: activeSession.isVideoEnabled,
      }
    });
  } catch (err) {
    console.error("getListenerToken error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4. GET MUSIC QUEUE (Guaranteed to return music)
   ============================================================ */
export const getMusicQueue = async (req, res) => {
  try {
    const queue = await ensureMusicQueueExists();
    return res.status(200).json({ queue });
  } catch (err) {
    console.error("getMusicQueue error:", err);
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
    return res.status(200).json({ message: "Queue refreshed", count: queue.length, queue });
  } catch (err) {
    console.error("refreshMusicQueue error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4c. UPLOAD YOUR OWN TRACK (Admin Only)
   Expects multipart form: field "audio" (file), optional "cover" (image),
   body: title, artist
   ============================================================ */
export const uploadMusicTrack = async (req, res) => {
  try {
    const audioFile = req.files?.audio?.[0];
    const coverFile = req.files?.cover?.[0];
    const { title, artist } = req.body;

    if (!audioFile) return res.status(400).json({ message: "Audio file is required" });
    if (!title) return res.status(400).json({ message: "Title is required" });

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
      order: adminCount, // admin tracks sit at the front of the queue
      isActive: true,
      source: 'admin',
    });

    return res.status(201).json({ message: "Track added", track });
  } catch (err) {
    console.error("uploadMusicTrack error:", err);
    return res.status(500).json({ message: "Failed to upload track" });
  }
};

/* ============================================================
   4d. DELETE A TRACK FROM THE QUEUE (Admin Only)
   ============================================================ */
export const deleteMusicTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RadioMusic.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Track not found" });
    return res.status(200).json({ message: "Track removed" });
  } catch (err) {
    console.error("deleteMusicTrack error:", err);
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
      expiresIn: "6 hours"
    });
  } catch (err) {
    console.error("generateGuestLink error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6. RECORDING WEBHOOK (Receives Audio & Uploads to Cloudinary)
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
      for await (const chunk of req) {
        chunks.push(chunk);
      }
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

    await RadioSession.findByIdAndUpdate(sessionId, {
      recordingUrl: upload.secure_url,
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("handleRecordingWebhook error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   7. GET PAST SESSIONS (For Replays / Recent Broadcasts)
   ============================================================ */
export const getPastSessions = async (req, res) => {
  try {
    const sessions = await RadioSession.find({
      status: 'ended',
      recordingUrl: { $ne: null }
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