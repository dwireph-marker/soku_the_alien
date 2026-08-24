import express, { Request, Response } from 'express';
import { authenticateAdmin } from './auth';
import {
  progressRateLimiter,
  resetRateLimiter,
  recordSessionRateLimiter,
  verifyAnswerRateLimiter,
} from './middleware/security';
import {
  isSessionProcessed,
  markSessionProcessed,
  fetchUserProgress,
  persistUserProgress,
  purgeUserProgress,
} from './lib/firestoreRest';

export const examArenaRouter = express.Router();

// Concurrency lock for reset operations per user UID
const activeResetLocks = new Set<string>();
// Timestamp of last reset operation per user UID (for cooldown)
const lastResetTimestamp = new Map<string, number>();

let cachedQuestions: any[] | null = null;
let cachedPapers: any[] | null = null;
let cachedConfig: any | null = null;

const createInitialUserProgress = (uid: string) => ({
  userId: uid,
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  coins: 0,
  totalQuestionsSolved: 0,
  totalCorrect: 0,
  totalTimeSpentSeconds: 0,
  reasoningBattleStats: {
    gamesPlayed: 0,
    highestCombo: 0,
    highestScore: 0,
  },
  gkSpeedRushStats: {
    gamesPlayed: 0,
    bestQPM: 0,
    highestScore: 0,
  },
  indiaQuestProgress: {
    completedStages: [],
    currentStageId: 'stage_history',
  },
  englishArenaStats: {
    gamesPlayed: 0,
    wordsMastered: 0,
  },
  questionProgress: {},
  topicMasteries: {},
  sessionHistory: [],
  mockTestScores: [],
  unlockedAchievements: [],
});

/**
 * GET /api/exam-arena/progress
 * Protected: Retrieves the verified authenticated user's progress.
 */
examArenaRouter.get('/progress', authenticateAdmin, progressRateLimiter, async (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  if (!adminUser || !adminUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: User identity not verified' });
  }

  const uid = adminUser.uid;
  const progress = (await fetchUserProgress(uid)) || createInitialUserProgress(uid);
  return res.json({ success: true, progress });
});

/**
 * POST /api/exam-arena/progress
 * Protected: Saves progress strictly for the verified authenticated user's UID.
 */
examArenaRouter.post('/progress', authenticateAdmin, progressRateLimiter, async (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  if (!adminUser || !adminUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: User identity not verified' });
  }

  const uid = adminUser.uid;
  const body = req.body || {};

  // Server-side Anti-Cheating & Data Integrity Validation
  const rawXP = typeof body.totalXP === 'number' && Number.isFinite(body.totalXP) ? Math.max(0, Math.min(1000000, Math.floor(body.totalXP))) : 0;
  // Derived level cannot be forged - computed via mathematical formula
  const calculatedLevel = Math.max(1, Math.floor(Math.sqrt(rawXP / 80)) + 1);

  const rawSolved = typeof body.totalQuestionsSolved === 'number' && Number.isFinite(body.totalQuestionsSolved) ? Math.max(0, Math.min(1000000, Math.floor(body.totalQuestionsSolved))) : 0;
  const rawCorrect = typeof body.totalCorrect === 'number' && Number.isFinite(body.totalCorrect) ? Math.max(0, Math.min(rawSolved, Math.floor(body.totalCorrect))) : 0;
  const rawCoins = typeof body.coins === 'number' && Number.isFinite(body.coins) ? Math.max(0, Math.min(500000, Math.floor(body.coins))) : 0;
  const rawCurrentStreak = typeof body.currentStreak === 'number' && Number.isFinite(body.currentStreak) ? Math.max(0, Math.min(3650, Math.floor(body.currentStreak))) : 0;
  const rawLongestStreak = typeof body.longestStreak === 'number' && Number.isFinite(body.longestStreak) ? Math.max(rawCurrentStreak, Math.min(3650, Math.floor(body.longestStreak))) : rawCurrentStreak;
  const rawTimeSpent = typeof body.totalTimeSpentSeconds === 'number' && Number.isFinite(body.totalTimeSpentSeconds) ? Math.max(0, Math.min(100000000, Math.floor(body.totalTimeSpentSeconds))) : 0;

  // Deduplicate unlocked achievements to prevent multiple unlock XP exploits
  const unlocked = Array.isArray(body.unlockedAchievements)
    ? Array.from(new Set(body.unlockedAchievements.filter((a: any) => typeof a === 'string' && a.length > 0 && a.length < 100)))
    : [];

  // Enforce the authenticated UID and sanitized mathematical invariants
  const updatedProgress = {
    ...body,
    userId: uid,
    totalXP: rawXP,
    level: calculatedLevel,
    totalQuestionsSolved: rawSolved,
    totalCorrect: rawCorrect,
    coins: rawCoins,
    currentStreak: rawCurrentStreak,
    longestStreak: rawLongestStreak,
    totalTimeSpentSeconds: rawTimeSpent,
    unlockedAchievements: unlocked,
    updatedAt: new Date().toISOString(),
  };

  await persistUserProgress(uid, updatedProgress);
  return res.json({ success: true, progress: updatedProgress });
});

