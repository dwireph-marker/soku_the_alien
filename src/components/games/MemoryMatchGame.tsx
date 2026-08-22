import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Trophy, CheckCircle, Heart, Star, X, Timer, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../../utils/audio';

interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_PAIRS = [
  { pairId: 1, emoji: '🎂', label: 'Cake' },
  { pairId: 2, emoji: '🌹', label: 'Rose' },
  { pairId: 3, emoji: '💌', label: 'Letter' },
  { pairId: 4, emoji: '💎', label: 'Ring' },
  { pairId: 5, emoji: '🧸', label: 'Teddy' },
  { pairId: 6, emoji: '🥂', label: 'Toast' },
  { pairId: 7, emoji: '🍫', label: 'Chocolate' },
  { pairId: 8, emoji: '🎆', label: 'Fireworks' },
];

function shuffleCards(array: CardItem[]): CardItem[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface MemoryMatchGameProps {
  soundFxEnabled?: boolean;
  onRewardUnlocked?: (reward: string) => void;
  onClose?: () => void;
}

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  soundFxEnabled = true,
  onRewardUnlocked,
  onClose,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop running timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Clear flip timeout
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Lock body scroll while game is open and restore on unmount
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const initGame = useCallback(() => {
    clearPendingTimeout();
    stopTimer();

    const deck: CardItem[] = [];
    let idCounter = 1;

    // Double the pairs to create 16 cards (8 pairs)
    [...CARD_PAIRS, ...CARD_PAIRS].forEach((item) => {
      deck.push({
        id: idCounter++,
        pairId: item.pairId,
        emoji: item.emoji,
        label: item.label,
        isFlipped: false,
        isMatched: false,
      });
    });

    const shuffled = shuffleCards(deck);
    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setElapsedSeconds(0);
    setIsGameActive(true);
    setIsGameWon(false);

    // Start Single Controlled Timer
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearPendingTimeout, stopTimer]);

  useEffect(() => {
    initGame();
    return () => {
      clearPendingTimeout();
      stopTimer();
    };
  }, [initGame, clearPendingTimeout, stopTimer]);

  const handleWin = useCallback(() => {
    setIsGameWon(true);
    setIsGameActive(false);
    stopTimer();

    try {
      if (soundFxEnabled) romanticAudio.playFanfare();
    } catch (e) {
      console.warn('Audio fanfare error:', e);
    }

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#fb7185', '#fda4af', '#f43f5e', '#ffd700', '#ec4899'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }

    if (onRewardUnlocked) {
      onRewardUnlocked('Memory Master 🧩');
    }
  }, [onRewardUnlocked, soundFxEnabled, stopTimer]);

  const handleCardClick = (index: number) => {
    if (
      !isGameActive ||
      !cards[index] ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      selectedCards.length >= 2
    ) {
      return;
    }

    try {
      if (soundFxEnabled) romanticAudio.playPopSound();
    } catch (e) {}

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // MATCH!
        timeoutRef.current = setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            if (updated[firstIdx]) updated[firstIdx] = { ...updated[firstIdx], isMatched: true, isFlipped: true };
            if (updated[secondIdx]) updated[secondIdx] = { ...updated[secondIdx], isMatched: true, isFlipped: true };
            return updated;
          });
          setSelectedCards([]);
          setMatches((prev) => {
            const nextMatches = prev + 1;
            if (nextMatches >= CARD_PAIRS.length) {
              handleWin();
            }
            return nextMatches;
          });
          try {
            if (soundFxEnabled) romanticAudio.playChime();
          } catch (e) {}
        }, 300);
      } else {
        // MISMATCH
        timeoutRef.current = setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            if (updated[firstIdx]) updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
            if (updated[secondIdx]) updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
            return updated;
          });
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-[500] w-full h-[100dvh] min-h-[100dvh] bg-gradient-to-b from-[#13030f] via-[#1f0619] to-[#0c020a] text-rose-50 flex flex-col justify-between overflow-x-hidden overflow-y-auto select-none pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-match-title"
    >
      {/* 1. TOP HEADER (Responsive & Compact on Mobile) */}
      <header className="flex-shrink-0 w-full max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-3 border-b border-rose-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          {/* Top Row: Title, Icon & Close/Reset */}
          <div className="flex items-center justify-between gap-3 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-lg shadow-rose-950/50">
                <Heart className="w-5 h-5 fill-rose-500/40 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h1
                  id="memory-match-title"
                  className="text-base sm:text-xl md:text-2xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-100 to-amber-200 truncate leading-tight"
                >
                  Memory Match
                </h1>
                <p className="text-[10px] sm:text-xs text-rose-300/80 truncate hidden xs:block">
                  Match 8 pairs to unlock birthday love surprises ✨
                </p>
              </div>
            </div>

            {/* Mobile Actions: Restart + Close */}
            <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
              <button
                onClick={initGame}
                className="p-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 hover:text-white transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                title="Restart Game"
                aria-label="Restart Game"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-black/60 hover:bg-rose-950 border border-stone-800 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
                  title="Close Memory Match"
                  aria-label="Close Memory Match"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar + Desktop Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Live Stats */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Moves */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-rose-500/30 text-xs font-mono text-rose-200 min-h-[38px]">
                <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>{moves}</strong> Moves
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/30 text-xs font-mono text-amber-300 min-h-[38px]">
                <Timer className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              {/* Matched Pairs */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-500/30 text-xs font-mono text-emerald-300 min-h-[38px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>{matches}</strong>/8 Pairs
                </span>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={initGame}
                className="p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 hover:text-white transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md"
                title="Restart Game"
                aria-label="Restart Game"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-black/60 hover:bg-rose-950 border border-stone-800 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md"
                  title="Close Memory Match"
                  aria-label="Close Memory Match"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN RESPONSIVE 4x4 GAME BOARD (Occupies Full Available Viewport) */}
      <main className="flex-grow flex-1 min-h-0 flex flex-col items-center justify-center px-2.5 sm:px-4 py-2 sm:py-4 w-full">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto flex flex-col items-center justify-center">
          {/* Responsive 4x4 Grid with Viewport-Aware Card Sizing */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full aspect-square max-h-[calc(100dvh-180px)] sm:max-h-[calc(100dvh-160px)]">
            {cards.map((card, index) => {
              const isRevealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  aria-label={isRevealed ? `${card.label} card` : `Hidden card ${index + 1}`}
                  className={`relative aspect-square w-full rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 shadow-md p-1 min-h-[44px] min-w-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 select-none ${
                    card.isMatched
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-white shadow-emerald-950/50 opacity-95 scale-[0.98]'
                      : isRevealed
                      ? 'bg-rose-900/80 border-rose-400/80 shadow-rose-950/60 scale-[1.02]'
                      : 'bg-rose-950/50 hover:bg-rose-900/40 border-rose-500/40 hover:border-rose-400 active:scale-95'
                  }`}
                >
                  {isRevealed ? (
                    <motion.div
                      initial={{ scale: 0.6, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center justify-center w-full min-w-0"
                    >
                      <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl filter drop-shadow-md leading-none">
                        {card.emoji}
                      </span>
                      <span className="text-[8px] sm:text-[10px] md:text-xs font-mono font-bold text-rose-200 mt-1 truncate max-w-full">
                        {card.label}
                      </span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center text-rose-400/70 hover:text-rose-300 transition-colors">
                      <Heart className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-rose-500/30" />
                    </div>
                  )}

                  {card.isMatched && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 fill-emerald-950" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. FOOTER / VICTORY OVERLAY */}
      <footer className="flex-shrink-0 w-full max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
        <AnimatePresence>
          {isGameWon && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15 }}
              className="p-3 sm:p-4 bg-gradient-to-r from-rose-950 via-[#2a0b20] to-rose-950 border border-rose-400/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif italic font-bold text-white">
                    All 8 Pairs Matched! 🎉
                  </h3>
                  <p className="text-xs text-rose-300">
                    Completed in <strong>{moves}</strong> moves ({formatTime(elapsedSeconds)}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={initGame}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold uppercase shadow-lg shadow-rose-900/40 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </motion.div>
  );
};
