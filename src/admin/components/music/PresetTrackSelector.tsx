import React from 'react';
import { Play, Square } from 'lucide-react';

export interface BuiltinPreset {
  id: string;
  name: string;
  url: string;
}

interface PresetTrackSelectorProps {
  builtinPresets: BuiltinPreset[];
  musicType: string;
  activeTrackId?: string;
  previewTrackId: string | null;
  onSelectPreset: (preset: BuiltinPreset) => void;
  onTogglePreview: (id: string, type: string, url: string, name: string, e?: React.MouseEvent) => void;
}

export const PresetTrackSelector: React.FC<PresetTrackSelectorProps> = ({
  builtinPresets,
  musicType,
  activeTrackId,
  previewTrackId,
  onSelectPreset,
  onTogglePreview,
}) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-300 mb-2">Preset Audio Tracks</label>
      <div className="space-y-2">
        {builtinPresets.map((p) => {
          const isSelected =
            (activeTrackId && activeTrackId === p.id) ||
            (!activeTrackId && musicType === p.id);
          const isPreviewing = previewTrackId === p.id;
          return (
            <label
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-stone-950 border-stone-800 hover:border-amber-500/40'
              }`}
            >
              <span className="text-xs text-stone-200 flex items-center gap-2 font-semibold">
                <input
                  type="radio"
                  name="activeAudioTrack"
                  value={p.id}
                  checked={isSelected}
                  onChange={() => onSelectPreset(p)}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                {p.name}
              </span>

              <button
                type="button"
                onClick={(e) => onTogglePreview(p.id, p.id, p.url, p.name, e)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPreviewing
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 animate-pulse'
                    : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/30'
                }`}
                title={isPreviewing ? 'Stop playback' : 'Listen to preview'}
              >
                {isPreviewing ? <Square className="w-3 h-3 text-stone-950 fill-stone-950" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPreviewing ? 'Stop' : 'Listen'}</span>
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
};
