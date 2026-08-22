import { useState } from 'react';
import { SavedTrack } from '../components/music/SavedTracksList';
import { uploadToImageKit } from '../../lib/imagekit';
import { auth } from '../../lib/firebase/client';
import { SiteConfig } from '../../types';

interface UseAudioUploadOptions {
  savedTracks: SavedTrack[];
  setSavedTracks: React.Dispatch<React.SetStateAction<SavedTrack[]>>;
  setCustomUrl: (url: string) => void;
  setCustomName: (name: string) => void;
  setMusicType: (type: string) => void;
  setActiveTrackId: (id: string) => void;
  enabled: boolean;
  soundFxEnabled: boolean;
  onSaveMusic: (musicData: Partial<SiteConfig>) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useAudioUpload({
  savedTracks,
  setSavedTracks,
  setCustomUrl,
  setCustomName,
  setMusicType,
  setActiveTrackId,
  enabled,
  soundFxEnabled,
  onSaveMusic,
  showToast,
}: UseAudioUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAudioFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
      setUploadError('Please select a valid audio file (.mp3, .wav, .m4a, .ogg, .aac).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Audio file size must be under 50MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(30);

    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('songName', cleanFileName);

      const headers: Record<string, string> = {};
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }

      setProgress(60);

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const rawText = await res.text();
        throw new Error(`Server response error (${res.status}): ${rawText.slice(0, 100)}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Server file upload failed (${res.status})`);
      }

      setProgress(100);

      if (data.success && data.track) {
        const newTrack: SavedTrack = {
          ...data.track,
          type: 'uploaded',
          originalFilename: file.name,
          mimeType: file.type || 'audio/mpeg',
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        const updatedTracks = [newTrack, ...savedTracks.filter((t) => t.id !== newTrack.id)];
        setSavedTracks(updatedTracks);
        setCustomUrl(newTrack.url);
        setCustomName(newTrack.name);
        setMusicType('custom');
        setActiveTrackId(newTrack.id);

        await onSaveMusic({
          bgMusicEnabled: enabled,
          bgMusicType: 'custom',
          bgMusicPresetUrl: newTrack.url,
          bgMusicCustomUrl: newTrack.url,
          bgMusicCustomName: newTrack.name,
          activeTrackId: newTrack.id,
          customAudioTracks: updatedTracks,
          soundFxEnabled,
        });

        showToast(`Uploaded & saved "${newTrack.name}" permanently as active birthday music!`, 'success');
      }
    } catch (err: any) {
      console.warn('Direct server upload error, attempting cloud storage fallback:', err);
      try {
        const result = await uploadToImageKit(file, '/audio', (p) => setProgress(p));
        const newTrack: SavedTrack = {
          id: 'track_' + Date.now(),
          name: cleanFileName,
          url: result.url,
          type: 'uploaded',
          originalFilename: file.name,
          mimeType: file.type || 'audio/mpeg',
          dateAdded: new Date().toLocaleDateString(),
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        const updatedTracks = [newTrack, ...savedTracks.filter((t) => t.id !== newTrack.id)];
        setSavedTracks(updatedTracks);
        setCustomUrl(result.url);
        setCustomName(cleanFileName);
        setMusicType('custom');
        setActiveTrackId(newTrack.id);

        await onSaveMusic({
          bgMusicEnabled: enabled,
          bgMusicType: 'custom',
          bgMusicPresetUrl: result.url,
          bgMusicCustomUrl: result.url,
          bgMusicCustomName: cleanFileName,
          activeTrackId: newTrack.id,
          customAudioTracks: updatedTracks,
          soundFxEnabled,
        });

        showToast(`Uploaded "${cleanFileName}" to cloud storage as active track!`, 'success');
      } catch (fallbackErr) {
        setUploadError('Failed to upload audio file to server. Please try a smaller audio file.');
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    progress,
    uploadError,
    handleAudioFileSelect,
  };
}