/**
 * POST /api/exam-arena/reset
 * Protected: Completely clears and resets Exam Arena data for the authenticated user.
 * Implements anti-abuse concurrency locking, cooldown checks, and idempotency.
 */
examArenaRouter.post('/reset', authenticateAdmin, resetRateLimiter, async (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  if (!adminUser || !adminUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: User identity not verified' });
  }

  const uid = adminUser.uid;

  // Check concurrency lock
  if (activeResetLocks.has(uid)) {
    return res.status(409).json({ error: 'A reset operation is already in progress for this account.' });
  }

  // Check rapid spam cooldown (3-second cooldown)
  const now = Date.now();
  const lastReset = lastResetTimestamp.get(uid) || 0;
  if (now - lastReset < 3000) {
    return res.status(429).json({ error: 'Please wait a few seconds before requesting another reset.' });
  }

  try {
    activeResetLocks.add(uid);
    lastResetTimestamp.set(uid, now);

    const cleanProgress = createInitialUserProgress(uid);
    await purgeUserProgress(uid, cleanProgress);

    console.log(`[ExamArena] User ${uid} (${adminUser.email || 'Admin'}) performed full Exam Arena data reset.`);

    return res.json({
      success: true,
      message: 'Exam Arena data successfully reset to ground zero',
      progress: cleanProgress,
    });
  } catch (err: any) {
    console.error('[ExamArena] Error resetting user progress:', err);
    return res.status(500).json({ error: 'Failed to reset Exam Arena progress' });
  } finally {
    activeResetLocks.delete(uid);
  }
});

/**
 * POST /api/exam-arena/record-session
 * Protected: Authoritatively records a completed exam or practice session and calculates
 * verified score, accuracy, level progression, and XP increments server-side.
 * Includes persistent distributed replay protection against duplicate submissions of the same session ID.
 */
