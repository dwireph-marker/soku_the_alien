import React, { RefObject } from 'react';
import { X, Plus } from 'lucide-react';
import { isVideoUrl } from '../../utils/media';

export interface SelectedPhotoItem {
  id: string;
  url: string;
  title: string;
  mediaType?: 'image' | 'video';
}

interface SelectedItemsGridProps {
  selectedItems: SelectedPhotoItem[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onRemoveItem: (id: string) => void;
  onUpdateItemTitle: (id: string, title: string) => void;
}

export const SelectedItemsGrid: React.FC<SelectedItemsGridProps> = ({
  selectedItems,
  fileInputRef,
  onRemoveItem,
  onUpdateItemTitle,
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="space-y-2 pt-1 border-t border-white/10">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wider font-semibold text-amber-300">
          Selected Items ({selectedItems.length})
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add More</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar p-1 border border-white/10 rounded-2xl bg-black/40">
        {selectedItems.map((item, idx) => {
          const isVideo = isVideoUrl(item.url, item.mediaType);
          return (
            <div key={item.id} className="relative group bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1.5 flex flex-col gap-1.5">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60">
                {isVideo ? (
                  <video src={item.url} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-[10px] shadow transition-transform hover:scale-110"
                  title="Remove item"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/70 text-amber-200 text-[9px] px-1.5 py-0.5 rounded-md font-mono">
                  #{idx + 1}
                </span>
              </div>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => onUpdateItemTitle(item.id, e.target.value)}
                placeholder="Memory title..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
