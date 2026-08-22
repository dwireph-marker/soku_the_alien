import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Heart, Sparkles, Edit3, Copy, Check, Lock, Unlock } from 'lucide-react';
import { romanticAudio } from '../utils/audio';
import { RevealSection } from './common/RevealSection';

interface LoveLetterSectionProps {
  herName: string;
  hisName: string;
  letterSalutationName?: string;
  letterSignOffName?: string;
  title: string;
  body: string;
  soundFxEnabled?: boolean;
  isMidnightTheme?: boolean;
}

export const LoveLetterSection: React.FC<LoveLetterSectionProps> = ({
  herName,
  hisName,
  letterSalutationName,
  letterSignOffName,
  title,
  body,
  soundFxEnabled = true,
  isMidnightTheme = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [copied, setCopied] = useState(false);

  const displaySalutationName = (letterSalutationName || '').trim() || herName;
  const displaySignOffName = (letterSignOffName || '').trim() || hisName;

  // Typewriter effect when letter opens
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < body.length) {
        setDisplayedText(body.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [isOpen, body]);

  const handleOpenLetter = () => {
    setIsOpen(true);
    if (soundFxEnabled) {
      romanticAudio.playUnwrapSound();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\nDearest ${displaySalutationName},\n\n${body}\n\nForever yours,\n${displaySignOffName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <RevealSection id="letter">
      <section
        className={`py-20 sm:py-28 relative overflow-hidden transition-colors duration-700 ${
          isMidnightTheme ? 'bg-[#030213] text-indigo-50' : 'bg-[#0a0502] text-amber-50'
        }`}
      >
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 relative z-10 text-center">
          <div className="reveal-stagger-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-[0.4em] mb-4">
            <Mail className="w-3.5 h-3.5 text-orange-400" />
            <span>A Sealed Love Note</span>
          </div>

          <h2 className="reveal-stagger-2 text-4xl sm:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-200 mb-3">
            From My Heart To Yours ❤️
          </h2>
          <p className="reveal-stagger-3 text-stone-300/80 text-sm sm:text-base max-w-md mx-auto mb-12 font-serif italic">
            A personal birthday love letter written especially for you. Tap the wax seal to unwrap!
          </p>

          {/* SEALED ENVELOPE / UNFOLDED LETTER CARD */}
          <div className="reveal-stagger-4 relative">
            {!isOpen ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenLetter}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl cursor-pointer group relative overflow-hidden max-w-xl mx-auto text-amber-50 flex flex-col items-center justify-center min-h-[320px] backdrop-blur-md"
              >
                {/* Envelope Flap visual */}
                <div className="absolute top-0 inset-x-0 h-24 bg-orange-950/40 border-b border-orange-500/30 clip-envelope-flap flex items-center justify-center">
                  {/* Ribbon */}
                  <div className="w-12 h-full bg-orange-500/60 shadow-md" />
                </div>

                {/* Wax Seal Stamp */}
                <div className="w-20 h-20 bg-gradient-to-tr from-orange-600 via-red-600 to-orange-500 rounded-full shadow-2xl shadow-orange-950/60 flex items-center justify-center border-4 border-amber-200/50 z-20 group-hover:scale-110 transition-transform">
                  <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                </div>

                <div className="mt-8 z-20">
                  <span className="text-xs font-serif tracking-[0.3em] text-orange-400 font-bold uppercase block mb-1">
                    Private & Confidential
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif italic font-bold text-white">
                    To My Dearest {displaySalutationName}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-orange-300 font-medium mt-4">
                    <Unlock className="w-3.5 h-3.5" /> Tap Wax Seal To Open Letter
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/5 border border-orange-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl text-left text-amber-50 relative font-serif backdrop-blur-md"
              >
                {/* Header Ribbon Stamp */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-sm uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>{title}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Letter'}</span>
                  </button>
                </div>

                {/* Salutation */}
                <p className="text-xl sm:text-2xl font-serif italic font-bold text-orange-200 mb-4">
                  Dearest {displaySalutationName},
                </p>

                {/* Typewritten Body */}
                <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-stone-200 font-sans font-normal">
                  {displayedText}
                  {displayedText.length < body.length && (
                    <span className="inline-block w-2 h-4 bg-orange-500 ml-1 animate-pulse" />
                  )}
                </div>

                {/* Signature */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-xs text-stone-400 italic">With all my love forever,</span>
                    <span className="text-xl font-bold font-serif italic text-orange-300">
                      {displaySignOffName} ❤️
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs uppercase tracking-widest text-orange-400 hover:underline"
                  >
                    Reseal Envelope ✉️
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </RevealSection>
  );
};
