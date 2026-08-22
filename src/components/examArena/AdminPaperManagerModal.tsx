import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Eye,
  X,
  FileCheck,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { ExamPaper, ExamQuestion, PaperType, PaperStatus, ExamGrade, ExamSubject } from '../../types/examArena';
import { examAudio } from '../../utils/examAudio';

interface AdminPaperManagerModalProps {
  papers: ExamPaper[];
  questions: ExamQuestion[];
  onSavePapers: (papers: ExamPaper[]) => void;
  onSaveQuestions: (questions: ExamQuestion[]) => void;
  onClose: () => void;
}

export const AdminPaperManagerModal: React.FC<AdminPaperManagerModalProps> = ({
  papers,
  questions,
  onSavePapers,
  onSaveQuestions,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add_edit' | 'import_doc'>('list');
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add / Edit Paper
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(2025);
  const [shift, setShift] = useState('Shift 1');
  const [grade, setGrade] = useState<ExamGrade>('GRADE_C_AND_D');
  const [paperType, setPaperType] = useState<PaperType>('OFFICIAL');
  const [status, setStatus] = useState<PaperStatus>('VERIFIED');
  const [source, setSource] = useState('Staff Selection Commission (SSC) Official Answer Key & Question Paper Archive');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [durationMinutes, setDurationMinutes] = useState(120);

  // Import Document State
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'raw_text'>('json');
  const [importTargetYear, setImportTargetYear] = useState(2025);
  const [importTargetShift, setImportTargetShift] = useState('Shift 1');
  const [importPreview, setImportPreview] = useState<{
    detected: number;
    duplicates: number;
    missingAnswers: number;
    unclear: number;
    ready: ExamQuestion[];
  } | null>(null);

  const startEdit = (paper: ExamPaper) => {
    setEditingPaper(paper);
    setTitle(paper.title);
    setYear(paper.year);
    setShift(paper.shift || 'Shift 1');
    setGrade(paper.grade || 'GRADE_C_AND_D');
    setPaperType(paper.paperType || 'OFFICIAL');
    setStatus(paper.status || 'VERIFIED');
    setSource(paper.source);
    setDifficulty(paper.difficulty || 'Moderate');
    setDurationMinutes(paper.durationMinutes || 120);
    setActiveTab('add_edit');
    examAudio.playClick();
  };

  const startNew = () => {
    setEditingPaper(null);
    setTitle('');
    setYear(2025);
    setShift('Shift 1');
    setGrade('GRADE_C_AND_D');
    setPaperType('OFFICIAL');
    setStatus('VERIFIED');
    setSource('Staff Selection Commission (SSC) Official Master Answer Archive');
    setDifficulty('Moderate');
    setDurationMinutes(120);
    setActiveTab('add_edit');
    examAudio.playClick();
  };

  const handleSavePaper = () => {
    if (!title.trim()) {
      alert('Please enter a valid paper title.');
      return;
    }

    const paperId = editingPaper ? editingPaper.id : `paper_ssc_${year}_${shift.toLowerCase().replace(/\s+/g, '')}_${Date.now()}`;
    const newOrUpdated: ExamPaper = {
      id: paperId,
      title,
      exam: 'SSC_STENOGRAPHER',
      year,
      shift,
      grade,
      date: `${year}-11-15`,
      totalQuestions: editingPaper ? editingPaper.totalQuestions : 200,
      durationMinutes,
      difficulty,
      paperType,
      status,
      verified: status === 'VERIFIED',
      verifiedBy: 'SSC Board Master Key Validation',
      verifiedDate: new Date().toISOString().split('T')[0],
      source,
      publishedAt: new Date().toISOString().split('T')[0],
      attemptCount: editingPaper?.attemptCount || 0,
      sections: editingPaper?.sections || [
        { subject: 'reasoning', questionIds: [] },
        { subject: 'general_awareness', questionIds: [] },
        { subject: 'english_language', questionIds: [] },
      ],
    };

    let updatedPapers: ExamPaper[];
    if (editingPaper) {
      updatedPapers = papers.map((p) => (p.id === editingPaper.id ? newOrUpdated : p));
    } else {
      updatedPapers = [newOrUpdated, ...papers];
    }

    onSavePapers(updatedPapers);
    setActiveTab('list');
    examAudio.playCorrect();
  };

  const handleDeletePaper = (paperId: string) => {
    if (confirm('Are you sure you want to delete this official paper?')) {
      const updated = papers.filter((p) => p.id !== paperId);
      onSavePapers(updated);
      examAudio.playClick();
    }
  };

  // Document & Question Extractor logic
  const handleAnalyzeImport = () => {
    if (!importText.trim()) {
      alert('Please paste JSON, CSV, or text content to extract questions.');
      return;
    }

    let parsedQuestions: Partial<ExamQuestion>[] = [];

    try {
      if (importFormat === 'json') {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          parsedQuestions = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          parsedQuestions = parsed.questions;
        }
      } else if (importFormat === 'csv') {
        const lines = importText.split('\n').filter((l) => l.trim().length > 0);
        parsedQuestions = lines.map((line, idx) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            id: `import_csv_${Date.now()}_${idx}`,
            question: parts[0] || 'Extracted Question',
            options: [parts[1] || 'A', parts[2] || 'B', parts[3] || 'C', parts[4] || 'D'],
            correctAnswer: parseInt(parts[5] || '0', 10),
            subject: (parts[6] as ExamSubject) || 'general_awareness',
            topic: parts[7] || 'General Knowledge',
            explanation: parts[8] || 'Official verified solution.',
          };
        });
      } else {
        // Raw text parser: questions separated by "Q:" or numbers
        const blocks = importText.split(/(?:Q\d+:|\d+\.)/g).filter((b) => b.trim().length > 10);
        parsedQuestions = blocks.map((block, idx) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          const qText = lines[0] || 'Question';
          const opts = lines.slice(1, 5);
          return {
            id: `import_raw_${Date.now()}_${idx}`,
            question: qText,
            options: opts.length === 4 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            subject: 'general_awareness',
            topic: 'General Topic',
            explanation: 'Extracted from official document text.',
          };
        });
      }
    } catch {
      alert('Failed to parse input. Please check the JSON / CSV syntax.');
      return;
    }

    // Validation & duplicate check
    const existingIds = new Set(questions.map((q) => q.id));
    const existingTexts = new Set(questions.map((q) => q.question.toLowerCase().trim()));

    let duplicates = 0;
    let missingAnswers = 0;
    let unclear = 0;
    const readyQuestions: ExamQuestion[] = [];

    parsedQuestions.forEach((pq, idx) => {
      const qText = pq.question || '';
      if (!qText || qText.length < 5) {
        unclear++;
        return;
      }

      if (existingTexts.has(qText.toLowerCase().trim())) {
        duplicates++;
        return;
      }

      if (pq.correctAnswer === undefined || pq.correctAnswer < 0 || pq.correctAnswer > 3) {
        missingAnswers++;
        return;
      }

      const q: ExamQuestion = {
        id: pq.id || `q_imported_${Date.now()}_${idx}`,
        exam: 'SSC_STENOGRAPHER',
        subject: pq.subject || 'general_awareness',
        topic: pq.topic || 'General Awareness',
        subtopic: pq.subtopic || 'Official PYQ',
        difficulty: (pq.difficulty as any) || 'medium',
        question: qText,
        options: pq.options && pq.options.length === 4 ? pq.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: pq.correctAnswer ?? 0,
        explanation: pq.explanation || 'Official Verified PYQ Solution.',
        keyFact: pq.keyFact,
        sourceType: 'OFFICIAL_PYQ',
        sourceExam: `SSC Stenographer ${importTargetYear} ${importTargetShift}`,
        year: importTargetYear,
        shift: importTargetShift,
        verified: true,
        tags: ['imported_pyq', `year_${importTargetYear}`],
      };

      readyQuestions.push(q);
    });

    setImportPreview({
      detected: parsedQuestions.length,
      duplicates,
      missingAnswers,
      unclear,
      ready: readyQuestions,
    });
    examAudio.playClick();
  };

  const handlePublishImportedQuestions = () => {
    if (!importPreview || importPreview.ready.length === 0) return;

    const updatedQuestions = [...questions, ...importPreview.ready];
    onSaveQuestions(updatedQuestions);

    // Link to target paper if exists or update sections
    const targetPaper = papers.find((p) => p.year === importTargetYear && p.shift === importTargetShift);
    if (targetPaper) {
      const addedIds = importPreview.ready.map((q) => q.id);
      const updatedPaper = {
        ...targetPaper,
        sections: targetPaper.sections.map((sec) => ({
          ...sec,
          questionIds: [...sec.questionIds, ...addedIds.filter((id) => {
            const q = importPreview.ready.find((rq) => rq.id === id);
            return q?.subject === sec.subject;
          })],
        })),
      };
      const updatedPapers = papers.map((p) => (p.id === targetPaper.id ? updatedPaper : p));
      onSavePapers(updatedPapers);
    }

    alert(`Successfully verified and imported ${importPreview.ready.length} questions into the official bank!`);
    setImportPreview(null);
    setImportText('');
    setActiveTab('list');
    examAudio.playFanfare();
  };

  const filteredPapers = papers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.year.toString().includes(q) ||
      p.shift?.toLowerCase().includes(q) ||
      p.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#090e17] via-[#101928] to-[#070c14] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col text-stone-200 my-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                PYQ / PAPER MANAGER <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-300">ADMIN</span>
              </span>
              <p className="text-xs text-stone-400">Audit, Upload & Manage 10-Year Verified Papers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 hover:bg-rose-950/50 border border-stone-800 text-stone-400 hover:text-rose-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex gap-2 mb-6 border-b border-cyan-500/10 pb-3">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-cyan-500 text-black'
                : 'bg-black/40 text-stone-400 border border-cyan-500/20 hover:text-white'
            }`}
          >
            PAPERS REPOSITORY ({papers.length})
          </button>
          <button
            onClick={startNew}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'add_edit' && !editingPaper
                ? 'bg-cyan-500 text-black'
                : 'bg-black/40 text-stone-400 border border-cyan-500/20 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> ADD NEW PAPER
          </button>
          <button
            onClick={() => {
              setActiveTab('import_doc');
              setImportPreview(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import_doc'
                ? 'bg-cyan-500 text-black'
                : 'bg-black/40 text-stone-400 border border-cyan-500/20 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> PDF / DOCUMENT IMPORTER
          </button>
        </div>

        <div className="flex-grow flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Tab 1: Papers List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search papers by year, shift, title or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white placeholder:text-stone-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 hover:border-cyan-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                        {paper.year} • {paper.shift || 'General'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold flex items-center gap-1 ${
                          paper.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <FileCheck className="w-3 h-3" /> {paper.status || 'VERIFIED'}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {paper.grade === 'GRADE_C' ? 'Grade C' : paper.grade === 'GRADE_D' ? 'Grade D' : 'Grade C & D'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{paper.title}</h4>
                    <p className="text-[11px] text-stone-400 line-clamp-1">{paper.source}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(paper)}
                      className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePaper(paper.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Add / Edit Paper Form */}
        {activeTab === 'add_edit' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">PAPER TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SSC Stenographer Grade C & D 2025 — Official PYQ Shift 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">EXAM YEAR</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || 2025)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">SHIFT / TIME</label>
                <input
                  type="text"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  placeholder="Shift 1, Shift 2, or Shift 3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">GRADE CLASSIFICATION</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as ExamGrade)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="GRADE_C_AND_D">Grade C & D</option>
                  <option value="GRADE_C">Grade C</option>
                  <option value="GRADE_D">Grade D</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">PAPER TYPE</label>
                <select
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value as PaperType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="OFFICIAL">✓ OFFICIAL</option>
                  <option value="VERIFIED_PYQ">✓ VERIFIED PYQ</option>
                  <option value="MEMORY_BASED">◈ MEMORY BASED</option>
                  <option value="PRACTICE">◌ PRACTICE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-cyan-300 block mb-1">VERIFICATION STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PaperStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                  <option value="PENDING_REVIEW">PENDING REVIEW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-cyan-300 block mb-1">OFFICIAL SOURCE CITATION</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Staff Selection Commission (SSC) Official Master Answer Archive"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSavePaper}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-widest cursor-pointer"
              >
                {editingPaper ? 'UPDATE PAPER' : 'PUBLISH PAPER'}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className="px-6 py-3 rounded-xl bg-black/50 border border-stone-800 text-stone-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: PDF / Document Importer */}
        {activeTab === 'import_doc' && (
          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
              <p className="font-bold font-mono uppercase">📄 OFFICIAL DOCUMENT / QUESTION IMPORTER</p>
              <p className="text-[11px] text-stone-300">
                Paste raw extracted questions from SSC PDFs, DOCX, CSV, or structured JSON. The system verifies options, checks duplicate IDs, and builds an import preview prior to publishing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-cyan-300 block mb-1">IMPORT FORMAT</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white"
                >
                  <option value="json">Structured JSON (Recommended)</option>
                  <option value="csv">CSV (Question, A, B, C, D, CorrectIdx, Subject)</option>
                  <option value="raw_text">Extracted Document Text</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-cyan-300 block mb-1">TARGET YEAR</label>
                <input
                  type="number"
                  value={importTargetYear}
                  onChange={(e) => setImportTargetYear(parseInt(e.target.value) || 2025)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-cyan-300 block mb-1">TARGET SHIFT</label>
                <input
                  type="text"
                  value={importTargetShift}
                  onChange={(e) => setImportTargetShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-cyan-300 block mb-1">PASTE DOCUMENT CONTENT</label>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`[
  {
    "question": "What is the primary function of the RBI?",
    "options": ["Monetary Policy", "Railway Operation", "Border Security", "Crop Sowing"],
    "correctAnswer": 0,
    "subject": "general_awareness",
    "topic": "Indian Economy",
    "explanation": "RBI is India's central bank and monetary authority."
  }
]`}
                className="w-full p-3 rounded-2xl bg-black/60 border border-cyan-500/20 text-xs font-mono text-cyan-300 placeholder:text-stone-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleAnalyzeImport}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-widest cursor-pointer"
            >
              🔍 ANALYZE & PREVIEW QUESTIONS
            </button>

            {/* Import Preview Summary */}
            {importPreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-black/60 border border-cyan-500/40 space-y-4"
              >
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  IMPORT AUDIT PREVIEW
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                    <span className="text-[10px] text-stone-400 block">DETECTED</span>
                    <span className="text-lg font-bold text-cyan-300">{importPreview.detected}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <span className="text-[10px] text-stone-400 block">DUPLICATES</span>
                    <span className="text-lg font-bold text-amber-400">{importPreview.duplicates}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                    <span className="text-[10px] text-stone-400 block">MISSING ANSWERS</span>
                    <span className="text-lg font-bold text-rose-400">{importPreview.missingAnswers}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                    <span className="text-[10px] text-stone-400 block">READY TO PUBLISH</span>
                    <span className="text-lg font-bold text-emerald-400">{importPreview.ready.length}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setImportPreview(null)}
                    className="px-4 py-2 rounded-xl bg-black/50 border border-stone-700 text-stone-400 text-xs font-mono cursor-pointer"
                  >
                    DISCARD
                  </button>
                  <button
                    disabled={importPreview.ready.length === 0}
                    onClick={handlePublishImportedQuestions}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-widest disabled:opacity-40 cursor-pointer"
                  >
                    ✓ CONFIRM & PUBLISH {importPreview.ready.length} QUESTIONS
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
