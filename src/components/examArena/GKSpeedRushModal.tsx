import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Flame,
  RotateCcw,
  Trophy,
  X,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Brain,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface GKSpeedRushModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

export const GKSpeedRushModal: React.FC<GKSpeedRushModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<10 | 20 | 30>(10);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'summary'>('intro');
  const [sessionQuestions, setSessionQuestions] = useState<PreparedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [isMuted, setIsMuted] = useState(examAudio.getMuted());

  // Start game session
  const startGame = (count: 10 | 20 | 30) => {
    setSelectedQuestionCount(count);

    // Shuffle rapid GK questions
    const gkPool = questions.filter((q) => q.subject === 'general_awareness');
    const session = QuestionSessionEngine.createSession(
      gkPool.length >= 10 ? gkPool : questions,
      { count }
    );

    setSessionQuestions(session);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCombo(1);
    setMaxCombo(1);
    setGameState('playing');
    examAudio.playClick();
  };

  const currentQ = sessionQuestions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (gameState !== 'playing' || !currentQ) return;

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    const nextWrong = !isCorrect ? wrongCount + 1 : wrongCount;

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      setCorrectCount((prev) => prev + 1);
      examAudio.playCorrect(combo);
    } else {
      setCombo(1);
      setWrongCount((prev) => prev + 1);
      examAudio.playWrong();
    }

    // Record answer
    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      5,
      combo
    );
    onSaveProgress(updated);

    // Move to next question or complete
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      endGame(nextCorrect, nextWrong, maxCombo);
    }
  };

  const endGame = (finalCorrect: number, finalWrong: number, finalMaxCombo: number) => {
    setGameState('summary');
    examAudio.playFanfare();

    const totalAttemptedInGame = finalCorrect + finalWrong;
    const baseProgress: ExamUserProgress = {
      ...userProgress,
      gkSpeedRushStats: {
        gamesPlayed: (userProgress.gkSpeedRushStats?.gamesPlayed || 0) + 1,
        bestQPM: Math.max(userProgress.gkSpeedRushStats?.bestQPM || 0, finalCorrect),
        highestScore: Math.max(
          userProgress.gkSpeedRushStats?.highestScore || 0,
          finalCorrect * 50 + finalMaxCombo * 20
        ),
      },
    };

    const updatedWithSession = QuestionSessionEngine.recordSessionHistory(baseProgress, {
      mode: 'gk_speed_rush',
      modeLabel: 'GK Speed Rush',
      totalQuestions: totalAttemptedInGame,
      correctAnswers: finalCorrect,
      timeSpentSeconds: totalAttemptedInGame * 5,
      xpEarned: finalCorrect * 10,
    });

    onSaveProgress(updatedWithSession);
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
      <div className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] bg-gradient-to-b from-[#0b0816] via-[#160d26] to-[#0a0714] border border-yellow-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-yellow-500/20 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-yellow-950/80 border border-yellow-500/50 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold font-mono uppercase tracking-widest text-yellow-400 truncate block">
                GK SPEED RUSH
              </span>
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">Rapid-Fire General Awareness Challenge</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={toggleMute}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-yellow-500/20 text-stone-400 hover:text-white min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {gameState === 'intro' ? (
          /* Mode Selector Screen */
          <div className="py-4 sm:py-6 text-center space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">CHOOSE QUESTION RUSH</h3>
              <p className="text-[11px] sm:text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Rapid General Awareness challenge. Answer accurately and build high combos to maximize your XP and coin rewards!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-md mx-auto">
              {[10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => startGame(count as 10 | 20 | 30)}
                  className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/50 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-400 text-center transition-all group shadow-lg cursor-pointer min-h-[70px]"
                >
                  <div className="text-2xl sm:text-3xl font-black font-mono text-yellow-400 group-hover:scale-110 transition-transform">
                    {count}Q
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-1 block">
                    {count === 10 ? 'SPRINT' : count === 20 ? 'CHALLENGE' : 'MARATHON'}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 border border-yellow-500/20 text-[11px] sm:text-xs font-mono text-stone-400 max-w-sm mx-auto">
              ⚡ Best Solved in a Session: <strong className="text-yellow-300">{userProgress.gkSpeedRushStats?.bestQPM || 0}</strong>
            </div>
          </div>
        ) : gameState === 'playing' && currentQ ? (
          /* Active Rapid Game */
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs font-mono">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-yellow-500/20">
                <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">SOLVED</span>
                <div className="text-sm sm:text-base font-bold text-emerald-400">{correctCount}</div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${combo > 1 ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                <div>
                  <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">COMBO</span>
                  <div className="text-sm sm:text-base font-bold text-amber-300">×{combo}</div>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-black/50 border border-yellow-500/20 text-yellow-300 flex items-center justify-center gap-1.5">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                <div>
                  <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase">PROGRESS</span>
                  <div className="text-sm sm:text-base font-bold">{currentIndex + 1} / {sessionQuestions.length}</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/60 border border-yellow-500/30 space-y-1.5 sm:space-y-2">
              <div className="text-[10px] sm:text-[11px] font-mono text-yellow-400">{currentQ.topic}</div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {currentQ.shuffledOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/50 hover:bg-yellow-950/40 border border-yellow-500/20 hover:border-yellow-400/60 text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 sm:gap-3 active:scale-[0.98] min-h-[44px] cursor-pointer"
                >
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-black/60 border border-yellow-500/30 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-yellow-300 flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Summary Screen */
          <div className="py-4 sm:py-6 text-center space-y-4 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mx-auto text-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">RUSH COMPLETED!</h3>
              <p className="text-xs text-stone-400">Great rapid-fire knowledge accuracy.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto font-mono">
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/60 border border-yellow-500/20">
                <span className="text-[9px] sm:text-[10px] text-stone-400">CORRECT</span>
                <div className="text-base sm:text-lg font-bold text-emerald-400">{correctCount}</div>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/60 border border-yellow-500/20">
                <span className="text-[9px] sm:text-[10px] text-stone-400">MAX COMBO</span>
                <div className="text-base sm:text-lg font-bold text-amber-300">×{maxCombo}</div>
              </div>
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/60 border border-yellow-500/20">
                <span className="text-[9px] sm:text-[10px] text-stone-400">ACCURACY</span>
                <div className="text-base sm:text-lg font-bold text-cyan-300">
                  {correctCount + wrongCount > 0
                    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 sm:gap-3 justify-center">
              <button
                onClick={() => setGameState('intro')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer min-h-[44px]"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onClose}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-black/50 border border-stone-700 hover:bg-stone-800 text-stone-300 font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer min-h-[44px]"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
