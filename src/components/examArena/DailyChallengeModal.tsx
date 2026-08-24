import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  Gift,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Coins,
  Sparkles,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface DailyChallengeModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>(() => {
    return QuestionSessionEngine.createSession(questions, {
      count: 10,
      mode: 'daily_challenge',
      userProgress,
    });
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = sessionQuestions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      examAudio.playCorrect();
    } else {
      examAudio.playWrong();
    }

    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      12,
      1
    );
    onSaveProgress(updated);
  };

  const handleNext = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      examAudio.playFanfare();

      // Check if target reached (>=70%)
      const finalCorrect = correctCount + (selectedIndex === currentQ?.shuffledCorrectIndex ? 1 : 0);
      const acc = Math.round((finalCorrect / sessionQuestions.length) * 100);
      if (acc >= 70) {
        const updatedProgress: ExamUserProgress = {
          ...userProgress,
          totalXP: userProgress.totalXP + 100,
          coins: userProgress.coins + 50,
          currentStreak: userProgress.currentStreak + 1,
        };
        onSaveProgress(updatedProgress);
      }
    }
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-gradient-to-b from-[#140b08] via-[#24130c] to-[#120906] border border-orange-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-orange-500/20 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-widest text-orange-400 truncate block">
                DAILY STENO QUEST
              </span>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">Daily Mission & Streak Booster</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {!isCompleted && currentQ ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Quest Reward Target */}
            <div className="flex items-center justify-between text-xs font-mono bg-black/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-orange-500/20">
              <div className="flex items-center gap-1.5 sm:gap-2 text-orange-300 text-[11px] sm:text-xs">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 animate-pulse" />
                <span>TARGET: 70%+ ACCURACY</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-stone-300 text-[10px] sm:text-xs">
                <span className="text-emerald-400 font-bold">+100 XP</span>
                <span className="text-amber-400 font-bold">+50 COINS</span>
                <span className="text-stone-500">
                  {currentIndex + 1}/{sessionQuestions.length}
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/60 border border-orange-500/30 space-y-1.5 sm:space-y-2">
              <div className="text-[10px] sm:text-[11px] font-mono text-orange-400 uppercase">
                [{currentQ.subject.replace('_', ' ')}] {currentQ.topic}
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {currentQ.shuffledOptions.map((opt, idx) => {
                const isChosen = selectedIndex === idx;
                const isCorrect = idx === currentQ.shuffledCorrectIndex;

                let style = 'bg-black/50 hover:bg-orange-950/40 border-orange-500/20 text-stone-200';
                if (isAnswered) {
                  if (isCorrect) style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                  else if (isChosen) style = 'bg-red-950/80 border-red-500 text-red-200';
                  else style = 'bg-black/30 border-stone-800 text-stone-500 opacity-50';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 sm:gap-3 min-h-[44px] cursor-pointer ${style}`}
                  >
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-black/60 border border-orange-500/30 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-orange-300 flex-shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-orange-950/40 border border-orange-500/40 text-xs space-y-1"
              >
                <p className="text-stone-200 text-[11px] sm:text-xs leading-relaxed">{currentQ.explanation}</p>
              </motion.div>
            )}

            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 min-h-[44px] cursor-pointer"
              >
                <span>{currentIndex + 1 < sessionQuestions.length ? 'NEXT QUESTION' : 'CLAIM QUEST REWARDS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="py-6 sm:py-8 text-center space-y-4 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center mx-auto text-orange-300">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">DAILY QUEST COMPLETED!</h3>
              <p className="text-xs text-stone-400 font-sans">
                You solved {correctCount} / {sessionQuestions.length} questions correctly today.
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-mono font-bold text-xs uppercase tracking-widest cursor-pointer min-h-[44px]"
            >
              RETURN TO EXAM ARENA
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
