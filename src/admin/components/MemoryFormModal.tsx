import React from 'react';
import { MemoryPhoto } from '../../types';
import { ImageUploader } from './ImageUploader';
import { X } from 'lucide-react';
import { sanitizeImageUrl, FALLBACK_IMAGE_URL } from '../../utils/imageUtils';

interface BatchItem {
  url: string;
  title: string;
}

interface MemoryFormModalProps {
  isOpen: boolean;
  editingPhoto: MemoryPhoto | null;
  uploadedUrl: string;
  setUploadedUrl: (url: string) => void;
  setUploadedFileId: (fileId: string) => void;
  batchItems: BatchItem[];
  setBatchItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  title: string;
  setTitle: (title: string) => void;
  date: string;
  setDate: (date: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  caption: string;
  setCaption: (cap: string) => void;
  likes: number;
  setLikes: (likes: number) => void;
  mediaType?: 'image' | 'video';
  setMediaType?: (type: 'image' | 'video') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const MemoryFormModal: React.FC<MemoryFormModalProps> = ({
  isOpen,
  editingPhoto,
  uploadedUrl,
  setUploadedUrl,
  setUploadedFileId,
  batchItems,
  setBatchItems,
  title,
  setTitle,
  date,
  setDate,
  location,
  setLocation,
  caption,
  setCaption,
  likes,
  setLikes,
  mediaType = 'image',
  setMediaType,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-lg font-bold text-stone-100">
          {editingPhoto
            ? `Edit Memory ${mediaType === 'video' ? 'Video' : 'Photo'}`
            : batchItems.length > 1
            ? `Upload ${batchItems.length} Memories`
            : `Upload New Memory ${mediaType === 'video' ? 'Video' : 'Photo'}`}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {!editingPhoto && (
            <ImageUploader
              defaultUrl={uploadedUrl}
              multiple={true}
              onUploaded={(url, fileId, type) => {
                setUploadedUrl(url);
                if (fileId) setUploadedFileId(fileId);
                if (setMediaType && type) setMediaType(type);
              }}
              onMultipleUploaded={(items) => {
                setBatchItems(items);
                if (items.length > 0) {
                  setUploadedUrl(items[0].url);
                }
              }}
            />
          )}

          {/* Media Type toggle */}
          {setMediaType && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Media Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    mediaType === 'image'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  📷 Photo
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                    mediaType === 'video'
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  🎥 Video
                </button>
              </div>
            </div>
          )}

          {/* Batch items list if multiple photos were uploaded */}
          {!editingPhoto && batchItems.length > 1 && (
            <div className="space-y-2 p-3 bg-stone-950 rounded-2xl border border-stone-800">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Selected Photos ({batchItems.length})</span>
                <span className="text-[10px] text-stone-400 font-normal">Edit titles below</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {batchItems.map((item, idx) => (
                  <div key={idx} className="relative bg-stone-900 border border-stone-800 rounded-xl p-1.5 flex flex-col gap-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <img
                        src={sanitizeImageUrl(item.url)}
                        alt={item.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                        }}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = batchItems.filter((_, i) => i !== idx);
                          setBatchItems(updated);
                          if (updated.length > 0) setUploadedUrl(updated[0].url);
                        }}
                        className="absolute top-1 right-1 p-1 bg-rose-600 rounded-full text-white hover:bg-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...batchItems];
                        updated[idx].title = e.target.value;
                        setBatchItems(updated);
                      }}
                      className="bg-stone-950 border border-stone-800 rounded px-1.5 py-0.5 text-[10px] text-stone-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(batchItems.length <= 1 || editingPhoto) && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Memory Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunset Magic Together"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Date Tag</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Aug 11, 2026"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Location Tag</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Special Place"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Romantic Caption Quote</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Another unforgettable chapter of our love story."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Likes / Send Love Counter</label>
            <input
              type="number"
              min={0}
              value={likes}
              onChange={(e) => setLikes(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs bg-stone-800 text-stone-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors"
            >
              {editingPhoto
                ? 'Save Changes'
                : batchItems.length > 1
                ? `Publish ${batchItems.length} Photos`
                : 'Publish Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
