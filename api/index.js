// server/serverless.ts
import "dotenv/config";

// server/appFactory.ts
import express from "express";
import path3 from "path";

// server/auth/bearer-token.ts
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  const token = parts[1].trim();
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  return token;
}

// server/auth/firebase-token.ts
import "dotenv/config";
var DEFAULT_FIREBASE_API_KEY = "AIzaSyAqQIiCklhaOacTGR-LZC0kiPKQXtH_lV4";
async function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
    return null;
  }
  const cleanToken = idToken.trim();
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_API_KEY;
  if (!apiKey) {
    console.warn("[Auth] Firebase API key is missing on server for token verification.");
    return null;
  }
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: cleanToken })
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json().catch(() => null);
    if (data && Array.isArray(data.users) && data.users.length > 0) {
      const user = data.users[0];
      if (user && user.localId) {
        return {
          uid: user.localId,
          email: user.email
        };
      }
    }
  } catch (err) {
    console.warn("[Auth] Safe token lookup note:", err?.message || "Token validation error");
  }
  return null;
}

// server/auth.ts
async function authenticateAdmin(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Bearer token" });
    }
    const verifiedUser = await verifyFirebaseToken(token);
    if (!verifiedUser) {
      return res.status(401).json({ error: "Unauthorized: Firebase token verification failed" });
    }
    const configuredAdminUid = process.env.FIREBASE_ADMIN_UID?.trim();
    if (configuredAdminUid && configuredAdminUid.length > 0) {
      if (verifiedUser.uid !== configuredAdminUid) {
        return res.status(403).json({ error: "Forbidden: User is not authorized as administrator" });
      }
    }
    req.adminUser = {
      uid: verifiedUser.uid,
      email: verifiedUser.email || "",
      isAdmin: true
    };
    return next();
  } catch (err) {
    console.error("[Auth] Server exception during authenticateAdmin:", err?.message || "Authentication error");
    return res.status(500).json({ error: "Internal authentication error" });
  }
}
async function handleAdminLogin(req, res) {
  try {
    const tokenInBody = req.body?.idToken;
    const tokenInHeader = extractBearerToken(req);
    const idToken = tokenInBody || tokenInHeader;
    if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
      return res.status(400).json({ error: "Firebase ID token is required for verification" });
    }
    const verifiedUser = await verifyFirebaseToken(idToken.trim());
    if (!verifiedUser) {
      return res.status(401).json({ error: "Invalid or expired Firebase ID token" });
    }
    const configuredAdminUid = process.env.FIREBASE_ADMIN_UID?.trim();
    if (configuredAdminUid && configuredAdminUid.length > 0) {
      if (verifiedUser.uid !== configuredAdminUid) {
        return res.status(403).json({ error: "Forbidden: User is not authorized as administrator" });
      }
    }
    return res.json({
      success: true,
      user: {
        uid: verifiedUser.uid,
        email: verifiedUser.email || "",
        isAdmin: true
      }
    });
  } catch (err) {
    console.error("[Auth] Server exception during handleAdminLogin:", err?.message || "Login error");
    return res.status(500).json({ error: "Internal authentication error" });
  }
}

// server/imagekit.ts
import crypto from "crypto";
function handleImageKitAuth(req, res) {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || "";
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
  if (!privateKey || !publicKey) {
    return res.status(500).json({
      error: "ImageKit private or public key is not configured on server."
    });
  }
  const token = crypto.randomBytes(16).toString("hex");
  const nowUnix = Math.floor(Date.now() / 1e3);
  const requestedExpire = parseInt(req.query.expire, 10);
  const expire = requestedExpire && requestedExpire > nowUnix && requestedExpire <= nowUnix + 3600 ? requestedExpire : nowUnix + 1800;
  const signature = crypto.createHmac("sha1", privateKey).update(token + expire).digest("hex");
  return res.json({
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint
  });
}

