import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Trophy,
  Star,
  Clock,
  CheckCircle2,
  Heart,
  ExternalLink,
  RotateCcw,
  Film,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface FinalTreasureModalProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onRestartNewHunt: () => void;
  onReturnToBirthdaySite: () => void;
}

export const FinalTreasureModal: React.FC<FinalTreasureModalProps> = ({
  template,
  instance,
  onRestartNewHunt,
  onReturnToBirthdaySite,
}) => {
  const [revealedPayload, setRevealedPayload] = useState(false);

  const durationSecs = instance.solveDurationSeconds || Math.round((Date.now() - instance.startTime) / 1000);
  const minutes = Math.floor(durationSecs / 60);
  const seconds = durationSecs % 60;
  const timeFormatted = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

  useEffect(() => {
    // Fire celebration confetti
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#10b981', '#fb7185', '#f43f5e', '#ffd700'],
    });

    const timer = setTimeout(() => {
      setRevealedPayload(true);
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.5 },
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#030d1d] border-2 border-cyan-400 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-center text-stone-200 shadow-[0_0_80px_rgba(0,240,255,0.4)] relative overflow-hidden font-mono"
      >
        {/* Background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Phase 1: Detective Debriefing */}
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CASE CLOSED • INVESTIGATION COMPLETE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-rose-300 uppercase tracking-tight">
            {template.finalTreasure?.title || 'CLASSIFIED PAYLOAD RECOVERED'}
          </h1>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y border-cyan-500/20 text-xs">
            <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20">
              <span className="text-stone-400 text-[10px] uppercase">SOLVE TIME</span>
              <p className="text-cyan-300 font-bold text-sm sm:text-base mt-0.5">{timeFormatted}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20">
              <span className="text-stone-400 text-[10px] uppercase">CLUES COLLECTED</span>
              <p className="text-emerald-300 font-bold text-sm sm:text-base mt-0.5">{instance.cluesFound.length}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20">
              <span className="text-stone-400 text-[10px] uppercase">CLEARANCE RATING</span>
              <div className="flex items-center justify-center gap-0.5 text-amber-400 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Romantic Birthday Payload Transition */}
          <AnimatePresence>
            {revealedPayload && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 to-black/80 border border-rose-500/40 text-left space-y-4 mt-6 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif italic text-rose-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-500 animate-pulse" />
                    <span>Secret Birthday Message Unlocked</span>
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] uppercase font-mono">
                    {template.finalTreasure?.rewardBadge || 'MASTER OF DEDUCTION'}
                  </span>
                </div>

                <p className="font-serif text-sm sm:text-base text-pink-100 leading-relaxed italic">
                  "{template.finalTreasure?.message}"
                </p>

                {template.finalTreasure?.specialLoveNote && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 font-sans text-xs text-rose-200">
                    <p className="font-serif italic">{template.finalTreasure.specialLoveNote}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={onReturnToBirthdaySite}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>RETURN TO BIRTHDAY WEBSITE</span>
            </button>

            <button
              onClick={onRestartNewHunt}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY NEW MYSTERY CASE</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
