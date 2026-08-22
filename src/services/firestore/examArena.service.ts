import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
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

const QUESTIONS_KEY = 'exam_arena_questions_v1';
const PAPERS_KEY = 'exam_arena_papers_v1';
const CURRENT_AFFAIRS_KEY = 'exam_arena_current_affairs_v1';
const USER_PROGRESS_KEY = 'exam_arena_user_progress_v2';
const CONFIG_KEY = 'exam_arena_config_v2';

export const initialUserProgress: ExamUserProgress = {
  userId: 'local_user_steno',
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
};

// ==========================================
// QUESTIONS GET & SAVE
// ==========================================
export async function getExamQuestions(): Promise<ExamQuestion[]> {
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
    console.debug('Exam questions Firestore sync status:', err);
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
    console.debug('Exam papers Firestore sync status:', err);
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
    console.debug('Current affairs Firestore sync status:', err);
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
// USER PROGRESS GET & SAVE
// ==========================================
export async function getUserProgress(): Promise<ExamUserProgress> {
  try {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(USER_PROGRESS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    if (db) {
      const docRef = doc(db, 'examArena', 'userProgress_main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ExamUserProgress;
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (err) {
    console.debug('User progress Firestore sync status:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(initialUserProgress));
  }
  return initialUserProgress;
}

export async function saveUserProgress(progress: ExamUserProgress): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(progress));
  }

  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'userProgress_main');
      await setDoc(docRef, { ...progress, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to sync user progress to Firestore:', err);
    }
  }
}

export async function resetUserProgressToBeginning(): Promise<ExamUserProgress> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_PROGRESS_KEY);
    localStorage.removeItem('exam_arena_user_progress_v1');
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(initialUserProgress));
  }
  if (db) {
    try {
      const docRef = doc(db, 'examArena', 'userProgress_main');
      await setDoc(docRef, { ...initialUserProgress, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.debug('Failed to reset user progress in Firestore:', err);
    }
  }
  return initialUserProgress;
}

// ==========================================
// EXAM CONFIG GET & SAVE
// ==========================================
export async function getExamConfig(): Promise<ExamConfig> {
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
    console.debug('Exam config Firestore sync status:', err);
  }

  return defaultExamConfig;
}

export async function saveExamConfig(config: ExamConfig): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
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