examArenaRouter.post('/record-session', authenticateAdmin, recordSessionRateLimiter, async (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  if (!adminUser || !adminUser.uid) {
    return res.status(401).json({ error: 'Unauthorized: User identity not verified' });
  }

  const uid = adminUser.uid;
  const current = (await fetchUserProgress(uid)) || createInitialUserProgress(uid);
  const session = req.body || {};

  // Session Replay Protection: Validate and sanitize session ID
  const rawSessionId = String(session.id || session.sessionId || '').trim();
  const cleanSessionId = (rawSessionId && /^[a-zA-Z0-9_\-.:]{1,120}$/.test(rawSessionId))
    ? rawSessionId
    : ('sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

  const uniqueSessionKey = `${uid}_${cleanSessionId}`;

  // Check persistent distributed replay registry
  const alreadyProcessed = await isSessionProcessed(uniqueSessionKey);
  if (alreadyProcessed) {
    // Session already rewarded; return current state safely without incrementing rewards
    return res.json({
      success: true,
      duplicate: true,
      message: 'Session was already recorded. No duplicate rewards awarded.',
      progress: current,
      verifiedXP: 0,
      verifiedCoins: 0,
    });
  }

  const totalQuestions = Math.max(0, Math.min(200, Math.floor(Number(session.totalQuestions) || 0)));
  const correctAnswers = Math.max(0, Math.min(totalQuestions, Math.floor(Number(session.correctAnswers) || 0)));
  const timeSpentSeconds = Math.max(0, Math.min(7200, Math.floor(Number(session.timeSpentSeconds) || 0)));
  const mode = String(session.mode || 'smart_practice').slice(0, 50);
  const modeLabel = String(session.modeLabel || 'Practice Session').slice(0, 100);

  // Authoritative server-side XP and Coin formula
  // Base: 10 XP per correct, 2 XP per attempt. Capped per session to prevent flooding.
  const verifiedXP = Math.min(5000, correctAnswers * 10 + (totalQuestions - correctAnswers) * 2);
  const verifiedCoins = Math.min(500, correctAnswers * 2);
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const newTotalXP = current.totalXP + verifiedXP;
  const newLevel = Math.max(1, Math.floor(Math.sqrt(newTotalXP / 80)) + 1);
  const newSolved = current.totalQuestionsSolved + totalQuestions;
  const newCorrect = current.totalCorrect + correctAnswers;
  const newTime = current.totalTimeSpentSeconds + timeSpentSeconds;

  const sessionRecord = {
    id: cleanSessionId,
    timestamp: new Date().toISOString(),
    mode,
    modeLabel,
    totalQuestions,
    correctAnswers,
    accuracy,
    timeSpentSeconds,
    xpEarned: verifiedXP,
  };

  // Mark session ID as processed in distributed persistent store
  await markSessionProcessed(uniqueSessionKey, {
    sessionKey: uniqueSessionKey,
    userId: uid,
    sessionId: cleanSessionId,
    mode,
    totalQuestions,
    correctAnswers,
    verifiedXP,
    verifiedCoins,
    accuracy,
    timeSpentSeconds,
    createdAt: new Date().toISOString(),
  });

  const updatedHistory = [sessionRecord, ...(current.sessionHistory || [])].slice(0, 50);

  const updatedProgress = {
    ...current,
    userId: uid,
    totalXP: newTotalXP,
    level: newLevel,
    coins: current.coins + verifiedCoins,
    totalQuestionsSolved: newSolved,
    totalCorrect: newCorrect,
    totalTimeSpentSeconds: newTime,
    sessionHistory: updatedHistory,
    updatedAt: new Date().toISOString(),
  };

  await persistUserProgress(uid, updatedProgress);

  return res.json({
    success: true,
    duplicate: false,
    progress: updatedProgress,
    session: sessionRecord,
    verifiedXP,
    verifiedCoins,
  });
});

/**
 * POST /api/exam-arena/verify-answer
 * Protected: Authoritatively verifies a submitted question answer against the question dataset.
 * Protected by verifyAnswerRateLimiter to prevent automated flooding.
 */
examArenaRouter.post('/verify-answer', authenticateAdmin, verifyAnswerRateLimiter, (req: Request, res: Response) => {
  const { questionId, selectedOption } = req.body || {};
  if (!questionId || typeof selectedOption !== 'number' || !Number.isFinite(selectedOption)) {
    return res.status(400).json({ error: 'Missing questionId or valid numeric selectedOption' });
  }

  const question = (cachedQuestions || []).find((q: any) => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found in question bank' });
  }

  const isCorrect = question.correctAnswer === selectedOption;
  return res.json({
    success: true,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });
});

/**
 * GET /api/exam-arena/questions
 * Protected: Returns admin question bank
 */
examArenaRouter.get('/questions', authenticateAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, questions: cachedQuestions });
});

/**
 * POST /api/exam-arena/questions
 * Protected: Updates admin question bank
 */
examArenaRouter.post('/questions', authenticateAdmin, (req: Request, res: Response) => {
  const items = req.body?.questions || req.body?.items;
  if (Array.isArray(items)) {
    cachedQuestions = items;
  }
  return res.json({ success: true, count: cachedQuestions?.length || 0 });
});

/**
 * GET /api/exam-arena/papers
 * Protected: Returns admin papers bank
 */
examArenaRouter.get('/papers', authenticateAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, papers: cachedPapers });
});

/**
 * POST /api/exam-arena/papers
 * Protected: Updates admin papers bank
 */
examArenaRouter.post('/papers', authenticateAdmin, (req: Request, res: Response) => {
  const items = req.body?.papers || req.body?.items;
  if (Array.isArray(items)) {
    cachedPapers = items;
  }
  return res.json({ success: true, count: cachedPapers?.length || 0 });
});

/**
 * GET /api/exam-arena/config
 * Protected: Returns exam configuration
 */
examArenaRouter.get('/config', authenticateAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, config: cachedConfig });
});

/**
 * POST /api/exam-arena/config
 * Protected: Updates exam configuration
 */
examArenaRouter.post('/config', authenticateAdmin, (req: Request, res: Response) => {
  const config = req.body?.config || req.body;
  if (config) {
    cachedConfig = config;
  }
  return res.json({ success: true, config: cachedConfig });
});
