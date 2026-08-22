import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Terminal, Lock } from 'lucide-react';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface GlitchTransitionProps {
  isActive: boolean;
  type?: 'entering' | 'exiting';
  onComplete?: () => void;
  caseName?: string;
}

export const GlitchTransition: React.FC<GlitchTransitionProps> = ({
  isActive,
  type = 'entering',
  onComplete,
  caseName = 'CASE #X-2047: TOP SECRET',
}) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (isActive) {
      detectiveAudio.playCameraSwitch();
      setStage(1);
      const t1 = setTimeout(() => {
        detectiveAudio.playScanBeep();
        setStage(2);
      }, 400);

      const t2 = setTimeout(() => {
        detectiveAudio.playKeyClick();
        setStage(3);
      }, 900);

      const t3 = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setStage(0);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#020611] text-cyan-400 font-mono flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Scanlines and Noise Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.6)_51%)] bg-[length:100%_4px] pointer-events-none opacity-80" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-cyan-950/20 to-black/90 pointer-events-none" />

        {/* Glitch Static Bars */}
        <div className="absolute inset-x-0 h-8 bg-cyan-400/20 blur-sm animate-pulse top-1/4 pointer-events-none" />
        <div className="absolute inset-x-0 h-4 bg-emerald-400/20 blur-sm animate-pulse bottom-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full mx-auto px-6 text-center">
          {stage === 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                <ShieldAlert className="w-8 h-8 animate-bounce text-cyan-400" />
              </div>
              <p className="text-xs uppercase tracking-[0.5em] text-cyan-400/80">
                {type === 'entering' ? 'SIGNAL INTERCEPTED' : 'CLOSING INVESTIGATION'}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-white">
                {type === 'entering' ? 'INITIALIZING CLASSIFIED PROTOCOL' : 'SHUTTING DOWN TERMINAL'}
              </h2>
            </motion.div>
          )}

          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Terminal className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
              <div className="bg-black/80 border border-cyan-500/30 rounded-xl p-4 w-full text-left space-y-2 text-xs shadow-2xl">
                <div className="flex items-center justify-between text-cyan-300">
                  <span>SECURITY CLEARANCE</span>
                  <span className="text-emerald-400 font-bold">LEVEL 4 // TOP SECRET</span>
                </div>
                <div className="h-1 w-full bg-cyan-950 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                  />
                </div>
                <p className="text-[11px] text-stone-400 truncate">
                  &gt; LOADING MISSION DOSSIER: <span className="text-white">{caseName}</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
