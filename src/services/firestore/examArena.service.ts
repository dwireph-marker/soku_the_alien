import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase/client';
import {
  ExamQuestion,
  ExamPaper,
  CurrentAffairsItem,
  ExamUserProgress,
  ExamConfig,
} from '../../types/examArena';
import { defaultExamQuestions } from '../../data/examQuestionsData';
import { defaultExamPapers } from '../../data/examPapersData';
import { defaultCurrentAffairs, defaultExamConfig } from '../../data/examCurrentAffairsData';
import { getActiveFirebaseIdToken } from '../../hooks/useAdminAuth';

const QUESTIONS_KEY = 'exam_arena_questions_v1';
const PAPERS_KEY = 'exam_arena_papers_v1';
const CURRENT_AFFAIRS_KEY = 'exam_arena_current_affairs_v1';
const CONFIG_KEY = 'exam_arena_config_v2';

const getUserProgressKey = (uid?: string) => `exam_arena_user_progress_${uid || auth?.currentUser?.uid || 'guest'}`;

export const getInitialUserProgress = (uid?: string): ExamUserProgress => ({
  userId: uid || auth?.currentUser?.uid || 'aspirant_user',
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

export const initialUserProgress: ExamUserProgress = getInitialUserProgress();

// ==========================================
// QUESTIONS GET & SAVE
// ==========================================
export async function getExamQuestions(): Promise<ExamQuestion[]> {
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      const res = await fetch('/api/exam-arena/questions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.questions) && data.questions.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(QUESTIONS_KEY, JSON.stringify(data.questions));
          }
          return data.questions;
        }
      }
    }
  } catch (err) {
    console.debug('[ExamArena] API questions fetch status:', err);
  }

  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(QUESTIONS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= defaultExamQuestions.length) {
          return parsed;
        }
      }
    }

    if (db) {
      const docRef = doc(db, 'examArena', 'questions');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.items) {
        const items = snap.data().items as ExamQuestion[];
        if (Array.isArray(items) && items.length >= defaultExamQuestions.length) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(QUESTIONS_KEY, JSON.stringify(items));
          }
          return items;
        }
      }
    }
  } catch (err) {
    console.debug('Exam questions sync status:', err);
  }

  // Seed default bank
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(defaultExamQuestions));
  }
  return defaultExamQuestions;
}

export async function saveExamQuestions(questions: ExamQuestion[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  }

  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      await fetch('/api/exam-arena/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions }),
      });
    }
  } catch (err) {
    console.debug('[ExamArena] API questions save error:', err);
  }

  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'questions');
      await setDoc(docRef, { items: questions, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync questions to Firestore:', err);
    }
  }
}

// ==========================================
// PAPERS GET & SAVE
// ==========================================
export async function getExamPapers(): Promise<ExamPaper[]> {
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      const res = await fetch('/api/exam-arena/papers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.papers) && data.papers.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(PAPERS_KEY, JSON.stringify(data.papers));
          }
          return data.papers;
        }
      }
    }
  } catch (err) {
    console.debug('[ExamArena] API papers fetch status:', err);
  }

  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PAPERS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= defaultExamPapers.length) {
          return parsed;
        }
      }
    }

    if (db) {
      const docRef = doc(db, 'examArena', 'papers');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.items) {
        const items = snap.data().items as ExamPaper[];
        if (Array.isArray(items) && items.length >= defaultExamPapers.length) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(PAPERS_KEY, JSON.stringify(items));
          }
          return items;
        }
      }
    }
  } catch (err) {
    console.debug('Exam papers sync status:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(PAPERS_KEY, JSON.stringify(defaultExamPapers));
  }
  return defaultExamPapers;
}

export async function saveExamPapers(papers: ExamPaper[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PAPERS_KEY, JSON.stringify(papers));
  }

  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      await fetch('/api/exam-arena/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ papers }),
      });
    }
  } catch (err) {
    console.debug('[ExamArena] API papers save error:', err);
  }

  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'papers');
      await setDoc(docRef, { items: papers, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync papers to Firestore:', err);
    }
  }
}

// ==========================================
// CURRENT AFFAIRS GET & SAVE
// ==========================================
export async function getCurrentAffairs(): Promise<CurrentAffairsItem[]> {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CURRENT_AFFAIRS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    if (db) {
      const docRef = doc(db, 'examArena', 'currentAffairs');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data()?.items) {
        const items = snap.data().items as CurrentAffairsItem[];
        if (typeof window !== 'undefined') {
          localStorage.setItem(CURRENT_AFFAIRS_KEY, JSON.stringify(items));
        }
        return items;
      }
    }
  } catch (err) {
    console.debug('Current affairs sync status:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_AFFAIRS_KEY, JSON.stringify(defaultCurrentAffairs));
  }
  return defaultCurrentAffairs;
}

export async function saveCurrentAffairs(items: CurrentAffairsItem[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_AFFAIRS_KEY, JSON.stringify(items));
  }

  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'currentAffairs');
      await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync current affairs to Firestore:', err);
    }
  }
}

