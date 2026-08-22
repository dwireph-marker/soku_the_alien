import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Camera,
  MapPin,
  FileText,
  BarChart3,
  Sliders,
  Settings,
  Sparkles,
  ExternalLink,
  Eye
} from 'lucide-react';
import {
  TreasureHuntTemplate,
  TreasureHuntGlobalSettings,
  TreasureHuntStats
} from '../../types/firestore/treasureHunt';
import {
  getTreasureHuntTemplates,
  getTreasureHuntSettings,
  updateTreasureHuntSettings,
  saveTreasureHuntTemplate,
  deleteTreasureHuntTemplate,
  getTreasureHuntStats
} from '../../services/firestore/treasureHunt.service';
import { defaultTreasureHunts } from '../../data/defaultTreasureHunts';

interface TreasureHuntAdminPageProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  openConfirm: (opts: { title: string; message: string; onConfirm: () => void }) => void;
}

export const TreasureHuntAdminPage: React.FC<TreasureHuntAdminPageProps> = ({
  showToast,
  openConfirm,
}) => {
  const [templates, setTemplates] = useState<TreasureHuntTemplate[]>([]);
  const [settings, setSettings] = useState<TreasureHuntGlobalSettings | null>(null);
  const [stats, setStats] = useState<TreasureHuntStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<TreasureHuntTemplate | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'settings' | 'analytics'>('templates');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tList, s, st] = await Promise.all([
        getTreasureHuntTemplates(),
        getTreasureHuntSettings(),
        getTreasureHuntStats(),
      ]);
      setTemplates(tList);
      setSettings(s);
      setStats(st);
    } catch (e) {
      showToast('Error loading treasure hunt configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleGlobalEnable = async () => {
    if (!settings) return;
    const updated = !settings.enabled;
    await updateTreasureHuntSettings({ enabled: updated });
    setSettings((prev) => (prev ? { ...prev, enabled: updated } : null));
    showToast(`The Secret Hunt game ${updated ? 'ENABLED' : 'DISABLED'} on live site`, 'success');
  };

  const handleToggleTemplate = async (template: TreasureHuntTemplate) => {
    const updated: TreasureHuntTemplate = {
      ...template,
      enabled: template.enabled === false ? true : false,
    };
    await saveTreasureHuntTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === template.id ? updated : t)));
    showToast(`Template "${template.title}" ${updated.enabled ? 'activated' : 'deactivated'}`, 'info');
  };

  const handleDuplicateTemplate = async (template: TreasureHuntTemplate) => {
    const newId = `hunt_${Date.now()}`;
    const duplicated: TreasureHuntTemplate = {
      ...template,
      id: newId,
      codeName: `${template.codeName} (COPY)`,
      title: `${template.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTreasureHuntTemplate(duplicated);
    setTemplates((prev) => [...prev, duplicated]);
    showToast(`Duplicated "${template.title}"`, 'success');
  };

  const handleDeleteTemplate = (template: TreasureHuntTemplate) => {
    openConfirm({
      title: 'Delete Hunt Template',
      message: `Are you sure you want to permanently delete "${template.title}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteTreasureHuntTemplate(template.id);
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        showToast('Template deleted successfully', 'success');
      },
    });
  };

  const handleSaveTemplateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    await saveTreasureHuntTemplate(editingTemplate);
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === editingTemplate.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = editingTemplate;
        return next;
      }
      return [...prev, editingTemplate];
    });
    setEditingTemplate(null);
    showToast('Hunt template saved successfully!', 'success');
  };

  const handleCreateNewTemplate = () => {
    const newTemplate: TreasureHuntTemplate = {
      id: `hunt_${Date.now()}`,
      codeName: 'OPERATION PROTOCOL',
      title: 'The Classified Incident',
      scenario: 'A high-level security breach occurred at the classified operations facility.',
      location: 'Central Command Center • Sector 7',
      clearanceLevel: 'LEVEL 4 // TOP SECRET',
      difficulty: 'medium',
      timeLimitMinutes: 10,
      enabled: true,
      playCount: 0,
      puzzleFlow: ['room_1', 'room_2', 'cam_1'],
      finalSafePrompt: 'Enter the 4-digit security code obtained from investigation findings.',
      solutionCodeFormula: 'DIGIT_1 (5) + DIGIT_2 (8) + DIGIT_3 (2) + DIGIT_4 (1)',
      defaultCode: '5821',
      rooms: [
        {
          id: 'room_1',
          code: 'RM-01',
          name: 'Main Server Room',
          x: 10,
          y: 10,
          width: 38,
          height: 38,
          securityLevel: 'HIGH',
          description: 'High-density mainframe racks with pulsing LED diagnostic arrays.',
          clueRevealed: 'The server log reveals the first digit of the vault override is 5.',
        },
        {
          id: 'room_2',
          code: 'RM-02',
          name: 'Security Archives',
          x: 52,
          y: 10,
          width: 38,
          height: 38,
          securityLevel: 'MAXIMUM',
          description: 'Archived intelligence tapes and encrypted hard drives.',
          clueRevealed: 'A shredded log slip indicates the second digit is 8.',
        },
      ],
      cctvCameras: [
        {
          id: 'cam_1',
          cameraNumber: 'CAM 01',
          name: 'Sector Corridors',
          location: 'Corridor Alpha',
          timestamp: '22:14:08',
          status: 'ONLINE',
          anomalyTimestamp: '00:28',
          anomalyDescription: 'A shadowy figure accesses the sub-level console at 22:14.',
          clueRevealed: 'Security camera confirms third digit is 2.',
        },
      ],
      evidenceCards: [
        {
          id: 'ev_1',
          title: 'Encrypted Flash Drive',
          description: 'A blue-glowing tactical thumb drive recovered from the security corridor.',
          type: 'keycard',
          iconName: 'keycard',
          content: 'Decrypted string: FOURTH_DIGIT = 1',
          isCrucial: true,
          unlockedAtStart: true,
        },
      ],
      characters: [
        {
          id: 'char_1',
          name: 'Agent Vance',
          role: 'Chief Security Officer',
          lastSeenTime: '22:00',
          lastSeenLocation: 'Surveillance Hub',
          statement: 'I was reviewing camera logs in the surveillance hub all evening.',
          timeline: ['21:30 - Briefing', '22:00 - Shift start'],
          isLying: false,
          lieIndicator: 'Timestamps align with log records.',
          status: 'CLEARED',
          revealsClue: 'Agent Vance confirms the vault lockdown commenced at 22:00.',
        },
      ],
      terminalLogs: [
        {
          id: 'term_1',
          command: 'status',
          description: 'Facility diagnostics',
          output: 'FACILITY INTEGRITY: COMPROMISED\nOVERRIDE REQUIRED: 4-DIGIT CIPHER',
        },
      ],
      finalSafeHints: [
        'Check the server room terminal finding for the first digit.',
        'Combine the 4 discovered digits in numerical sequence.',
      ],
      finalTreasure: {
        type: 'birthday_letter',
        title: 'OPERATION CLASSIFIED SUCCESS',
        message: 'Happy Birthday! You cracked the highest security mission with flying colors!',
        rewardBadge: 'MASTER SPECIAL AGENT',
        specialLoveNote: 'I love your brilliant mind and playful spirit every single day.',
      },
    };
    setEditingTemplate(newTemplate);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-400 font-mono">
        <ShieldAlert className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
        <p>Loading Secret Hunt Investigation Controller...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Standalone Investigation Engine</span>
          </div>
          <h1 className="text-xl font-bold text-stone-100">
            The Secret Hunt / Treasure Investigation Manager
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Control game availability, procedural templates, CCTV feeds, blueprint puzzles, and live player analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#treasure-hunt"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-colors font-mono"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>TEST LAUNCH GAME</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleToggleGlobalEnable}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              settings?.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings?.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{settings?.enabled ? 'GAME ACTIVE ON SITE' : 'GAME DISABLED'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ${
            activeSubTab === 'templates'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hunt Templates ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ${
            activeSubTab === 'analytics'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Investigation Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Global Engine Rules</span>
        </button>
      </div>

      {/* SUB-TAB 1: TEMPLATES */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Each time a player enters the game, one template is procedurally chosen from this pool to guarantee "Every time is a new mystery".
            </p>
            <button
              onClick={handleCreateNewTemplate}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE NEW HUNT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl p-5 hover:border-stone-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                      {tpl.codeName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tpl.difficulty === 'hard'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : tpl.difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {tpl.difficulty}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      {tpl.timeLimitMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-100">{tpl.title}</h3>
                  <p className="text-xs text-stone-400 line-clamp-1">{tpl.scenario}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400 font-mono pt-1">
                    <span>📍 {tpl.location}</span>
                    <span>🗺️ {tpl.rooms.length} Rooms</span>
                    <span>📹 {tpl.cctvCameras.length} Cameras</span>
                    <span>📑 {tpl.evidenceCards.length} Evidence</span>
                    <span>🔑 Code: <span className="text-amber-400 font-bold">{tpl.defaultCode}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleToggleTemplate(tpl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      tpl.enabled !== false
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {tpl.enabled !== false ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => setEditingTemplate(tpl)}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicateTemplate(tpl)}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                    title="Duplicate Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl)}
                    className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ANALYTICS */}
      {activeSubTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <span className="text-xs text-stone-400 uppercase font-mono">TOTAL INVESTIGATIONS</span>
              <p className="text-2xl font-bold text-stone-100 mt-1">{stats.totalPlays}</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <span className="text-xs text-stone-400 uppercase font-mono">COMPLETED CASESS</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.completed}</p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <span className="text-xs text-stone-400 uppercase font-mono">AVG SOLVE TIME</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {Math.floor(stats.averageSolveTimeSeconds / 60)}m {stats.averageSolveTimeSeconds % 60}s
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <span className="text-xs text-stone-400 uppercase font-mono">AVG HINTS USED</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.averageHintsUsed}</p>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-3 font-mono text-xs text-stone-300">
            <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider text-amber-400">
              INVESTIGATION INSIGHTS
            </h3>
            <p>• <span className="text-stone-400">Most Engaged Mystery:</span> <strong className="text-white">{stats.mostPlayedHunt}</strong></p>
            <p>• <span className="text-stone-400">Hardest Puzzle Stage:</span> <strong className="text-white">{stats.hardestPuzzle}</strong></p>
            <p>• <span className="text-stone-400">Success Completion Rate:</span> <strong className="text-emerald-400">{Math.round((stats.completed / Math.max(stats.totalPlays, 1)) * 100)}%</strong></p>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SETTINGS */}
      {activeSubTab === 'settings' && settings && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-stone-100">Global Investigation Engine Rules</h2>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-stone-400 mb-1">DEFAULT MISSION TIME LIMIT (SECONDS)</label>
              <input
                type="number"
                value={settings.defaultTimeLimit}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTimeLimit: parseInt(e.target.value) || 600 })
                }
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-950 rounded-xl border border-stone-800">
              <div>
                <p className="font-bold text-stone-200">Investigation Hints System</p>
                <p className="text-stone-400 text-[11px]">Allow player to request up to {settings.maxHints || 3} classified hints.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.hintsEnabled}
                onChange={(e) => setSettings({ ...settings, hintsEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-950 rounded-xl border border-stone-800">
              <div>
                <p className="font-bold text-stone-200">Enable Sound & Radar Synthesizer</p>
                <p className="text-stone-400 text-[11px]">Play audio beeps, keystroke clicks, and CCTV camera static.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundFxEnabled}
                onChange={(e) => setSettings({ ...settings, soundFxEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-stone-950 rounded-xl border border-stone-800">
              <div>
                <p className="font-bold text-stone-200">Ambient Background Audio Drone</p>
                <p className="text-stone-400 text-[11px]">Generate high-tech low-frequency ambient hum.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ambientAudioEnabled}
                onChange={(e) => setSettings({ ...settings, ambientAudioEnabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            <button
              onClick={async () => {
                await updateTreasureHuntSettings(settings);
                showToast('Global settings saved successfully', 'success');
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase transition-colors"
            >
              SAVE GLOBAL SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATE EDIT MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 text-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-400" />
              <span>Edit Hunt Template: {editingTemplate.title}</span>
            </h2>

            <form onSubmit={handleSaveTemplateForm} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">CODE NAME</label>
                  <input
                    type="text"
                    value={editingTemplate.codeName}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, codeName: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">TITLE</label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">SCENARIO BRIEFING</label>
                <textarea
                  rows={3}
                  value={editingTemplate.scenario}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, scenario: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">LOCATION</label>
                  <input
                    type="text"
                    value={editingTemplate.location}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, location: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">DEFAULT CODE (4 DIGITS)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editingTemplate.defaultCode}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultCode: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">TIME (MINS)</label>
                  <input
                    type="number"
                    value={editingTemplate.timeLimitMinutes}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        timeLimitMinutes: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                  />
                </div>
              </div>

              {/* Final Birthday Message */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                <span className="text-amber-400 font-bold uppercase text-[11px]">
                  SECRET BIRTHDAY TREASURE PAYLOAD
                </span>
                <div>
                  <label className="block text-stone-400 mb-1">MESSAGE</label>
                  <textarea
                    rows={2}
                    value={editingTemplate.finalTreasure?.message || ''}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        finalTreasure: {
                          ...editingTemplate.finalTreasure,
                          title: editingTemplate.finalTreasure?.title || 'CLASSIFIED SUCCESS',
                          message: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">SPECIAL LOVE NOTE</label>
                  <input
                    type="text"
                    value={editingTemplate.finalTreasure?.specialLoveNote || ''}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        finalTreasure: {
                          ...editingTemplate.finalTreasure,
                          title: editingTemplate.finalTreasure?.title || 'CLASSIFIED SUCCESS',
                          message: editingTemplate.finalTreasure?.message || '',
                          specialLoveNote: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
