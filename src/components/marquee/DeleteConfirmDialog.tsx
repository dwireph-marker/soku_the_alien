import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X } from 'lucide-react';
import { MemoryPhoto } from '../../types';

interface DeleteConfirmDialogProps {
  pendingDeletePhoto: MemoryPhoto | null;
  toastMessage: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCloseToast: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  pendingDeletePhoto,
  toastMessage,
  onCancelDelete,
  onConfirmDelete,
  onCloseToast,
}) => {
  return (
    <>
      <AnimatePresence>
        {pendingDeletePhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancelDelete}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0502] border border-red-500/40 rounded-3xl max-w-sm w-full p-6 text-amber-50 shadow-2xl relative text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-serif italic text-white mb-2">Delete Memory?</h3>
              <p className="text-xs sm:text-sm text-stone-300 mb-6 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="text-amber-300 font-medium">"{pendingDeletePhoto.title || 'this memory'}"</span> from your memory reel?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancelDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 text-stone-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-stone-900/95 border border-amber-500/40 text-amber-100 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-md"
          >
            <div className="p-2 rounded-full bg-red-500/20 text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium flex-1">{toastMessage}</p>
            <button
              type="button"
              onClick={onCloseToast}
              className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
