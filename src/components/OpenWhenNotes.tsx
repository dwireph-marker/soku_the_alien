import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Heart, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { OpenWhenEnvelope } from '../types';
import { romanticAudio } from '../utils/audio';

interface OpenWhenNotesProps {
  envelopes: OpenWhenEnvelope[];
  soundFxEnabled?: boolean;
}

export const OpenWhenNotes: React.FC<OpenWhenNotesProps> = ({ envelopes, soundFxEnabled = true }) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<OpenWhenEnvelope | null>(null);
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());

  const handleOpen = (envelope: OpenWhenEnvelope) => {
    if (soundFxEnabled) romanticAudio.playUnwrapSound();
    setSelectedEnvelope(envelope);
    setOpenedIds(prev => new Set(prev).add(envelope.id));
  };

  return (
    <section id="open-when" className="py-20 sm:py-28 relative overflow-hidden bg-[#0a0502] text-amber-50">
      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-[0.4em] mb-4">
          <Mail className="w-3.5 h-3.5 text-orange-400" />
          <span>Open When Envelopes</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-200 mb-3">
          Letters For Every Moment 💌
        </h2>
        <p className="text-stone-300/80 text-sm sm:text-base max-w-md mx-auto mb-12 font-serif italic">
          Special sealed letters designed to give you comfort, joy, and warmth whenever you need it most.
        </p>

        {/* ENVELOPES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {envelopes.map(env => {
            const isOpened = openedIds.has(env.id);
            return (
              <motion.div
                key={env.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpen(env)}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl cursor-pointer relative overflow-hidden flex flex-col justify-between text-left min-h-[220px] transition-all group backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      {isOpened ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Mail className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      {isOpened ? 'Opened' : 'Sealed'}
                    </span>
                  </div>

                  <h3 className="font-serif italic font-bold text-lg text-white leading-snug group-hover:text-orange-300 transition-colors">
                    {env.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                    {env.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-orange-400 font-medium">
                  <span>{isOpened ? 'Read Note' : 'Tap To Unseal'}</span>
                  <Heart className="w-4 h-4 text-orange-400 fill-orange-400/40 group-hover:fill-orange-400 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ENVELOPE MODAL */}
      <AnimatePresence>
        {selectedEnvelope && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEnvelope(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0a0502] border border-orange-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 relative text-amber-50 shadow-2xl"
            >
              <button
                onClick={() => setSelectedEnvelope(null)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-orange-400 font-serif italic font-bold text-xl mb-1">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span>{selectedEnvelope.title}</span>
              </div>
              <p className="text-xs text-stone-400 mb-6 italic font-serif">{selectedEnvelope.subtitle}</p>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-sm sm:text-base leading-relaxed text-stone-200 font-serif italic">
                "{selectedEnvelope.content}"
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1 text-orange-400 font-medium">
                  <Heart className="w-3.5 h-3.5 fill-orange-400 text-orange-400" /> Always here for you
                </span>
                <button
                  onClick={() => setSelectedEnvelope(null)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium text-xs uppercase tracking-[0.2em] px-5 py-2 rounded-full transition-colors"
                >
                  Close Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