// server/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
var AUDIO_DIR = path.join(UPLOAD_DIR, "audio");
var IMAGES_DIR = path.join(UPLOAD_DIR, "images");
var VIDEOS_DIR = path.join(UPLOAD_DIR, "videos");
var METADATA_FILE = path.join(process.cwd(), "data", "audio_tracks.json");
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Note: Local upload directories cannot be created in read-only environment:", err);
}
function loadTracksMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Error reading audio tracks metadata:", err);
  }
  return [];
}
function saveTracksMetadata(tracks) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(tracks, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing audio tracks metadata:", err);
  }
}
var audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp3";
    const baseName = path.basename(file.originalname, ext);
    const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  }
});
var uploadAudioMiddleware = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"];
    const ext = path.extname(file.originalname).toLowerCase();
    const isAudioMime = file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream";
    if (allowedExtensions.includes(ext) && isAudioMime) {
      cb(null, true);
    } else {
      cb(new Error("Only safe audio formats are permitted (.mp3, .wav, .ogg, .m4a, .aac, .flac)"));
    }
  }
});
function isValidFileSignature(filePath, expectedCategory) {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    const hex = buffer.toString("hex").toLowerCase();
    if (expectedCategory === "image") {
      if (hex.startsWith("ffd8ff")) return true;
      if (hex.startsWith("89504e470d0a1a0a")) return true;
      if (hex.startsWith("47494638")) return true;
      if (hex.startsWith("52494646") && buffer.subarray(8, 12).toString() === "WEBP") return true;
      if (hex.startsWith("424d")) return true;
      if (buffer.subarray(4, 8).toString() === "ftyp") return true;
      return false;
    }
    if (expectedCategory === "audio") {
      if (hex.startsWith("494433")) return true;
      if (hex.startsWith("fffb") || hex.startsWith("fff3") || hex.startsWith("fff2") || hex.startsWith("ffe3")) return true;
      if (hex.startsWith("52494646") && buffer.subarray(8, 12).toString() === "WAVE") return true;
      if (hex.startsWith("4f676753")) return true;
      if (hex.startsWith("664c6143")) return true;
      if (buffer.subarray(4, 8).toString() === "ftyp") return true;
      if (hex.startsWith("1a45dfa3")) return true;
      return false;
    }
    if (expectedCategory === "video") {
      if (buffer.subarray(4, 8).toString() === "ftyp" || buffer.subarray(4, 8).toString() === "moov") return true;
      if (hex.startsWith("1a45dfa3")) return true;
      if (hex.startsWith("4f676753")) return true;
      return false;
    }
    return false;
  } catch (err) {
    return false;
  }
}
function handleAudioUpload(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }
    if (!isValidFileSignature(file.path, "audio")) {
      try {
        fs.unlinkSync(file.path);
      } catch {
      }
      return res.status(400).json({ success: false, error: "Uploaded file signature is invalid or corrupted" });
    }
    const rawSongName = req.body?.songName || path.basename(file.originalname, path.extname(file.originalname)).replace(/[-_]/g, " ");
    const songName = rawSongName.replace(/[<>]/g, "").trim().slice(0, 100);
    const publicUrl = `/uploads/audio/${file.filename}`;
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = /* @__PURE__ */ new Date();
    const track = {
      id: trackId,
      name: songName,
      url: publicUrl,
      type: "uploaded",
      originalFilename: file.originalname.slice(0, 100),
      filename: file.filename,
      mimeType: file.mimetype || "audio/mpeg",
      size: file.size,
      dateAdded: now.toLocaleDateString(),
      createdAt: now.toISOString(),
      isActive: true
    };
    const currentTracks = loadTracksMetadata();
    currentTracks.unshift(track);
    saveTracksMetadata(currentTracks);
    return res.json({
      success: true,
      track,
      tracks: currentTracks
    });
  } catch (error) {
    console.error("Audio upload handler error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to process audio upload" });
  }
}
function handleGetAudioTracks(_req, res) {
  try {
    const tracks = loadTracksMetadata();
    return res.json({ success: true, tracks });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to retrieve audio tracks" });
  }
}
function handleDeleteAudioTrack(req, res) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ success: false, error: "Invalid track ID" });
    }
    const tracks = loadTracksMetadata();
    const trackToDelete = tracks.find((t) => t.id === id);
    const updatedTracks = tracks.filter((t) => t.id !== id);
    if (trackToDelete && trackToDelete.filename) {
      const safeFilename = path.basename(trackToDelete.filename);
      const filePath = path.resolve(AUDIO_DIR, safeFilename);
      if (filePath.startsWith(AUDIO_DIR) && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn("Could not delete physical audio file:", e);
        }
      }
    }
    saveTracksMetadata(updatedTracks);
    return res.json({
      success: true,
      deletedId: id,
      tracks: updatedTracks
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to delete audio track" });
  }
}
var mediaStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const isVideo = file.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
    cb(null, isVideo ? VIDEOS_DIR : IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith("video/") ? ".mp4" : ".jpg");
    const baseName = path.basename(file.originalname, ext);
    const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  }
});
var uploadMediaMiddleware = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedImageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".heic", ".avif"];
    const allowedVideoExts = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".3gp", ".mkv"];
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = (file.mimetype.startsWith("image/") || allowedImageExts.includes(ext)) && ext !== ".svg" && file.mimetype !== "image/svg+xml";
    const isVideo = file.mimetype.startsWith("video/") || allowedVideoExts.includes(ext);
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error("Only safe raster images (.jpg, .png, .webp, etc.) and video files are permitted (.mp4, .webm, .mov)"));
    }
  }
});
function handleMediaUpload(req, res) {
  try {
    const files = req.files;
    const singleFile = req.file;
    if (!singleFile && (!files || files.length === 0)) {
      return res.status(400).json({ success: false, error: "No media file uploaded" });
    }
    if (singleFile) {
      const isVideo = singleFile.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(singleFile.originalname);
      const category = isVideo ? "video" : "image";
      if (!isValidFileSignature(singleFile.path, category)) {
        try {
          fs.unlinkSync(singleFile.path);
        } catch {
        }
        return res.status(400).json({ success: false, error: `Uploaded ${category} file signature is invalid or corrupted` });
      }
      const publicUrl = isVideo ? `/uploads/videos/${singleFile.filename}` : `/uploads/images/${singleFile.filename}`;
      const fileId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return res.json({
        success: true,
        url: publicUrl,
        fileId,
        mediaType: isVideo ? "video" : "image",
        filename: singleFile.filename,
        originalFilename: singleFile.originalname,
        size: singleFile.size,
        mimeType: singleFile.mimetype
      });
    }
    if (files && files.length > 0) {
      for (const file of files) {
        const isVideo = file.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
        const category = isVideo ? "video" : "image";
        if (!isValidFileSignature(file.path, category)) {
          for (const f of files) {
            try {
              fs.unlinkSync(f.path);
            } catch {
            }
          }
          return res.status(400).json({ success: false, error: `One or more uploaded ${category} files had invalid signatures` });
        }
      }
      const results = files.map((file, idx) => {
        const isVideo = file.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
        const publicUrl = isVideo ? `/uploads/videos/${file.filename}` : `/uploads/images/${file.filename}`;
        const fileId = `media_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const cleanTitle = path.basename(file.originalname, path.extname(file.originalname)).replace(/[-_]/g, " ");
        return {
          url: publicUrl,
          fileId,
          title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
          mediaType: isVideo ? "video" : "image",
          size: file.size
        };
      });
      return res.json({
        success: true,
        items: results,
        url: results[0].url,
        fileId: results[0].fileId
      });
    }
    return res.status(400).json({ success: false, error: "No files received" });
  } catch (error) {
    console.error("Media upload handler error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to process media upload" });
  }
}

// server/birthday.ts
import fs2 from "fs";
import path2 from "path";
var SETTINGS_FILE = path2.join(process.cwd(), "data", "birthday-settings.json");
function ensureDataDir() {
  try {
    const dir = path2.join(process.cwd(), "data");
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
  }
}
var defaultBirthdaySettings = {
  birthdayDate: "2026-12-25",
  birthdayTime: "00:00:00",
  timezone: "Asia/Kolkata",
  countdownEnabled: true,
  birthdayMonth: 12,
  birthdayDay: 25,
  birthdayYear: 2026,
  targetDate: "2026-12-24T18:30:00.000Z",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
function getSafeDayForYear(year, month, day) {
  if (month === 2 && day === 29) {
    return isLeapYear(year) ? 29 : 28;
  }
  const maxDays = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31;
  return Math.min(day, maxDays);
}
function getCurrentDateTimeInTimezone(timezone = "Asia/Kolkata") {
  const now = /* @__PURE__ */ new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type) => {
      const p = parts.find((pt) => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    let hour = getPart("hour");
    if (hour === 24) hour = 0;
    return {
      year: getPart("year"),
      month: getPart("month"),
      day: getPart("day"),
      hours: hour,
      minutes: getPart("minute"),
      seconds: getPart("second")
    };
  } catch (e) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hours: now.getUTCHours(),
      minutes: now.getUTCMinutes(),
      seconds: now.getUTCSeconds()
    };
  }
}
function getTimezoneOffsetMs(date, timezone) {
  try {
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 0;
  }
}
function getZonedTimestamp(year, month, day, hours, minutes, seconds, timezone) {
  const safeDay = getSafeDayForYear(year, month, day);
  const naiveUtc = Date.UTC(year, month - 1, safeDay, hours, minutes, seconds);
  const offset = getTimezoneOffsetMs(new Date(naiveUtc), timezone);
  const exactUtc = naiveUtc - offset;
  const refinedOffset = getTimezoneOffsetMs(new Date(exactUtc), timezone);
  return naiveUtc - refinedOffset;
}
function calculateNextOccurrence(month, day, timeStr, timezone = "Asia/Kolkata") {
  const [hStr, mStr, sStr] = (timeStr || "00:00:00").split(":");
  const hours = parseInt(hStr || "0", 10) || 0;
  const minutes = parseInt(mStr || "0", 10) || 0;
  const seconds = parseInt(sStr || "0", 10) || 0;
  const nowInTz = getCurrentDateTimeInTimezone(timezone);
  const nowMs = Date.now();
  const thisYearTargetMs = getZonedTimestamp(nowInTz.year, month, day, hours, minutes, seconds, timezone);
  let targetYear = nowInTz.year;
  let targetTimestampMs = thisYearTargetMs;
  let isPassedThisYear = false;
  if (thisYearTargetMs <= nowMs) {
    isPassedThisYear = true;
    targetYear = nowInTz.year + 1;
    targetTimestampMs = getZonedTimestamp(targetYear, month, day, hours, minutes, seconds, timezone);
  }
  const targetDate = new Date(targetTimestampMs);
  const targetDateIso = targetDate.toISOString();
  let formattedTarget = "";
  try {
    formattedTarget = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: "full",
      timeStyle: "medium"
    }).format(targetDate);
  } catch (e) {
    formattedTarget = targetDateIso;
  }
  return {
    targetTimestampMs,
    targetDateIso,
    targetYear,
    isPassedThisYear,
    formattedTarget
  };
}
function readStoredBirthdaySettings() {
  ensureDataDir();
  try {
    if (fs2.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs2.readFileSync(SETTINGS_FILE, "utf-8"));
      return { ...defaultBirthdaySettings, ...data };
    }
  } catch (e) {
    console.warn("Could not read birthday settings from file:", e);
  }
  return { ...defaultBirthdaySettings };
}
function saveStoredBirthdaySettings(settings) {
  ensureDataDir();
  const current = readStoredBirthdaySettings();
  const merged = {
    ...current,
    ...settings,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const nextOcc = calculateNextOccurrence(
    merged.birthdayMonth,
    merged.birthdayDay,
    merged.birthdayTime,
    merged.timezone
  );
  merged.targetDate = nextOcc.targetDateIso;
  try {
    fs2.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing birthday settings file:", e);
  }
  return merged;
}
function handleGetBirthdaySettings(req, res) {
  try {
    const settings = readStoredBirthdaySettings();
    const nextOcc = calculateNextOccurrence(
      settings.birthdayMonth,
      settings.birthdayDay,
      settings.birthdayTime,
      settings.timezone
    );
    return res.json({
      success: true,
      settings: {
        ...settings,
        nextOccurrenceIso: nextOcc.targetDateIso,
        targetTimestampMs: nextOcc.targetTimestampMs,
        targetYear: nextOcc.targetYear,
        isPassedThisYear: nextOcc.isPassedThisYear,
        formattedNextOccurrence: nextOcc.formattedTarget
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to retrieve birthday settings" });
  }
}
function handleUpdateBirthdaySettings(req, res) {
  try {
    const { birthdayDate, birthdayTime, timezone, countdownEnabled } = req.body;
    if (!birthdayDate || typeof birthdayDate !== "string") {
      return res.status(400).json({ error: "Please select a valid birthday date (YYYY-MM-DD)." });
    }
    const dateParts = birthdayDate.split("-");
    if (dateParts.length !== 3) {
      return res.status(400).json({ error: "Please enter a valid birthday date in YYYY-MM-DD format." });
    }
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return res.status(400).json({ error: "Please enter a valid birthday month (1-12) and day (1-31)." });
    }
    if (month === 2 && day === 29) {
    } else if (month === 2 && day > 29) {
      return res.status(400).json({ error: "February cannot have more than 29 days." });
    }
    if (!birthdayTime || typeof birthdayTime !== "string") {
      return res.status(400).json({ error: "Please enter a valid birthday time (HH:MM or HH:MM:SS)." });
    }
    const timeParts = birthdayTime.split(":");
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: "Please enter a valid time between 00:00 and 23:59." });
    }
    const tz = timezone || "Asia/Kolkata";
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(/* @__PURE__ */ new Date());
    } catch (e) {
      return res.status(400).json({ error: `Invalid timezone provided: "${tz}".` });
    }
    const updated = saveStoredBirthdaySettings({
      birthdayDate,
      birthdayTime: timeParts.length === 2 ? `${birthdayTime}:00` : birthdayTime,
      timezone: tz,
      countdownEnabled: countdownEnabled !== false,
      birthdayMonth: month,
      birthdayDay: day,
      birthdayYear: year
    });
    const nextOcc = calculateNextOccurrence(month, day, updated.birthdayTime, tz);
    return res.json({
      success: true,
      message: "Birthday date, time, and recurrence settings updated successfully.",
      settings: {
        ...updated,
        nextOccurrenceIso: nextOcc.targetDateIso,
        targetTimestampMs: nextOcc.targetTimestampMs,
        targetYear: nextOcc.targetYear,
        isPassedThisYear: nextOcc.isPassedThisYear,
        formattedNextOccurrence: nextOcc.formattedTarget
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to update birthday settings" });
  }
}

// server/middleware/security.ts
function createRateLimiter(options) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    keyGenerator = (req) => {
      try {
        const rawXff = req.headers["x-forwarded-for"];
        let ip = "";
        if (typeof rawXff === "string") {
          ip = rawXff.split(",")[0].trim();
        } else if (Array.isArray(rawXff) && rawXff.length > 0 && typeof rawXff[0] === "string") {
          ip = rawXff[0].split(",")[0].trim();
        }
        return ip || req.ip || req.socket?.remoteAddress || "unknown";
      } catch {
        return "unknown";
      }
    }
  } = options;
  const hits = /* @__PURE__ */ new Map();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1e3);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = hits.get(key);
    if (!record || record.resetTime <= now) {
      hits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1e3));
      return next();
    }
    if (record.count >= maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1e3));
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1e3));
      return res.status(429).json({ error: message });
    }
    record.count++;
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1e3));
    return next();
  };
}
var loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 15,
  // 15 login attempts per 15 min
  message: "Too many login attempts. Please try again after 15 minutes."
});
var uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  maxRequests: 30,
  // 30 uploads per minute
  message: "Upload rate limit exceeded. Please wait a moment before uploading again."
});
var apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  maxRequests: 180,
  // 180 requests per minute
  message: "Too many API requests. Please slow down."
});
function securityHeadersMiddleware(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://identitytoolkit.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://ik.imagekit.io https://*.googleusercontent.com https://images.unsplash.com",
    "media-src 'self' data: blob: https://ik.imagekit.io https://actions.google.com https://cdn.pixabay.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://upload.imagekit.io https://ik.imagekit.io wss://*.firebaseio.com",
    "frame-src 'self' https://*.firebaseapp.com https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.removeHeader("X-Powered-By");
  return next();
}
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  return next();
}

// server/appFactory.ts
function createExpressApp() {
  const app2 = express();
  app2.set("trust proxy", 1);
  app2.use(securityHeadersMiddleware);
  app2.use(corsMiddleware);
  app2.use(express.json({ limit: "20mb" }));
  app2.use(express.urlencoded({ limit: "20mb", extended: true }));
  app2.use(
    "/uploads",
    express.static(path3.join(process.cwd(), "data", "uploads"), {
      dotfiles: "ignore",
      index: false,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    })
  );
  const apiRouter = express.Router();
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });
  apiRouter.use(apiRateLimiter);
  apiRouter.post("/admin/login", loginRateLimiter, handleAdminLogin);
  apiRouter.get("/upload/imagekit-auth", authenticateAdmin, handleImageKitAuth);
  apiRouter.post(
    "/upload/audio",
    authenticateAdmin,
    uploadRateLimiter,
    uploadAudioMiddleware.single("audio"),
    handleAudioUpload
  );
  apiRouter.get("/audio/tracks", handleGetAudioTracks);
  apiRouter.delete("/audio/tracks/:id", authenticateAdmin, handleDeleteAudioTrack);
  apiRouter.post(
    "/upload/media",
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.array("files", 20),
    handleMediaUpload
  );
  apiRouter.post(
    "/upload/video",
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single("video"),
    handleMediaUpload
  );
  apiRouter.post(
    "/upload/image",
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single("image"),
    handleMediaUpload
  );
  apiRouter.get("/birthday/settings", handleGetBirthdaySettings);
  apiRouter.put("/birthday/settings", authenticateAdmin, handleUpdateBirthdaySettings);
  app2.use("/api", apiRouter);
  app2.use(apiRouter);
  app2.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
  });
  app2.use((err, req, res, next) => {
    console.error("API Error handler:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });
  return app2;
}

// server/serverless.ts
var app = createExpressApp();
function handler(req, res) {
  return app(req, res);
}
export {
  app,
  handler as default
};
