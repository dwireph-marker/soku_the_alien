import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishText: string;
  setWishText: (val: string) => void;
  onSaveWish: (e: React.FormEvent) => void;
}

export const WishModal: React.FC<WishModalProps> = ({
  isOpen,
  onClose,
  wishText,
  setWishText,
  onSaveWish,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0502] border border-orange-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 relative text-amber-50 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-950/50">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>

            <h3 className="text-2xl font-serif italic font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200">
              All Candles Are Blown Out!
            </h3>
            <p className="text-xs text-stone-400 mt-1 mb-6">
              Now close your eyes, make a secret wish from your heart, and write it down below!
            </p>

            <form onSubmit={onSaveWish} className="space-y-4">
              <textarea
                rows={4}
                required
                value={wishText || ''}
                onChange={e => setWishText(e.target.value)}
                placeholder="My birthday wish for this year is..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 text-sm font-serif"
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium text-xs uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-lg shadow-orange-950/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Lock In My Secret Wish 🔒</span>
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
