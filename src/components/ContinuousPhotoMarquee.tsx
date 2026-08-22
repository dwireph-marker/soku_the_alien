import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Calendar, MapPin, Plus, Sparkles, ZoomIn, Image as ImageIcon, Trash2, ChevronLeft, ChevronRight, Pencil, X, Video as VideoIcon, Film } from 'lucide-react';
import { MemoryPhoto } from '../types';
import { romanticAudio } from '../utils/audio';
import { AddMemoryModal } from './marquee/AddMemoryModal';
import { EditMemoryModal } from './marquee/EditMemoryModal';
import { LightboxModal } from './marquee/LightboxModal';
import { PhotoCardItem } from './marquee/PhotoCardItem';
import { DeleteConfirmDialog } from './marquee/DeleteConfirmDialog';
import { RevealSection } from './common/RevealSection';

interface ContinuousPhotoMarqueeProps {
  photos: MemoryPhoto[];
  onAddPhoto: (photo: MemoryPhoto) => void;
  onAddPhotosBatch?: (photos: MemoryPhoto[]) => void;
  onDeletePhoto?: (photoId: string) => void;
  onEditPhoto?: (photo: MemoryPhoto) => void;
  soundFxEnabled?: boolean;
  isMidnightTheme?: boolean;
}

export const ContinuousPhotoMarquee: React.FC<ContinuousPhotoMarqueeProps> = ({
  photos,
  onAddPhoto,
  onAddPhotosBatch,
  onDeletePhoto,
  onEditPhoto,
  soundFxEnabled = true,
  isMidnightTheme = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<MemoryPhoto | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<MemoryPhoto | null>(null);
  const [pendingDeletePhoto, setPendingDeletePhoto] = useState<MemoryPhoto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const displayPhotos = photos.length > 0 ? [...photos, ...photos, ...photos] : [];
  const videoCount = photos.filter((p) => p.mediaType === 'video' || (p.url && /\.(mp4|webm|mov)$/i.test(p.url))).length;
  const photoCount = photos.length - videoCount;

  React.useEffect(() => {
    if (sliderRef.current && photos.length > 0) {
      const container = sliderRef.current;
      requestAnimationFrame(() => {
        const singleSetWidth = container.scrollWidth / 3;
        if (singleSetWidth > 0) {
          container.scrollLeft = singleSetWidth;
        }
      });
    }
  }, [photos]);

  const handleScroll = () => {
    if (!sliderRef.current || isDragging) return;
    const container = sliderRef.current;
    const singleSetWidth = container.scrollWidth / 3;
    if (singleSetWidth <= 0) return;

    if (container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft -= singleSetWidth;
    } else if (container.scrollLeft <= 10) {
      container.scrollLeft += singleSetWidth;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!sliderRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      sliderRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftPos(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const container = sliderRef.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) setHasMoved(true);
    container.scrollLeft = scrollLeftPos - walk;

    const singleSetWidth = container.scrollWidth / 3;
    if (singleSetWidth > 0) {
      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft -= singleSetWidth;
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeftPos(container.scrollLeft);
      } else if (container.scrollLeft <= 10) {
        container.scrollLeft += singleSetWidth;
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeftPos(container.scrollLeft);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const amount = direction === 'left' ? -340 : 340;
    sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    if (soundFxEnabled) romanticAudio.playPopSound();
  };

  const handleStartEdit = (photo: MemoryPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPhoto(photo);
    if (soundFxEnabled) romanticAudio.playPopSound();
  };

  const handleSaveEdit = (e: React.FormEvent, updated: MemoryPhoto) => {
    e.preventDefault();
    if (onEditPhoto) onEditPhoto(updated);
    if (selectedPhoto?.id === updated.id) setSelectedPhoto(updated);
    setEditingPhoto(null);
    if (soundFxEnabled) romanticAudio.playPopSound();
  };

  const handleDelete = (photoId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetPhoto = photos.find(p => p.id === photoId) || { id: photoId, title: 'Selected Memory', url: '' };
    setPendingDeletePhoto(targetPhoto as MemoryPhoto);
  };

  const confirmDelete = () => {
    if (!pendingDeletePhoto) return;
    const photoId = pendingDeletePhoto.id;
    const photoTitle = pendingDeletePhoto.title || 'Memory';

    if (onDeletePhoto) onDeletePhoto(photoId);
    if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    if (editingPhoto?.id === photoId) setEditingPhoto(null);
    if (soundFxEnabled) romanticAudio.playPopSound();

    setPendingDeletePhoto(null);

    setToastMessage(`"${photoTitle}" was successfully deleted from your memory reel! ✨`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (soundFxEnabled) romanticAudio.playPopSound();
    setLikesMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <RevealSection id="photos">
      <section
        className={`py-20 sm:py-28 relative overflow-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#030213] text-indigo-50' : 'bg-[#0a0502] text-amber-50'
        }`}
      >
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 text-center relative z-10">
          <div className="reveal-stagger-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-[0.4em] mb-4">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>Cinematic Memory Reel</span>
          </div>

          <h2 className="reveal-stagger-2 text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-100 to-rose-200 tracking-tight">
            Our Journey in Motion
          </h2>

          <p className="reveal-stagger-3 text-xs sm:text-sm text-stone-300 mt-2.5 max-w-lg mx-auto leading-relaxed font-sans">
            Every snapshot and short video captures a memory with you. Swipe, drag, or click to watch our favorite moments together 📸 ✨
          </p>

          {photos.length > 0 && (
            <div className="reveal-stagger-3 mt-4 flex items-center justify-center gap-3 text-xs text-rose-300/80 font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/20">
                <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
              </span>
              {videoCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/20">
                  <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
                  {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
                </span>
              )}
            </div>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="max-w-md mx-auto my-6 px-6 py-12 text-center bg-white/5 border border-dashed border-white/20 rounded-3xl backdrop-blur-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif italic font-semibold text-white mb-2">
              Your Memory Reel is Ready
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mb-2 leading-relaxed">
              There are no photos or videos yet. Use the Admin Dashboard to add your special memories!
            </p>
          </div>
        ) : (
          <div className="reveal-stagger-4 relative w-full py-4 group">
            <button
              onClick={() => scrollByAmount('left')}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-rose-600 border border-white/20 text-white backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95"
              aria-label="Previous photos"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollByAmount('right')}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/70 hover:bg-rose-600 border border-white/20 text-white backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95"
              aria-label="Next photos"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#030213] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#030213] to-transparent z-10 pointer-events-none" />

            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onScroll={handleScroll}
              onWheel={handleWheel}
              className={`flex gap-6 sm:gap-8 overflow-x-auto px-12 sm:px-24 py-4 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayPhotos.map((photo, index) => (
                <PhotoCardItem
                  key={`${photo.id}-${index}`}
                  photo={photo}
                  index={index}
                  likes={likesMap[photo.id] || 0}
                  hasMoved={hasMoved}
                  onSelectPhoto={(p) => {
                    setSelectedPhoto(p);
                    if (soundFxEnabled) romanticAudio.playPopSound();
                  }}
                  onStartEdit={handleStartEdit}
                  onDelete={handleDelete}
                  onLike={handleLike}
                />
              ))}
            </div>
          </div>
        )}

        <LightboxModal
          selectedPhoto={selectedPhoto}
          allPhotos={photos}
          onClose={() => setSelectedPhoto(null)}
          onSelectPhoto={(p) => setSelectedPhoto(p)}
          onStartEdit={handleStartEdit}
          onDelete={handleDelete}
          onLike={handleLike}
          likesCount={selectedPhoto ? likesMap[selectedPhoto.id] || 0 : 0}
        />

        <EditMemoryModal
          editingPhoto={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
        />

        <AddMemoryModal
          isOpen={isAddingModalOpen}
          onClose={() => setIsAddingModalOpen(false)}
          onAddPhoto={(p) => {
            onAddPhoto(p);
            if (soundFxEnabled) romanticAudio.playFanfare();
          }}
          onAddPhotosBatch={(pList) => {
            if (onAddPhotosBatch) {
              onAddPhotosBatch(pList);
            } else {
              pList.forEach((p) => onAddPhoto(p));
            }
            if (soundFxEnabled) romanticAudio.playFanfare();
          }}
        />

        <DeleteConfirmDialog
          pendingDeletePhoto={pendingDeletePhoto}
          toastMessage={toastMessage}
          onCancelDelete={() => setPendingDeletePhoto(null)}
          onConfirmDelete={confirmDelete}
          onCloseToast={() => setToastMessage(null)}
        />
      </section>
    </RevealSection>
  );
};

