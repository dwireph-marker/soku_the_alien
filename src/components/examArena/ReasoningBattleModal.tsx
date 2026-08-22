import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Zap,
  Flame,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface ReasoningBattleModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

export const ReasoningBattleModal: React.FC<ReasoningBattleModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(examAudio.getMuted());
  const [earnedXP, setEarnedXP] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Initialize 10 reasoning questions
  useEffect(() => {
    const session = QuestionSessionEngine.createSession(questions, {
      subject: 'reasoning',
      count: 10,
      mode: 'reasoning_battle',
      userProgress,
    });
    setSessionQuestions(session);
  }, [questions, userProgress]);

  const currentQ = sessionQuestions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const points = 100 * combo;
      setScore((prev) => prev + points);
      setEarnedXP((prev) => prev + (10 + combo * 3));
      setCorrectAnswersCount((prev) => prev + 1);
      examAudio.playCorrect(combo);
      if (newCombo >= 3) examAudio.playComboBurst();
    } else {
      setCombo(1);
      examAudio.playWrong();
    }

    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      10,
      combo
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

      const withSession = QuestionSessionEngine.recordSessionHistory(userProgress, {
        mode: 'reasoning_battle',
        modeLabel: 'Reasoning Battle',
        totalQuestions: sessionQuestions.length,
        correctAnswers: correctAnswersCount,
        timeSpentSeconds: sessionQuestions.length * 10,
        xpEarned: earnedXP,
      });
      onSaveProgress(withSession);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    examAudio.setMuted(next);
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
      <div className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-gradient-to-b from-[#090b14] via-[#101426] to-[#0a0d18] border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Top Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-cyan-500/20 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-widest text-cyan-400 truncate">
                  REASONING BATTLE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] sm:text-[10px] font-mono text-cyan-300">
                  ROUND {currentIndex + 1}/{sessionQuestions.length || 10}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">Speed & Logic Challenge</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={toggleMute}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-cyan-950/50 border border-cyan-500/20 text-stone-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 hover:border-rose-500/40 text-stone-400 hover:text-rose-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isCompleted && currentQ ? (
          <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col justify-between">
            <div>
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-center text-xs font-mono">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-cyan-500/20">
                  <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">SCORE</span>
                  <div className="text-sm sm:text-base font-bold text-cyan-300">{score}</div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${combo > 1 ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">COMBO</span>
                    <div className="text-sm sm:text-base font-bold text-amber-300">×{combo}</div>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-cyan-500/20 text-cyan-300 flex items-center justify-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">PROGRESS</span>
                    <div className="text-sm sm:text-base font-bold">{currentIndex + 1} / {sessionQuestions.length}</div>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/60 border border-cyan-500/30 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-cyan-400">
                    <span>TOPIC: {currentQ.topic}</span>
                    <span className="uppercase">{currentQ.difficulty}</span>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {currentQ.shuffledOptions.map((opt, idx) => {
                    const isChosen = selectedIndex === idx;
                    const isCorrectAnswer = idx === currentQ.shuffledCorrectIndex;

                    let btnStyle =
                      'bg-black/50 hover:bg-cyan-950/40 border-cyan-500/20 text-stone-200 hover:border-cyan-400/60';

                    if (isAnswered) {
                      if (isCorrectAnswer) {
                        btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-emerald-500/20';
                      } else if (isChosen && !isCorrectAnswer) {
                        btnStyle = 'bg-red-950/80 border-red-500 text-red-200 shadow-red-500/20';
                      } else {
                        btnStyle = 'bg-black/30 border-stone-800 text-stone-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswered}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left font-sans text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 sm:gap-3 relative min-h-[44px] cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-black/60 border border-cyan-500/30 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-cyan-300 flex-shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Dropdown on Answer */}
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-300 font-bold font-mono text-[11px] sm:text-xs">
                      <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                      <span>EXPLANATION & KEY LOGIC</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed text-[11px] sm:text-xs">{currentQ.explanation}</p>
                    {currentQ.keyFact && (
                      <p className="text-amber-300/90 font-mono text-[10px] sm:text-[11px] pt-0.5">
                        💡 <strong>KEY FACT:</strong> {currentQ.keyFact}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom Next Button */}
            {isAnswered && (
              <div className="mt-3 sm:mt-4 pt-2">
                <button
                  onClick={handleNext}
                  className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 min-h-[44px] cursor-pointer"
                >
                  <span>{currentIndex + 1 < sessionQuestions.length ? 'NEXT QUESTION' : 'VIEW FINAL RESULTS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Completion Screen */
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-mono text-white">REASONING BATTLE COMPLETE!</h3>
              <p className="text-xs text-stone-400 font-sans">You tested your reflexes and pattern recognition.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto font-mono">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/20">
                <span className="text-[10px] text-stone-400">TOTAL SCORE</span>
                <div className="text-lg font-bold text-cyan-300">{score}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/20">
                <span className="text-[10px] text-stone-400">XP EARNED</span>
                <div className="text-lg font-bold text-emerald-400">+{earnedXP}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan-500/20">
                <span className="text-[10px] text-stone-400">QUESTIONS</span>
                <div className="text-lg font-bold text-white">{sessionQuestions.length}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all"
            >
              RETURN TO EXAM ARENA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
