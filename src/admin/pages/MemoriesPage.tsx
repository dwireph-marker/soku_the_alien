import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Heart, Image as ImageIcon, MapPin, Calendar, MoveUp, MoveDown } from 'lucide-react';
import { MemoryPhoto } from '../../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { MemoryFormModal } from '../components/MemoryFormModal';
import { sanitizeImageUrl, FALLBACK_IMAGE_URL } from '../../utils/imageUtils';

interface BatchItem {
  url: string;
  title: string;
}

interface MemoriesPageProps {
  photos: MemoryPhoto[];
  onAddPhoto: (photo: Partial<MemoryPhoto>) => Promise<void>;
  onEditPhoto: (id: string, updates: Partial<MemoryPhoto>) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
  photos,
  onAddPhoto,
  onEditPhoto,
  onDeletePhoto,
  showToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<MemoryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  // Form State
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedFileId, setUploadedFileId] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [likes, setLikes] = useState(0);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const resetForm = () => {
    setUploadedUrl('');
    setUploadedFileId('');
    setBatchItems([]);
    setTitle('');
    setDate('');
    setLocation('');
    setCaption('');
    setLikes(0);
    setMediaType('image');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (batchItems.length > 1) {
      try {
        for (let i = 0; i < batchItems.length; i++) {
          const item = batchItems[i];
          const cleanUrl = sanitizeImageUrl(item.url);
          const isVideoUrl = /\.(mp4|webm|ogg|mov)$/i.test(cleanUrl);
          await onAddPhoto({
            url: cleanUrl,
            imageKitFileId: uploadedFileId,
            title: item.title.trim() || `Sweet Memory #${i + 1}`,
            date: date.trim() || 'Special Day',
            location: location.trim() || 'Together',
            caption: caption.trim(),
            likes: Number(likes) || 0,
            mediaType: isVideoUrl ? 'video' : 'image',
          });
        }
        showToast(`${batchItems.length} memory photos added successfully!`, 'success');
        resetForm();
        setIsAddOpen(false);
      } catch (err) {
        showToast('Failed to add memory photos.', 'error');
      }
      return;
    }

    const targetUrl = sanitizeImageUrl(uploadedUrl || (batchItems[0]?.url));
    if (!targetUrl) {
      showToast('Please upload an image or video, or enter a URL first.', 'error');
      return;
    }

    const isVideoUrl = mediaType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(targetUrl);

    try {
      await onAddPhoto({
        url: targetUrl,
        imageKitFileId: uploadedFileId,
        title: (title || batchItems[0]?.title || 'Sweet Memory').trim(),
        date: date.trim() || 'Special Day',
        location: location.trim() || 'Together',
        caption: caption.trim(),
        likes: Number(likes) || 0,
        mediaType: isVideoUrl ? 'video' : 'image',
      });
      showToast(`Memory ${isVideoUrl ? 'video' : 'photo'} added successfully!`, 'success');
      resetForm();
      setIsAddOpen(false);
    } catch (err) {
      showToast('Failed to add memory item.', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    try {
      const cleanUrl = sanitizeImageUrl(uploadedUrl || editingPhoto.url);
      await onEditPhoto(editingPhoto.id, {
        title: title.trim(),
        date: date.trim(),
        location: location.trim(),
        caption: caption.trim(),
        likes: Number(likes) || 0,
        url: cleanUrl,
        mediaType,
      });
      showToast('Memory updated!', 'success');
      setEditingPhoto(null);
      resetForm();
    } catch (err) {
      showToast('Failed to edit memory.', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === photos.length - 1)) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...photos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      const res = await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: reordered.map(p => p.id) })
      });
      if (res.ok) {
        showToast('Memory reel reordered!', 'success');
        onEditPhoto(moved.id, {});
      }
    } catch (e) {
      showToast('Failed to reorder memories.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100">Continuous Memory Photo Reel</h1>
          <p className="text-xs text-stone-400">Manage uploaded photos, titles, locations, captions, and ImageKit assets</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Memory Photo(s)</span>
        </button>
      </div>

      {/* Grid of Photos */}
      {!photos || photos.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-3xl p-12 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-100 mb-1">No memories found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mb-6">
            Click "Upload Memory Photo(s)" to add your first memories to the continuous photo reel.
          </p>
          <button
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Memory Photo(s)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(photos || []).map((photo, idx) => {
            const cardUrl = sanitizeImageUrl(photo.url || (photo as any).imageUrl);
            return (
              <div key={photo.id} className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden flex flex-col group">
                <div className="relative aspect-video bg-stone-950">
                  <img
                    src={cardUrl}
                    alt={photo.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-amber-300 border border-amber-500/30">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>{photo.likes || 0} Likes</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-100">{photo.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1">
                      {photo.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{photo.date}</span>}
                      {photo.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{photo.location}</span>}
                    </div>
                    {photo.caption && <p className="text-xs text-stone-300 mt-2 line-clamp-2 italic font-serif">"{photo.caption}"</p>}
                  </div>

                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-xs"
                        title="Move Earlier in Reel"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === photos.length - 1}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-xs"
                        title="Move Later in Reel"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setTitle(photo.title);
                          setDate(photo.date || '');
                          setLocation(photo.location || '');
                          setCaption(photo.caption || '');
                          setLikes(photo.likes || 0);
                          setUploadedUrl(photo.url);
                          setMediaType(photo.mediaType || (/\.(mp4|webm|ogg|mov)$/i.test(photo.url) ? 'video' : 'image'));
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1 border border-amber-500/20 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setPhotoToDelete(photo.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-xs font-medium flex items-center gap-1 border border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <MemoryFormModal
        isOpen={isAddOpen || Boolean(editingPhoto)}
        editingPhoto={editingPhoto}
        uploadedUrl={uploadedUrl}
        setUploadedUrl={setUploadedUrl}
        setUploadedFileId={setUploadedFileId}
        batchItems={batchItems}
        setBatchItems={setBatchItems}
        title={title}
        setTitle={setTitle}
        date={date}
        setDate={setDate}
        location={location}
        setLocation={setLocation}
        caption={caption}
        setCaption={setCaption}
        likes={likes}
        setLikes={setLikes}
        mediaType={mediaType}
        setMediaType={setMediaType}
        onSubmit={editingPhoto ? handleUpdate : handleCreate}
        onClose={() => { setIsAddOpen(false); setEditingPhoto(null); resetForm(); }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(photoToDelete)}
        title="Delete Memory Photo"
        message="Are you sure you want to delete this photo from the memory reel? This action cannot be undone."
        onConfirm={async () => {
          if (photoToDelete) {
            await onDeletePhoto(photoToDelete);
            showToast('Photo deleted from memory reel.', 'info');
            setPhotoToDelete(null);
          }
        }}
        onClose={() => setPhotoToDelete(null)}
      />
    </div>
  );
};
