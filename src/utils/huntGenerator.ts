import {
  TreasureHuntTemplate,
  TreasureHuntInstance,
  HuntGameState,
} from '../types/firestore/treasureHunt';
import {
  getRecentlyPlayedHunts,
  recordPlayedHuntId,
  clearRecentHuntsHistory,
  saveHuntInstance,
  getActiveHuntInstance,
  clearActiveHuntInstance,
} from '../services/firestore/treasureHunt.service';

const ACTIVE_INSTANCE_KEY = 'secret_hunt_active_instance';

/**
 * SHA-like fast deterministic hash for client-side solution verification
 * Protects solution codes from casual DOM/JavaScript inspection.
 */
export function hashSolution(code: string): string {
  const normalized = (code || '').trim();
  const salt = 'CLASSIFIED_SALT_SH_2026_X9';
  let hash = 0x811c9dc5;
  for (let i = 0; i < (normalized + salt).length; i++) {
    hash ^= (normalized + salt).charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculates elapsed seconds in the hunt based on start timestamp.
 */
export function getElapsedSeconds(instance: TreasureHuntInstance): number {
  if (instance.status === 'completed' && instance.solveDurationSeconds) {
    return instance.solveDurationSeconds;
  }
  const start = instance.startedAt || instance.startTime || Date.now();
  return Math.max(0, Math.floor((Date.now() - start) / 1000));
}

/**
 * Backward compatibility alias for remaining seconds (now unlimited).
 */
export function getRemainingSeconds(instance: TreasureHuntInstance): number {
  return 999999;
}

/**
 * Selects the next hunt template using an anti-repetition pool.
 */
export function selectNextTemplate(
  templates: TreasureHuntTemplate[],
  currentTemplateId?: string
): TreasureHuntTemplate {
  const enabledTemplates = templates.filter((t) => t.enabled !== false);
  const pool = enabledTemplates.length > 0 ? enabledTemplates : templates;

  const recentIds = getRecentlyPlayedHunts();
  let candidatePool = pool.filter((t) => !recentIds.includes(t.id));

  // If all templates were played or only current remains, reset history pool
  if (candidatePool.length === 0 || (candidatePool.length === 1 && candidatePool[0].id === currentTemplateId && pool.length > 1)) {
    clearRecentHuntsHistory();
    candidatePool = pool.filter((t) => t.id !== currentTemplateId);
    if (candidatePool.length === 0) candidatePool = pool;
  }

  // Pick random candidate
  const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)] || pool[0];
  recordPlayedHuntId(selected.id);
  return selected;
}

/**
 * Creates a brand new playthrough instance for a chosen template.
 */
export function createNewHuntInstance(
  template: TreasureHuntTemplate,
  timeLimitMinutes?: number
): TreasureHuntInstance {
  const now = Date.now();
  const limitMinutes = timeLimitMinutes || template.timeLimitMinutes || 12;
  const timeLimitSeconds = limitMinutes * 60;
  const expiresAt = now + timeLimitSeconds * 1000;

  const finalCode = template.defaultCode || '4827';
  const codeHash = hashSolution(finalCode);

  const initialEvidence = template.evidenceCards
    ? template.evidenceCards.filter((e) => e.unlockedAtStart).map((e) => e.id)
    : [];

  const instance: TreasureHuntInstance = {
    instanceId: `inst_${now}_${Math.random().toString(36).substring(2, 8)}`,
    templateId: template.id,
    codeName: template.codeName,
    title: template.title,
    startedAt: now,
    expiresAt: expiresAt,
    startTime: now,
    timeLimitSeconds: timeLimitSeconds,
    status: 'active',
    currentTab: 'dossier',
    codeHash: codeHash,
    cluesFound: [
      `MISSION INITIATED: ${template.codeName} • ${template.location}`,
    ],
    evidenceCollected: initialEvidence,
    evidenceLinked: [],
    investigatedRooms: [],
    inspectedCharacters: [],
    inspectedCCTVCams: [],
    terminalCommandsRun: [],
    activeObjective: 'Inspect blueprint rooms and review CCTV camera feeds for temporal anomalies.',
    hintsUsed: 0,
    maxHints: template.finalSafeHints?.length || 3,
    templateSnapshot: {
      id: template.id,
      codeName: template.codeName,
      title: template.title,
      scenario: template.scenario,
      location: template.location,
      clearanceLevel: template.clearanceLevel,
      difficulty: template.difficulty,
      defaultCode: template.defaultCode,
      finalTreasure: template.finalTreasure,
    },
  };

  saveHuntInstance(instance);
  return instance;
}

/**
 * Restores the active game instance if one exists, or creates a new one.
 */
export async function initializeOrRestoreHunt(
  templates: TreasureHuntTemplate[],
  forceNew: boolean = false
): Promise<{ instance: TreasureHuntInstance; template: TreasureHuntTemplate }> {
  if (!forceNew) {
    const existing = await getActiveHuntInstance();
    if (existing && (existing.status === 'active' || existing.status === 'paused' || existing.status === 'idle' || existing.status === 'expired')) {
      const matchedTemplate =
        templates.find((t) => t.id === existing.templateId) ||
        (existing.templateSnapshot as TreasureHuntTemplate) ||
        templates[0];

      if (existing.status === 'expired') {
        existing.status = 'active';
        await saveHuntInstance(existing);
      }

      return { instance: existing, template: matchedTemplate };
    }
  }

  // Create fresh instance
  const selectedTemplate = selectNextTemplate(templates);
  const newInstance = createNewHuntInstance(selectedTemplate);
  return { instance: newInstance, template: selectedTemplate };
}

export {
  saveHuntInstance as saveActiveInstance,
  clearActiveHuntInstance as clearActiveInstance,
};
