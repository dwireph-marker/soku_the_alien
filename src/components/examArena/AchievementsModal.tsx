import React from 'react';
import { motion } from 'motion/react';
import { Award, Trophy, CheckCircle2, Lock, X, Sparkles } from 'lucide-react';
import { ExamAchievement, ExamUserProgress } from '../../types/examArena';
import { defaultAchievements } from '../../data/examCurrentAffairsData';

interface AchievementsModalProps {
  userProgress: ExamUserProgress;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  userProgress,
  onClose,
}) => {
  const unlocked = userProgress.unlockedAchievements || [];

  // Calculate live progress for each achievement based on real user stats
  const getAchievementProgress = (achId: string): { current: number; target: number; label: string; pct: number } => {
    switch (achId) {
      case 'ach_first_steps': {
        const current = userProgress.totalQuestionsSolved || 0;
        const target = 10;
        return { current, target, label: `${Math.min(target, current)} / ${target} questions`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_century': {
        const current = userProgress.totalQuestionsSolved || 0;
        const target = 100;
        return { current, target, label: `${Math.min(target, current)} / ${target} questions`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_streak_7': {
        const current = userProgress.currentStreak || 0;
        const target = 7;
        return { current, target, label: `${Math.min(target, current)} / ${target} days`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_streak_30': {
        const current = userProgress.currentStreak || 0;
        const target = 30;
        return { current, target, label: `${Math.min(target, current)} / ${target} days`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_reasoning_master': {
        const current = userProgress.reasoningBattleStats?.highestCombo || 0;
        const target = 10;
        return { current, target, label: `${Math.min(target, current)} / ${target}x combo`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_gk_explorer': {
        const current = (userProgress.indiaQuestProgress?.completedStages || []).length;
        const target = 6;
        return { current, target, label: `${Math.min(target, current)} / ${target} stages`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_speed_demon': {
        const current = userProgress.gkSpeedRushStats?.highestScore || 0;
        const target = 15;
        return { current, target, label: `${Math.min(target, current)} / ${target} score`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_vocab_virtuoso': {
        const current = userProgress.englishArenaStats?.wordsMastered || 0;
        const target = 50;
        return { current, target, label: `${Math.min(target, current)} / ${target} words`, pct: Math.min(100, Math.round((current / target) * 100)) };
      }
      case 'ach_mock_ace': {
        const mocks = userProgress.mockTestScores || [];
        const hasAced = mocks.some((m) => m.accuracy >= 85);
        const bestAcc = mocks.length > 0 ? Math.max(...mocks.map((m) => m.accuracy)) : 0;
        return {
          current: hasAced ? 1 : 0,
          target: 1,
          label: hasAced ? '85%+ CBT Mock Aced' : (mocks.length > 0 ? `Best Mock: ${bestAcc}% (Target 85%)` : '0 / 1 Mock Tests'),
          pct: hasAced ? 100 : Math.min(95, Math.round((bestAcc / 85) * 100)),
        };
      }
      default:
        return { current: 0, target: 1, label: '0 / 1', pct: 0 };
    }
  };

  return (
    <div className="fixed inset-0 z-[510] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#120a1c] via-[#1c0f2c] to-[#0d0714] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-purple-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-purple-400">
                ACHIEVEMENTS & MILESTONES
              </span>
              <p className="text-xs text-stone-400">
                Unlocked {unlocked.length}/{defaultAchievements.length} Badges • Starting from ground zero
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Achievements Grid */}
        <div className="flex-grow flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 overflow-y-auto p-1 scrollbar-thin">
          {defaultAchievements.map((ach) => {
            const prog = getAchievementProgress(ach.id);
            const isUnlocked = unlocked.includes(ach.id) || prog.pct >= 100;

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative ${
                  isUnlocked
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-black/40 border-stone-800/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{ach.icon}</span>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 border border-stone-700 text-stone-400 text-[10px] font-mono">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                    <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                      {ach.description}
                    </p>
                  </div>

                  {/* Dynamic Progress Indicator */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>Progress</span>
                      <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-purple-300'}>
                        {isUnlocked ? '100% Completed' : prog.label}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/70 border border-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnlocked
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${isUnlocked ? 100 : prog.pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-500/10 text-[11px] font-mono text-purple-300 font-bold flex items-center justify-between">
                  <span>+{ach.xpReward} XP</span>
                  <span className="text-stone-500 uppercase text-[9px]">{ach.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
