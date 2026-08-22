import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');
const IMAGES_DIR = path.join(UPLOAD_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOAD_DIR, 'videos');
const METADATA_FILE = path.join(process.cwd(), 'data', 'audio_tracks.json');

// Ensure directories exist safely
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
  // In serverless environments like Vercel, the local disk may be read-only
  console.warn('Note: Local upload directories cannot be created in read-only environment:', err);
}

export interface StoredAudioTrack {
  id: string;
  name: string;
  url: string;
  type: 'uploaded' | 'preset' | 'custom';
  originalFilename?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  dateAdded: string;
  createdAt: string;
  isActive?: boolean;
}

function loadTracksMetadata(): StoredAudioTrack[] {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading audio tracks metadata:', err);
  }
  return [];
}

function saveTracksMetadata(tracks: StoredAudioTrack[]): void {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(tracks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing audio tracks metadata:', err);
  }
}

// Multer storage configuration for audio
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const baseName = path.basename(file.originalname, ext);
    const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadAudioMiddleware = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isAudioMime = file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream';
    if (allowedExtensions.includes(ext) && isAudioMime) {
      cb(null, true);
    } else {
      cb(new Error('Only safe audio formats are permitted (.mp3, .wav, .ogg, .m4a, .aac, .flac)'));
    }
  },
});

// Verify file signatures (magic bytes) to prevent polyglots / masked executables
function isValidFileSignature(filePath: string, expectedCategory: 'audio' | 'image' | 'video'): boolean {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toLowerCase();

    if (expectedCategory === 'image') {
      // JPEG: ffd8ff
      if (hex.startsWith('ffd8ff')) return true;
      // PNG: 89504e470d0a1a0a
      if (hex.startsWith('89504e470d0a1a0a')) return true;
      // GIF: 47494638
      if (hex.startsWith('47494638')) return true;
      // WebP: RIFF....WEBP (52494646....57454250)
      if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString() === 'WEBP') return true;
      // BMP: 424d
      if (hex.startsWith('424d')) return true;
      // HEIC / AVIF: ....ftyp (66747970)
      if (buffer.subarray(4, 8).toString() === 'ftyp') return true;
      return false;
    }

    if (expectedCategory === 'audio') {
      // ID3 (MP3): 494433
      if (hex.startsWith('494433')) return true;
      // MP3 frame sync: fffb, fff3, fff2, ffe3
      if (hex.startsWith('fffb') || hex.startsWith('fff3') || hex.startsWith('fff2') || hex.startsWith('ffe3')) return true;
      // WAV: RIFF....WAVE (52494646....57415645)
      if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString() === 'WAVE') return true;
      // OGG: 4f676753
      if (hex.startsWith('4f676753')) return true;
      // FLAC: 664c6143
      if (hex.startsWith('664c6143')) return true;
      // M4A / AAC (ftyp): ....ftyp (66747970)
      if (buffer.subarray(4, 8).toString() === 'ftyp') return true;
      // WebM audio: 1a45dfa3
      if (hex.startsWith('1a45dfa3')) return true;
      return false;
    }

    if (expectedCategory === 'video') {
      // MP4 / MOV: ....ftyp (66747970) or ....moov
      if (buffer.subarray(4, 8).toString() === 'ftyp' || buffer.subarray(4, 8).toString() === 'moov') return true;
      // WebM / MKV: 1a45dfa3
      if (hex.startsWith('1a45dfa3')) return true;
      // OGG / Theora: 4f676753
      if (hex.startsWith('4f676753')) return true;
      return false;
    }

    return false;
  } catch (err) {
    return false;
  }
}

export function handleAudioUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    // Verify magic bytes
    if (!isValidFileSignature(file.path, 'audio')) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      return res.status(400).json({ success: false, error: 'Uploaded file signature is invalid or corrupted' });
    }

    const rawSongName = (req.body?.songName as string) || 
      path.basename(file.originalname, path.extname(file.originalname)).replace(/[-_]/g, ' ');
    const songName = rawSongName.replace(/[<>]/g, '').trim().slice(0, 100);

    const publicUrl = `/uploads/audio/${file.filename}`;
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const track: StoredAudioTrack = {
      id: trackId,
      name: songName,
      url: publicUrl,
      type: 'uploaded',
      originalFilename: file.originalname.slice(0, 100),
      filename: file.filename,
      mimeType: file.mimetype || 'audio/mpeg',
      size: file.size,
      dateAdded: now.toLocaleDateString(),
      createdAt: now.toISOString(),
      isActive: true,
    };

    const currentTracks = loadTracksMetadata();
    currentTracks.unshift(track);
    saveTracksMetadata(currentTracks);

    return res.json({
      success: true,
      track,
      tracks: currentTracks,
    });
  } catch (error: any) {
    console.error('Audio upload handler error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to process audio upload' });
  }
}

