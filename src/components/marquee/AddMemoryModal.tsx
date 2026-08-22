import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Upload, Image as ImageIcon, Images, Plus } from 'lucide-react';
import { MemoryPhoto } from '../../types';
import { SelectedItemsGrid, SelectedPhotoItem } from './SelectedItemsGrid';
import { UrlUploadSection } from './UrlUploadSection';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (photo: MemoryPhoto) => void;
  onAddPhotosBatch?: (photos: MemoryPhoto[]) => void;
  soundFxEnabled?: boolean;
}

const samplePhotoPresets = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop',
];

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAddPhoto,
  onAddPhotosBatch,
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedPhotoItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleMultipleFilesUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const url = e.target.result as string;
          const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const title = fileNameNoExt.charAt(0).toUpperCase() + fileNameNoExt.slice(1);
          const isVideo = file.type.startsWith('video/');

          setSelectedItems(prev => [
            ...prev,
            {
              id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              url,
              title: title || (isVideo ? 'Precious Video Memory' : 'Precious Memory'),
              mediaType: isVideo ? 'video' : 'image',
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMultipleFilesUpload(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleAddPreset = (presetUrl: string, index: number) => {
    setSelectedItems(prev => [
      ...prev,
      {
        id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: presetUrl,
        title: `Romantic Memory #${index + 1}`,
      }
    ]);
  };

  const handleAddCustomUrl = () => {
    if (!newUrl) return;
    setSelectedItems(prev => [
      ...prev,
      {
        id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: newUrl,
        title: newTitle || 'Special Memory',
      }
    ]);
    setNewUrl('');
    setNewTitle('');
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemTitle = (id: string, title: string) => {
    setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, title } : item));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let itemsToSave = [...selectedItems];

    if (itemsToSave.length === 0 && newUrl) {
      itemsToSave.push({
        id: `url-${Date.now()}`,
        url: newUrl,
        title: newTitle || 'Our Special Memory',
      });
    }

    if (itemsToSave.length === 0) return;

    itemsToSave.forEach((item, index) => {
      const newPhoto: MemoryPhoto = {
        id: `photo-${Date.now()}-${index}`,
        title: item.title || newTitle || `Special Memory #${index + 1}`,
        url: item.url,
        mediaType: item.mediaType,
        caption: newCaption || 'Another unforgettable chapter of our love story.',
      };
      onAddPhoto(newPhoto);
    });

    setSelectedItems([]);
    setNewTitle('');
    setNewUrl('');
    setNewCaption('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0502] border border-orange-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-amber-50 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-orange-400 font-serif italic font-bold text-2xl mb-1">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span>Add Special Memories</span>
            </div>
            <p className="text-xs text-stone-400 mb-5">
              Select one or multiple photos to add to our continuous sliding memory gallery!
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    uploadMode === 'file'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload From Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    uploadMode === 'url'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image URL / Presets</span>
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-stone-300 mb-1">
                    Select Photos or Videos (Multiple Allowed) *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-white/20 hover:border-orange-500/60 rounded-2xl p-5 text-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <Images className="w-8 h-8 mx-auto text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-semibold text-stone-200 mb-0.5">
                      Click to choose photo(s) from your device
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Hold Shift or Ctrl/Cmd to select multiple photos at once
                    </p>
                  </div>
                </div>
              ) : (
                <UrlUploadSection
                  newUrl={newUrl}
                  setNewUrl={setNewUrl}
                  handleAddCustomUrl={handleAddCustomUrl}
                  handleAddPreset={handleAddPreset}
                  samplePhotoPresets={samplePhotoPresets}
                />
              )}

              <SelectedItemsGrid
                selectedItems={selectedItems}
                fileInputRef={fileInputRef}
                onRemoveItem={handleRemoveItem}
                onUpdateItemTitle={handleUpdateItemTitle}
              />

              {selectedItems.length <= 1 && (
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-stone-300 mb-1">Default Memory Title</label>
                  <input
                    type="text"
                    value={newTitle || ''}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Our Cozy Visit"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-stone-300 mb-1">Sweet Memory Note</label>
                <textarea
                  rows={2}
                  value={newCaption || ''}
                  onChange={e => setNewCaption(e.target.value)}
                  placeholder="Write a sweet sentence describing why these memories are so precious..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-stone-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={selectedItems.length === 0 && !newUrl}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium text-xs uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-lg shadow-orange-950/40 mt-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {selectedItems.length > 1
                  ? `Save All ${selectedItems.length} Photos To Memory Reel ✨`
                  : `Save Photo To Memory Reel ✨`}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