// ==========================================
// USER PROGRESS GET, SAVE & RESET
// ==========================================
export async function getUserProgress(userId?: string): Promise<ExamUserProgress> {
  const effectiveUid = userId || auth?.currentUser?.uid || 'guest';
  const progressKey = getUserProgressKey(effectiveUid);

  // 1. Try Backend Protected API first
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      const res = await fetch('/api/exam-arena/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.progress) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(progressKey, JSON.stringify(data.progress));
          }
          return data.progress;
        }
      }
    }
  } catch (err) {
    console.debug('[ExamArena] API user progress fetch status:', err);
  }

  // 2. Local Storage Cache
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(progressKey) || localStorage.getItem('exam_arena_user_progress_v2');
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (err) {
    console.debug('[ExamArena] Cache read error:', err);
  }

  // 3. Firestore Document
  if (db && effectiveUid !== 'guest') {
    try {
      const docRef = doc(db, 'examArena_progress', effectiveUid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ExamUserProgress;
        if (typeof window !== 'undefined') {
          localStorage.setItem(progressKey, JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.debug('User progress Firestore sync status:', err);
    }
  }

  const initial = getInitialUserProgress(effectiveUid);
  if (typeof window !== 'undefined') {
    localStorage.setItem(progressKey, JSON.stringify(initial));
  }
  return initial;
}

export async function saveUserProgress(progress: ExamUserProgress): Promise<void> {
  const effectiveUid = progress.userId || auth?.currentUser?.uid || 'guest';
  const progressKey = getUserProgressKey(effectiveUid);

  if (typeof window !== 'undefined') {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    localStorage.setItem('exam_arena_user_progress_v2', JSON.stringify(progress));
  }

  // Sync to Backend Protected API
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      await fetch('/api/exam-arena/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(progress),
      });
    }
  } catch (err) {
    console.debug('[ExamArena] API user progress save error:', err);
  }

  // Sync to Firestore
  if (db && effectiveUid !== 'guest') {
    try {
      const docRef = doc(db, 'examArena_progress', effectiveUid);
      await setDoc(docRef, { ...progress, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync user progress to Firestore:', err);
    }
  }
}

/**
 * Submits a completed exam or practice session for authoritative server-side validation,
 * score calculation, and progress incrementing.
 */
export async function recordVerifiedSessionOnServer(session: {
  mode: string;
  modeLabel: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
}): Promise<ExamUserProgress | null> {
  try {
    const token = await getActiveFirebaseIdToken();
    if (!token) return null;

    const res = await fetch('/api/exam-arena/record-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(session),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.progress) {
        const effectiveUid = data.progress.userId || auth?.currentUser?.uid || 'guest';
        const progressKey = getUserProgressKey(effectiveUid);
        if (typeof window !== 'undefined') {
          localStorage.setItem(progressKey, JSON.stringify(data.progress));
          localStorage.setItem('exam_arena_user_progress_v2', JSON.stringify(data.progress));
        }
        if (db && effectiveUid !== 'guest') {
          const docRef = doc(db, 'examArena_progress', effectiveUid);
          await setDoc(docRef, { ...data.progress, updatedAt: new Date().toISOString() });
        }
        return data.progress;
      }
    }
  } catch (err) {
    console.debug('[ExamArena] Record session API error:', err);
  }
  return null;
}

/**
 * Completely resets Exam Arena stats, performance, achievements, streak, XP & question history
 * to ground zero for the authenticated admin user.
 */
export async function resetUserProgressToBeginning(userId?: string): Promise<ExamUserProgress> {
  const effectiveUid = userId || auth?.currentUser?.uid || 'guest';
  const cleanProgress = getInitialUserProgress(effectiveUid);

  // 1. Clear Local Storage keys associated with Exam Arena
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(getUserProgressKey(effectiveUid));
      localStorage.removeItem('exam_arena_user_progress_v1');
      localStorage.removeItem('exam_arena_user_progress_v2');
      localStorage.removeItem('exam_arena_user_progress_guest');

      // Clear any session history / state caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('exam_arena_session_') || key.startsWith('exam_arena_user_progress_'))) {
          localStorage.removeItem(key);
        }
      }

      localStorage.setItem(getUserProgressKey(effectiveUid), JSON.stringify(cleanProgress));
    } catch (e) {
      console.warn('Error clearing localStorage for Exam Arena:', e);
    }
  }

  // 2. Call Backend Protected API to reset on server
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      await fetch('/api/exam-arena/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (err) {
    console.debug('[ExamArena] Backend reset request note:', err);
  }

  // 3. Reset in Firestore
  if (db && effectiveUid !== 'guest') {
    try {
      const docRef = doc(db, 'examArena_progress', effectiveUid);
      await setDoc(docRef, { ...cleanProgress, updatedAt: new Date().toISOString() });
      const fallbackRef = doc(db, 'examArena', `userProgress_${effectiveUid}`);
      await setDoc(fallbackRef, { ...cleanProgress, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to reset user progress in Firestore:', err);
    }
  }

  return cleanProgress;
}

// ==========================================
// EXAM CONFIG GET & SAVE
// ==========================================
export async function getExamConfig(): Promise<ExamConfig> {
  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      const res = await fetch('/api/exam-arena/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.config) {
          return data.config;
        }
      }
    }
  } catch (err) {
    console.debug('[ExamArena] API config fetch status:', err);
  }

  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CONFIG_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    if (db) {
      const docRef = doc(db, 'examArena', 'config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as ExamConfig;
      }
    }
  } catch (err) {
    console.debug('Exam config sync status:', err);
  }

  return defaultExamConfig;
}

export async function saveExamConfig(config: ExamConfig): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  try {
    const token = await getActiveFirebaseIdToken();
    if (token) {
      await fetch('/api/exam-arena/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      });
    }
  } catch (err) {
    console.debug('[ExamArena] API config save error:', err);
  }

  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'config');
      await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync exam config to Firestore:', err);
    }
  }
}
