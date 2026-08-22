import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, X, Save, Trash2 } from 'lucide-react';
import { MemoryPhoto } from '../../types';

interface EditMemoryModalProps {
  editingPhoto: MemoryPhoto | null;
  onClose: () => void;
  onSaveEdit: (e: React.FormEvent, updatedPhoto: MemoryPhoto) => void;
  onDelete: (photoId: string) => void;
}

export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  editingPhoto,
  onClose,
  onSaveEdit,
  onDelete,
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCaption, setEditCaption] = useState('');

  useEffect(() => {
    if (editingPhoto) {
      setEditTitle(editingPhoto.title || '');
      setEditDate(editingPhoto.date || '');
      setEditLocation(editingPhoto.location || '');
      setEditCaption(editingPhoto.caption || '');
    }
  }, [editingPhoto]);

  if (!editingPhoto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEdit(e, {
      ...editingPhoto,
      title: editTitle.trim() || 'Special Memory',
      date: editDate.trim(),
      location: editLocation.trim(),
      caption: editCaption.trim(),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0a0502] border border-orange-500/30 rounded-3xl max-w-md w-full p-6 text-amber-50 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-serif italic font-bold text-orange-200 mb-4 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-orange-400" />
            Edit Memory Details
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-400 mb-1 font-semibold uppercase tracking-wider">
                Memory Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="e.g. Sunset Walk at the Beach"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="text"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  placeholder="e.g. May 14, 2024"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-stone-400 mb-1 font-semibold uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. Paris"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-400 mb-1 font-semibold uppercase tracking-wider">
                Caption / Special Note
              </label>
              <textarea
                rows={3}
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                placeholder="Write a sweet note about this memory..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => onDelete(editingPhoto.id)}
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-white/10 text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-transform"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
