import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  RotateCcw,
  Flame,
  AlertTriangle,
  Clock,
  BookOpen,
  CheckCircle2,
  X,
  Play,
  ArrowRight,
} from 'lucide-react';
import { ExamQuestion, ExamUserProgress } from '../../types/examArena';
import { QuestionSessionEngine, PreparedQuestion } from '../../services/examEngine';
import { examAudio } from '../../utils/examAudio';

interface RevisionLabModalProps {
  questions: ExamQuestion[];
  userProgress: ExamUserProgress;
  onSaveProgress: (updated: ExamUserProgress) => void;
  onClose: () => void;
}

export const RevisionLabModal: React.FC<RevisionLabModalProps> = ({
  questions,
  userProgress,
  onSaveProgress,
  onClose,
}) => {
  const [activeSession, setActiveSession] = useState<PreparedQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Analyze questions needing spaced repetition
  const progressMap = userProgress.questionProgress || {};
  const wrongIds = Object.keys(progressMap).filter(
    (id) => progressMap[id].status === 'WRONG' || progressMap[id].incorrectCount > 0
  );
  const reviewIds = Object.keys(progressMap).filter((id) => progressMap[id].status === 'REVIEW');

  const handleStartRevision = () => {
    examAudio.playClick();
    const session = QuestionSessionEngine.createSession(questions, {
      count: 10,
      mode: 'revision',
      userProgress,
    });
    setActiveSession(session);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  const currentQ = activeSession ? activeSession[currentIndex] : null;

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedIndex(optIdx);
    setIsAnswered(true);

    const isCorrect = optIdx === currentQ.shuffledCorrectIndex;
    if (isCorrect) examAudio.playCorrect();
    else examAudio.playWrong();

    const updated = QuestionSessionEngine.recordAnswer(
      userProgress,
      currentQ,
      isCorrect,
      10,
      1
    );
    onSaveProgress(updated);
  };

  const handleNext = () => {
    if (!activeSession) return;
    if (currentIndex + 1 < activeSession.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      examAudio.playFanfare();
    }
  };

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#140b10] via-[#221018] to-[#10080c] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-rose-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-rose-400">
                REVISION LAB // SPACED REPETITION
              </span>
              <p className="text-xs text-stone-400">Target Mistakes & Reinforce Retention</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeSession) setActiveSession(null);
              else onClose();
            }}
            className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1">
          {!activeSession ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="p-4 rounded-2xl bg-black/50 border border-rose-500/30">
                <span className="text-[10px] text-stone-400 uppercase">PREVIOUS MISTAKES</span>
                <div className="text-2xl font-bold text-rose-400 mt-1">{wrongIds.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30">
                <span className="text-[10px] text-stone-400 uppercase">DUE FOR REVIEW</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{reviewIds.length + 5}</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-rose-500/20 text-xs space-y-2 leading-relaxed text-stone-300">
              <div className="font-bold text-rose-300 font-mono">🧠 INTELLIGENT SPACED REPETITION</div>
              <p>
                Questions you got wrong or answered slowly return systematically until they reach <strong>MASTERED</strong> state. Practicing revision converts short-term memory into long-term exam confidence.
              </p>
            </div>

            <button
              onClick={handleStartRevision}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START REVISION ROUND</span>
            </button>
          </div>
        ) : !isFinished && currentQ ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono bg-black/50 p-3 rounded-2xl border border-rose-500/20">
              <span className="text-rose-300">REVISING: {currentQ.topic}</span>
              <span className="text-stone-400">
                {currentIndex + 1}/{activeSession.length}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-rose-500/30 space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.shuffledOptions.map((opt, idx) => {
                const isChosen = selectedIndex === idx;
                const isCorrect = idx === currentQ.shuffledCorrectIndex;

                let style = 'bg-black/50 hover:bg-rose-950/40 border-rose-500/20 text-stone-200';
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
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 ${style}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-black/60 border border-rose-500/30 flex items-center justify-center text-xs font-mono font-bold text-rose-300 flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1"
              >
                <p className="text-stone-200">{currentQ.explanation}</p>
                {currentQ.commonTrap && (
                  <p className="text-amber-300 font-mono text-[11px] pt-1">
                    ⚠️ <strong>COMMON TRAP:</strong> {currentQ.commonTrap}
                  </p>
                )}
              </motion.div>
            )}

            {isAnswered && (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
              >
                {currentIndex + 1 < activeSession.length ? 'NEXT REVISION QUESTION' : 'COMPLETE REVISION'}
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-mono text-white">REVISION SESSION COMPLETE!</h3>
              <p className="text-xs text-stone-400 font-sans">
                You reinforced critical concepts and improved retention.
              </p>
            </div>

            <button
              onClick={() => setActiveSession(null)}
              className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-widest cursor-pointer"
            >
              BACK TO REVISION LAB
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