export function handleGetAudioTracks(_req: Request, res: Response) {
  try {
    const tracks = loadTracksMetadata();
    return res.json({ success: true, tracks });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve audio tracks' });
  }
}

export function handleDeleteAudioTrack(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ success: false, error: 'Invalid track ID' });
    }

    const tracks = loadTracksMetadata();
    const trackToDelete = tracks.find((t) => t.id === id);
    const updatedTracks = tracks.filter((t) => t.id !== id);

    if (trackToDelete && trackToDelete.filename) {
      const safeFilename = path.basename(trackToDelete.filename);
      const filePath = path.resolve(AUDIO_DIR, safeFilename);
      // Path traversal verification check
      if (filePath.startsWith(AUDIO_DIR) && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete physical audio file:', e);
        }
      }
    }

    saveTracksMetadata(updatedTracks);

    return res.json({
      success: true,
      deletedId: id,
      tracks: updatedTracks,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete audio track' });
  }
}

// Media (Photos and Videos) Storage configuration
const mediaStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
    cb(null, isVideo ? VIDEOS_DIR : IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const baseName = path.basename(file.originalname, ext);
    const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadMediaMiddleware = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    // Explicitly exclude SVG to prevent Stored XSS attacks
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.avif'];
    const allowedVideoExts = ['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.3gp', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    const isImage = (file.mimetype.startsWith('image/') || allowedImageExts.includes(ext)) && ext !== '.svg' && file.mimetype !== 'image/svg+xml';
    const isVideo = file.mimetype.startsWith('video/') || allowedVideoExts.includes(ext);

    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only safe raster images (.jpg, .png, .webp, etc.) and video files are permitted (.mp4, .webm, .mov)'));
    }
  },
});

export function handleMediaUpload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const singleFile = req.file;

    if (!singleFile && (!files || files.length === 0)) {
      return res.status(400).json({ success: false, error: 'No media file uploaded' });
    }

    if (singleFile) {
      const isVideo = singleFile.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(singleFile.originalname);
      const category = isVideo ? 'video' : 'image';

      if (!isValidFileSignature(singleFile.path, category)) {
        try {
          fs.unlinkSync(singleFile.path);
        } catch {}
        return res.status(400).json({ success: false, error: `Uploaded ${category} file signature is invalid or corrupted` });
      }

      const publicUrl = isVideo ? `/uploads/videos/${singleFile.filename}` : `/uploads/images/${singleFile.filename}`;
      const fileId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      return res.json({
        success: true,
        url: publicUrl,
        fileId,
        mediaType: isVideo ? 'video' : 'image',
        filename: singleFile.filename,
        originalFilename: singleFile.originalname,
        size: singleFile.size,
        mimeType: singleFile.mimetype,
      });
    }

    if (files && files.length > 0) {
      // Validate all files
      for (const file of files) {
        const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
        const category = isVideo ? 'video' : 'image';
        if (!isValidFileSignature(file.path, category)) {
          // Cleanup uploaded batch
          for (const f of files) {
            try {
              fs.unlinkSync(f.path);
            } catch {}
          }
          return res.status(400).json({ success: false, error: `One or more uploaded ${category} files had invalid signatures` });
        }
      }

      const results = files.map((file, idx) => {
        const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp|mkv)$/i.test(file.originalname);
        const publicUrl = isVideo ? `/uploads/videos/${file.filename}` : `/uploads/images/${file.filename}`;
        const fileId = `media_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const cleanTitle = path.basename(file.originalname, path.extname(file.originalname)).replace(/[-_]/g, ' ');

        return {
          url: publicUrl,
          fileId,
          title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
          mediaType: isVideo ? 'video' : 'image',
          size: file.size,
        };
      });

      return res.json({
        success: true,
        items: results,
        url: results[0].url,
        fileId: results[0].fileId,
      });
    }

    return res.status(400).json({ success: false, error: 'No files received' });
  } catch (error: any) {
    console.error('Media upload handler error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to process media upload' });
  }
}

