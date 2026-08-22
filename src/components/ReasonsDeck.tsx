import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { LoveReason } from '../types';
import { romanticAudio } from '../utils/audio';
import { RevealSection } from './common/RevealSection';

interface ReasonsDeckProps {
  reasons: LoveReason[];
  soundFxEnabled?: boolean;
  isMidnightTheme?: boolean;
}

export const ReasonsDeck: React.FC<ReasonsDeckProps> = ({
  reasons = [],
  soundFxEnabled = true,
  isMidnightTheme = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!reasons || reasons.length === 0) {
    return (
      <RevealSection id="reasons">
        <section
          className={`pt-12 pb-8 sm:pt-16 sm:pb-10 relative overflow-hidden transition-colors duration-700 ${
            isMidnightTheme ? 'bg-[#030213] text-indigo-50' : 'bg-[#0a0502] text-amber-50'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="reveal-stagger-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-[0.4em] mb-4">
              <Heart className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>Countless Reasons To Love You</span>
            </div>
            <h2 className="reveal-stagger-2 text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-200 mb-3">
              Reasons Why You Have My Heart ❤️
            </h2>
            <div className="reveal-stagger-3 w-full max-w-lg mx-auto bg-white/5 border border-white/10 rounded-3xl p-10 text-center my-8 backdrop-blur-md">
              <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-3" />
              <p className="text-sm text-stone-300 font-serif italic">
                No love reasons added yet. Use the Admin Dashboard to add your love reasons! ❤️
              </p>
            </div>
          </div>
        </section>
      </RevealSection>
    );
  }

  const currentReason = reasons[currentIndex] || reasons[0];

  const nextReason = () => {
    if (soundFxEnabled) romanticAudio.playPopSound();
    setCurrentIndex((prev) => (prev + 1) % reasons.length);
  };

  const prevReason = () => {
    if (soundFxEnabled) romanticAudio.playPopSound();
    setCurrentIndex((prev) => (prev - 1 + reasons.length) % reasons.length);
  };

  return (
    <RevealSection id="reasons">
      <section
        className={`pt-12 pb-8 sm:pt-16 sm:pb-10 relative overflow-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#030213] text-indigo-50' : 'bg-[#0a0502] text-amber-50'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="reveal-stagger-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-[0.4em] mb-4">
            <Heart className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Countless Reasons To Love You</span>
          </div>

          <h2 className="reveal-stagger-2 text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-200 mb-3">
            Reasons Why You Have My Heart ❤️
          </h2>
          <p className="reveal-stagger-3 text-stone-300/80 text-sm sm:text-base max-w-md mx-auto mb-12 font-serif italic">
            Tap through the card deck to read just a few of the millions of reasons why you mean everything to me.
          </p>

          {/* INTERACTIVE CARD DECK */}
          <div className="reveal-stagger-4 relative max-w-lg mx-auto min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReason.id}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-between min-h-[260px] backdrop-blur-md"
              >
                {/* Card Number Badge */}
                <div className="flex items-center justify-between w-full text-xs text-stone-400 font-medium">
                  <span className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30 text-orange-400">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Reason #{currentReason.number}
                  </span>
                  <span>
                    {currentIndex + 1} / {reasons.length}
                  </span>
                </div>

                {/* Reason Content */}
                <div className="my-6">
                  <Heart className="w-10 h-10 text-orange-400 fill-orange-400/30 mx-auto mb-4 animate-bounce" />
                  <p className="text-xl sm:text-2xl font-serif italic font-medium leading-relaxed text-amber-50">
                    "{currentReason.text}"
                  </p>
                </div>

                {/* Tap prompt */}
                <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-sans">
                  Swipe or use arrows to flip next card
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="reveal-stagger-4 mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prevReason}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 shadow-lg active:scale-90 transition-transform"
              title="Previous Reason"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="text-xs uppercase tracking-widest text-orange-400 font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10">
              Card {currentIndex + 1} of {reasons.length}
            </span>

            <button
              onClick={nextReason}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 shadow-lg active:scale-90 transition-transform"
              title="Next Reason"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>
    </RevealSection>
  );
};
