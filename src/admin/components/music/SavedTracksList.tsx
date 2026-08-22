import React from 'react';
import { Folder, Volume2, Play, Square, Trash2 } from 'lucide-react';

export interface SavedTrack {
  id: string;
  name: string;
  url: string;
  type?: string;
  originalFilename?: string;
  mimeType?: string;
  dateAdded?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface SavedTracksListProps {
  savedTracks: SavedTrack[];
  musicType: string;
  customUrl: string;
  activeTrackId?: string;
  previewTrackId: string | null;
  onSelectTrack: (track: SavedTrack) => void;
  onTogglePreview: (id: string, type: string, url: string, name: string, e?: React.MouseEvent) => void;
  onDeleteTrack: (id: string, e: React.MouseEvent) => void;
}

export const SavedTracksList: React.FC<SavedTracksListProps> = ({
  savedTracks,
  musicType,
  customUrl,
  activeTrackId,
  previewTrackId,
  onSelectTrack,
  onTogglePreview,
  onDeleteTrack,
}) => {
  if (!savedTracks || savedTracks.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
        <Folder className="w-4 h-4 text-amber-400" />
        Saved Uploaded Audio Tracks ({savedTracks.length})
      </label>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {savedTracks.map((track) => {
          const isSelected =
            (activeTrackId && activeTrackId === track.id) ||
            (musicType === 'custom' && customUrl === track.url);
          const isPreviewing = previewTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 text-stone-100 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <input
                  type="radio"
                  name="activeAudioTrack"
                  checked={isSelected}
                  onChange={() => onSelectTrack(track)}
                  className="accent-amber-500 shrink-0 w-4 h-4 cursor-pointer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-stone-100">{track.name}</p>
                  <p className="text-[10px] text-stone-400">
                    Added {track.dateAdded || 'Recently'} • {track.type === 'uploaded' ? 'Local Upload' : 'Custom Audio'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => onTogglePreview(track.id, 'custom', track.url, track.name, e)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isPreviewing
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md shadow-amber-500/30 animate-pulse'
                      : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/30'
                  }`}
                  title={isPreviewing ? 'Stop audio preview' : 'Listen to this track'}
                >
                  {isPreviewing ? (
                    <>
                      <Square className="w-3 h-3 text-stone-950 fill-stone-950" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => onDeleteTrack(track.id, e)}
                  title="Delete saved track"
                  className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
