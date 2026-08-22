import React, { useState, useRef, useEffect } from 'react';
import { Save, Music, Sparkles } from 'lucide-react';
import { SiteConfig } from '../../types';
import { romanticAudio } from '../../utils/audio';
import { PresetTrackSelector, BuiltinPreset } from '../components/music/PresetTrackSelector';
import { SavedTracksList, SavedTrack } from '../components/music/SavedTracksList';
import { AudioUploaderBox } from '../components/music/AudioUploaderBox';
import { useAudioUpload } from '../hooks/useAudioUpload';

interface MusicPageProps {
  config: SiteConfig | null;
  onSaveMusic: (musicData: Partial<SiteConfig>) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MusicPage: React.FC<MusicPageProps> = ({
  config,
  onSaveMusic,
  showToast,
}) => {
  const [enabled, setEnabled] = useState(config?.bgMusicEnabled ?? true);
  const [musicType, setMusicType] = useState<string>(config?.bgMusicType || 'birthday');
  const [customUrl, setCustomUrl] = useState(config?.bgMusicCustomUrl || '');
  const [customName, setCustomName] = useState(config?.bgMusicCustomName || '');
  const [activeTrackId, setActiveTrackId] = useState<string>(config?.activeTrackId || '');
  const [soundFxEnabled, setSoundFxEnabled] = useState(config?.soundFxEnabled ?? true);
  const [saving, setSaving] = useState(false);

  // Audio Preview state in admin
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  // Saved Custom Uploaded Audio Tracks
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>(config?.customAudioTracks || []);

  const [dragActive, setDragActive] = useState(false);
  const [manualUrlMode, setManualUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const builtinPresets: BuiltinPreset[] = [
    {
      id: 'birthday',
      name: '🎂 Romantic Piano Birthday',
      url: '',
    },
    {
      id: 'piano',
      name: '🎹 Soft Acoustic Love Song',
      url: '',
    },
    {
      id: 'elise',
      name: '🎼 Classical Piano - Für Elise',
      url: '',
    },
    {
      id: 'lofi',
      name: '✨ Built-in Web Audio Synthesizer (100% Offline)',
      url: '',
    },
  ];

  // Sync state when config updates
  useEffect(() => {
    if (config) {
      setEnabled(config.bgMusicEnabled ?? true);
      setMusicType(config.bgMusicType || 'birthday');
      setCustomUrl(config.bgMusicCustomUrl || '');
      setCustomName(config.bgMusicCustomName || '');
      setActiveTrackId(config.activeTrackId || '');
      if (Array.isArray(config.customAudioTracks) && config.customAudioTracks.length > 0) {
        setSavedTracks(config.customAudioTracks as SavedTrack[]);
      }
      setSoundFxEnabled(config.soundFxEnabled ?? true);
    }
  }, [config]);

  // Fetch backend audio tracks on mount to ensure local server uploads are listed
  useEffect(() => {
    async function fetchServerTracks() {
      try {
        const res = await fetch('/api/audio/tracks');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.tracks)) {
            setSavedTracks((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const merged = [...prev];
              for (const serverTrack of data.tracks) {
                if (!existingIds.has(serverTrack.id)) {
                  merged.push(serverTrack);
                }
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch audio tracks from server:', err);
      }
    }
    fetchServerTracks();
  }, []);

  const { uploading, progress, uploadError, handleAudioFileSelect } = useAudioUpload({
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
  });

  useEffect(() => {
    return () => {
      romanticAudio.stopMusic();
    };
  }, []);

  const handleTogglePreview = (id: string, type: string, url: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (previewTrackId === id) {
      romanticAudio.stopMusic();
      setPreviewTrackId(null);
    } else {
      romanticAudio.stopMusic();
      romanticAudio.startMusic({
        type: (type as any) || 'custom',
        url: url,
        name: name,
      });
      setPreviewTrackId(id);
    }
  };

  const handleSelectSavedTrack = async (track: SavedTrack) => {
    setActiveTrackId(track.id);
    setMusicType('custom');
    setCustomUrl(track.url);
    setCustomName(track.name);

    await onSaveMusic({
      bgMusicEnabled: enabled,
      bgMusicType: 'custom',
      bgMusicPresetUrl: track.url,
      bgMusicCustomUrl: track.url,
      bgMusicCustomName: track.name,
      activeTrackId: track.id,
      customAudioTracks: savedTracks,
      soundFxEnabled,
    });

    showToast(`"${track.name}" is now the active birthday soundtrack!`, 'success');
  };

  const handleSelectPreset = async (preset: BuiltinPreset) => {
    setActiveTrackId(preset.id);
    setMusicType(preset.id);
    setCustomUrl(preset.url);
    setCustomName(preset.name);

    await onSaveMusic({
      bgMusicEnabled: enabled,
      bgMusicType: preset.id as any,
      bgMusicPresetUrl: preset.url,
      bgMusicCustomUrl: preset.url,
      bgMusicCustomName: preset.name,
      activeTrackId: preset.id,
      customAudioTracks: savedTracks,
      soundFxEnabled,
    });

    showToast(`"${preset.name}" is now the active soundtrack!`, 'success');
  };

  const handleAddManualUrl = async () => {
    if (!customUrl.trim()) return;
    const trackName = customName.trim() || 'Custom Audio Track';
    const newTrackId = 'track_' + Date.now();
    const newTrack: SavedTrack = {
      id: newTrackId,
      name: trackName,
      url: customUrl.trim(),
      type: 'custom',
      dateAdded: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    const updatedTracks = [newTrack, ...savedTracks.filter((t) => t.url !== customUrl.trim())];
    setSavedTracks(updatedTracks);
    setMusicType('custom');
    setActiveTrackId(newTrackId);

    await onSaveMusic({
      bgMusicEnabled: enabled,
      bgMusicType: 'custom',
      bgMusicPresetUrl: customUrl.trim(),
      bgMusicCustomUrl: customUrl.trim(),
      bgMusicCustomName: trackName,
      activeTrackId: newTrackId,
      customAudioTracks: updatedTracks,
      soundFxEnabled,
    });

    showToast(`Saved and activated "${trackName}"!`, 'success');
  };

  const handleDeleteSavedTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewTrackId === id) {
      romanticAudio.stopMusic();
      setPreviewTrackId(null);
    }

    const trackToDelete = savedTracks.find((t) => t.id === id);
    const updatedTracks = savedTracks.filter((t) => t.id !== id);
    setSavedTracks(updatedTracks);

    // Call server to delete file from disk if local upload
    try {
      const headers: Record<string, string> = {};
      const { auth } = await import('../../lib/firebase/client');
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }
      await fetch(`/api/audio/tracks/${id}`, { method: 'DELETE', headers });
    } catch (err) {
      console.warn('Error deleting track on backend:', err);
    }

    let nextUrl = customUrl;
    let nextName = customName;
    let nextType = musicType;
    let nextActiveId = activeTrackId;

    if (activeTrackId === id || customUrl === trackToDelete?.url) {
      nextUrl = '';
      nextName = '🎂 Romantic Piano Birthday';
      nextType = 'birthday';
      nextActiveId = 'birthday';
      setCustomUrl('');
      setCustomName(nextName);
      setMusicType('birthday');
      setActiveTrackId('birthday');
    }

    await onSaveMusic({
      bgMusicEnabled: enabled,
      bgMusicType: nextType as any,
      bgMusicPresetUrl: nextUrl,
      bgMusicCustomUrl: nextUrl,
      bgMusicCustomName: nextName,
      activeTrackId: nextActiveId,
      customAudioTracks: updatedTracks,
      soundFxEnabled,
    });

    showToast('Audio track removed and configuration updated', 'info');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedBuiltin = builtinPresets.find((p) => p.id === activeTrackId || p.id === musicType);
      const selectedSaved = savedTracks.find((t) => t.id === activeTrackId || t.url === customUrl);

      let presetUrl = '';
      let resolvedCustomUrl = '';
      let resolvedName = '';
      let resolvedType = musicType;

      if (selectedSaved) {
        presetUrl = selectedSaved.url;
        resolvedCustomUrl = selectedSaved.url;
        resolvedName = selectedSaved.name;
        resolvedType = 'custom';
      } else if (selectedBuiltin) {
        presetUrl = selectedBuiltin.url;
        resolvedCustomUrl = selectedBuiltin.url;
        resolvedName = selectedBuiltin.name;
        resolvedType = selectedBuiltin.id;
      } else {
        presetUrl = customUrl;
        resolvedCustomUrl = customUrl;
        resolvedName = customName || 'Custom Soundtrack';
        resolvedType = 'custom';
      }

      await onSaveMusic({
        bgMusicEnabled: enabled,
        bgMusicType: resolvedType as any,
        bgMusicPresetUrl: presetUrl,
        bgMusicCustomUrl: resolvedCustomUrl,
        bgMusicCustomName: resolvedName,
        activeTrackId: activeTrackId || (selectedSaved ? selectedSaved.id : resolvedType),
        customAudioTracks: savedTracks,
        soundFxEnabled,
      });

      showToast('Music and audio preferences saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save music settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-stone-100">Audio & Background Music</h1>
        <p className="text-xs text-stone-400">
          Configure celebration background soundtrack, upload audio files from your device, and save preset tracks
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-200">Enable Background Music</h2>
                <p className="text-[11px] text-stone-400">Plays selected background romantic soundtrack during celebration</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <PresetTrackSelector
            builtinPresets={builtinPresets}
            musicType={musicType}
            activeTrackId={activeTrackId}
            previewTrackId={previewTrackId}
            onSelectPreset={handleSelectPreset}
            onTogglePreview={handleTogglePreview}
          />

          <SavedTracksList
            savedTracks={savedTracks}
            musicType={musicType}
            customUrl={customUrl}
            activeTrackId={activeTrackId}
            previewTrackId={previewTrackId}
            onSelectTrack={handleSelectSavedTrack}
            onTogglePreview={handleTogglePreview}
            onDeleteTrack={handleDeleteSavedTrack}
          />

          <AudioUploaderBox
            manualUrlMode={manualUrlMode}
            setManualUrlMode={setManualUrlMode}
            dragActive={dragActive}
            setDragActive={setDragActive}
            uploading={uploading}
            progress={progress}
            uploadError={uploadError}
            customUrl={customUrl}
            setCustomUrl={setCustomUrl}
            customName={customName}
            setCustomName={setCustomName}
            musicType={musicType}
            previewTrackId={previewTrackId}
            fileInputRef={fileInputRef as any}
            handleAudioFileSelect={handleAudioFileSelect}
            handleAddManualUrl={handleAddManualUrl}
            handleDrop={handleDrop}
            onTogglePreview={handleTogglePreview}
          />

          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-xs font-semibold text-stone-200">Interactive Sound Effects</h3>
                <p className="text-[10px] text-stone-400">Blow candle sound & confetti party popper FX</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundFxEnabled}
              onChange={(e) => setSoundFxEnabled(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Music Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
