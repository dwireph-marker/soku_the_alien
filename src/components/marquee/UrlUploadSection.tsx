import React from 'react';
import { Plus } from 'lucide-react';

interface UrlUploadSectionProps {
  newUrl: string;
  setNewUrl: (url: string) => void;
  handleAddCustomUrl: () => void;
  handleAddPreset: (presetUrl: string, index: number) => void;
  samplePhotoPresets: string[];
}

export const UrlUploadSection: React.FC<UrlUploadSectionProps> = ({
  newUrl,
  setNewUrl,
  handleAddCustomUrl,
  handleAddPreset,
  samplePhotoPresets,
}) => {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-medium text-stone-300 mb-1">Add Photo by Image URL</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={newUrl || ''}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 text-xs"
        />
        <button
          type="button"
          onClick={handleAddCustomUrl}
          disabled={!newUrl}
          className="bg-orange-500/20 hover:bg-orange-500 text-orange-200 hover:text-white disabled:opacity-40 border border-orange-500/30 px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Batch</span>
        </button>
      </div>

      <div className="mt-3">
        <span className="text-[11px] text-stone-400 block mb-1 font-medium">Click to add sample romantic presets:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {samplePhotoPresets.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddPreset(preset, i)}
              className="text-[10px] bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-orange-200 px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Sample #{i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
