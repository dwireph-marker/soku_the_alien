import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Search,
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Sliders,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  ExamQuestion,
  ExamPaper,
  ExamConfig,
  ExamSubject,
  QuestionDifficulty,
} from '../../types/examArena';
import {
  getExamQuestions,
  saveExamQuestions,
  getExamPapers,
  saveExamPapers,
  getExamConfig,
  saveExamConfig,
} from '../../services/firestore/examArena.service';

interface ExamArenaAdminPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  openConfirm?: (title: string, msg: string, onConfirm: () => void) => void;
}

export const ExamArenaAdminPage: React.FC<ExamArenaAdminPageProps> = ({
  showToast,
  openConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<
    'questions' | 'import' | 'config'
  >('questions');

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Question Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Edit / Add Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);

  // Import text / JSON state
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<{
    detected: ExamQuestion[];
    duplicates: number;
  } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [q, p, cfg] = await Promise.all([
        getExamQuestions(),
        getExamPapers(),
        getExamConfig(),
      ]);
      setQuestions(q);
      setPapers(p);
      setConfig(cfg);
    } catch (err) {
      showToast('Failed to load Exam Arena admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Question Actions
  const handleSaveQuestion = async (q: ExamQuestion) => {
    let updated: ExamQuestion[];
    if (isNewQuestion) {
      updated = [q, ...questions];
      showToast('New question created successfully!', 'success');
    } else {
      updated = questions.map((item) => (item.id === q.id ? q : item));
      showToast('Question updated successfully!', 'success');
    }
    setQuestions(updated);
    await saveExamQuestions(updated);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    const doDelete = async () => {
      const updated = questions.filter((q) => q.id !== id);
      setQuestions(updated);
      await saveExamQuestions(updated);
      showToast('Question removed', 'info');
    };

    if (openConfirm) {
      openConfirm('Delete Question', 'Are you sure you want to delete this question?', doDelete);
    } else {
      doDelete();
    }
  };

  const handleDuplicateQuestion = async (q: ExamQuestion) => {
    const dup: ExamQuestion = {
      ...q,
      id: `q_${Date.now()}`,
      question: `${q.question} (Copy)`,
    };
    const updated = [dup, ...questions];
    setQuestions(updated);
    await saveExamQuestions(updated);
    showToast('Question duplicated', 'success');
  };

  const handleToggleVerified = async (q: ExamQuestion) => {
    const updated = questions.map((item) =>
      item.id === q.id ? { ...item, verified: !item.verified } : item
    );
    setQuestions(updated);
    await saveExamQuestions(updated);
    showToast(`Verification status updated`, 'info');
  };

  // Import Parser
  const handleAnalyzeImport = () => {
    try {
      let parsed: ExamQuestion[] = [];
      if (importText.trim().startsWith('[')) {
        parsed = JSON.parse(importText);
      } else {
        // Simple plain text lines parser fallback
        const lines = importText.split('\n').filter((l) => l.trim().length > 0);
        parsed = lines.map((line, idx) => ({
          id: `imp_${Date.now()}_${idx}`,
          exam: 'SSC_STENOGRAPHER',
          subject: 'general_awareness',
          topic: 'General Awareness',
          difficulty: 'medium',
          question: line,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Extracted from imported source.',
          sourceType: 'CURATED_PRACTICE',
          verified: false,
        }));
      }

      // Check duplicates
      let dupCount = 0;
      parsed.forEach((pq) => {
        if (questions.some((eq) => eq.question.trim().toLowerCase() === pq.question.trim().toLowerCase())) {
          dupCount += 1;
        }
      });

      setImportPreview({ detected: parsed, duplicates: dupCount });
      showToast(`Analyzed ${parsed.length} questions`, 'info');
    } catch {
      showToast('Failed to parse text. Please ensure valid JSON or question list format.', 'error');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    const combined = [...importPreview.detected, ...questions];
    setQuestions(combined);
    await saveExamQuestions(combined);
    setImportPreview(null);
    setImportText('');
    showToast(`Successfully imported ${importPreview.detected.length} questions!`, 'success');
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDiff;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-cyan-400 font-mono">
        Loading Exam Arena Management Suite...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0b1326] via-[#101b38] to-[#0a1020] border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-white tracking-wide">
              EXAM ARENA // CONTENT & SYSTEM MANAGER
            </h2>
            <p className="text-xs text-stone-400">
              Manage question banks, import exam papers & CBT schemes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsNewQuestion(true);
              setEditingQuestion({
                id: `q_${Date.now()}`,
                exam: 'SSC_STENOGRAPHER',
                subject: 'reasoning',
                topic: 'Number Series',
                difficulty: 'medium',
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
                explanation: '',
                sourceType: 'CURATED_PRACTICE',
                verified: true,
              });
            }}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-800 pb-2 overflow-x-auto">
        {[
          { id: 'questions', label: `Question Bank (${questions.length})` },
          { id: 'import', label: 'Paper & Batch Importer' },
          { id: 'config', label: 'CBT Exam Scheme Config' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-stone-900/60 text-stone-400 hover:text-white border border-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Question Bank Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search questions or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/50 border border-stone-800 text-xs text-white placeholder-stone-500 focus:border-cyan-500 outline-none"
              />
            </div>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="py-2 px-3 rounded-xl bg-black/50 border border-stone-800 text-xs text-white outline-none"
            >
              <option value="all">All Subjects</option>
              <option value="reasoning">General Intelligence & Reasoning</option>
              <option value="general_awareness">General Awareness</option>
              <option value="english_language">English Language</option>
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="py-2 px-3 rounded-xl bg-black/50 border border-stone-800 text-xs text-white outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="exam_level">Exam Level</option>
            </select>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-black/40 border border-stone-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase">
                      {q.subject}
                    </span>
                    <span className="text-stone-400">• {q.topic}</span>
                    <span className="text-amber-400 uppercase">• {q.difficulty}</span>
                    <span
                      onClick={() => handleToggleVerified(q)}
                      className={`cursor-pointer px-2 py-0.5 rounded flex items-center gap-1 ${
                        q.verified
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {q.verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {q.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-stone-200">{q.question}</p>
                  <p className="text-stone-400 text-[11px]">
                    <strong>Answer:</strong> {q.options[q.correctAnswer]}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDuplicateQuestion(q)}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsNewQuestion(false);
                      setEditingQuestion(q);
                    }}
                    className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Paper & Batch Importer */}
      {activeTab === 'import' && (
        <div className="p-6 rounded-3xl bg-black/40 border border-stone-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono text-white uppercase">
              BATCH QUESTION & PAPER EXTRACTOR
            </h3>
            <p className="text-xs text-stone-400">
              Paste JSON array of ExamQuestion objects or plain text questions (one per line). System will check for duplicates and categorize metadata.
            </p>
          </div>

          <textarea
            rows={8}
            placeholder={`[\n  {\n    "id": "q_new_1",\n    "subject": "reasoning",\n    "topic": "Analogy",\n    "difficulty": "medium",\n    "question": "...",\n    "options": ["A", "B", "C", "D"],\n    "correctAnswer": 0,\n    "explanation": "..."\n  }\n]`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full p-4 rounded-2xl bg-black/60 border border-stone-800 text-xs font-mono text-cyan-300 placeholder-stone-600 outline-none focus:border-cyan-500"
          />

          <div className="flex gap-3">
            <button
              onClick={handleAnalyzeImport}
              className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-bold uppercase"
            >
              ANALYZE & PREVIEW
            </button>
          </div>

          {importPreview && (
            <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-cyan-300 font-bold">
                  DETECTED: {importPreview.detected.length} QUESTIONS
                </span>
                <span className="text-amber-400">
                  Potential Duplicates: {importPreview.duplicates}
                </span>
              </div>

              <button
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider"
              >
                PUBLISH TO QUESTION BANK
              </button>
            </div>
          )}
        </div>
      )}

      {/* CBT Scheme Configuration */}
      {activeTab === 'config' && config && (
        <div className="p-6 rounded-3xl bg-black/40 border border-stone-800 space-y-6 text-xs font-mono">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase">
              EXAMINATION SCHEME & CBT TIMINGS CONFIGURATION
            </h3>
            <p className="text-stone-400">
              Configure SSC official notification parameters, duration, total marks and negative marking ratios without altering code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-stone-400 block mb-1">Exam Name</label>
              <input
                type="text"
                value={config.examName}
                onChange={(e) => setConfig({ ...config, examName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-stone-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={config.durationMinutes}
                onChange={(e) =>
                  setConfig({ ...config, durationMinutes: parseInt(e.target.value) || 120 })
                }
                className="w-full p-2.5 rounded-xl bg-black/60 border border-stone-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Negative Marking Ratio</label>
              <input
                type="number"
                step="0.05"
                value={config.negativeMarkingRatio}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    negativeMarkingRatio: parseFloat(e.target.value) || 0.25,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-black/60 border border-stone-800 text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Total Marks</label>
              <input
                type="number"
                value={config.totalMarks}
                onChange={(e) =>
                  setConfig({ ...config, totalMarks: parseInt(e.target.value) || 200 })
                }
                className="w-full p-2.5 rounded-xl bg-black/60 border border-stone-800 text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={async () => {
              await saveExamConfig(config);
              showToast('Exam scheme configuration saved!', 'success');
            }}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> SAVE CONFIGURATION
          </button>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f111a] border border-cyan-500/40 rounded-3xl p-6 space-y-4 text-xs font-mono text-stone-200 my-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="text-sm font-bold text-cyan-400 uppercase">
                {isNewQuestion ? 'ADD QUESTION' : 'EDIT QUESTION'}
              </span>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-stone-400 block mb-1">Subject</label>
                <select
                  value={editingQuestion.subject}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, subject: e.target.value as ExamSubject })
                  }
                  className="w-full p-2 rounded-xl bg-black/60 border border-stone-800 text-white outline-none"
                >
                  <option value="reasoning">General Intelligence & Reasoning</option>
                  <option value="general_awareness">General Awareness</option>
                  <option value="english_language">English Language & Comprehension</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Topic</label>
                <input
                  type="text"
                  value={editingQuestion.topic}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, topic: e.target.value })
                  }
                  className="w-full p-2 rounded-xl bg-black/60 border border-stone-800 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Question Statement</label>
              <textarea
                rows={3}
                value={editingQuestion.question}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, question: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-black/60 border border-stone-800 text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-stone-400 block">Answer Options</label>
              {editingQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={editingQuestion.correctAnswer === idx}
                    onChange={() =>
                      setEditingQuestion({ ...editingQuestion, correctAnswer: idx })
                    }
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...editingQuestion.options];
                      copy[idx] = e.target.value;
                      setEditingQuestion({ ...editingQuestion, options: copy });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1 p-2 rounded-xl bg-black/60 border border-stone-800 text-white outline-none"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-stone-400 block mb-1">Explanation & Solution Key</label>
              <textarea
                rows={2}
                value={editingQuestion.explanation}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                }
                className="w-full p-2 rounded-xl bg-black/60 border border-stone-800 text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveQuestion(editingQuestion)}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
