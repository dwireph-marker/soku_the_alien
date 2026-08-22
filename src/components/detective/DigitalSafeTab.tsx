import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  Key,
  AlertCircle,
  CheckCircle2,
  Delete,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Zap,
  ShieldCheck,
  Award
} from 'lucide-react';
import { TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';
import { hashSolution } from '../../utils/huntGenerator';

interface DigitalSafeTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onSuccessUnlock: () => void;
  onUseHint: () => void;
}

export const DigitalSafeTab: React.FC<DigitalSafeTabProps> = ({
  template,
  instance,
  onSuccessUnlock,
  onUseHint,
}) => {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(
    instance.status === 'completed' || (instance.status as any) === 'COMPLETED'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shownHintsCount, setShownHintsCount] = useState(instance.hintsUsed);

  const handleDigit = (digit: string) => {
    if (verifying || isUnlocked) return;
    if (pin.length >= 4) return;
    detectiveAudio.playKeyClick();
    setErrorMsg(null);
    setPin((prev) => prev + digit);
  };

  const handleDelete = () => {
    if (verifying || isUnlocked) return;
    detectiveAudio.playKeyClick();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (verifying || isUnlocked) return;
    detectiveAudio.playKeyClick();
    setPin('');
    setErrorMsg(null);
  };

  const handleUnlock = () => {
    if (pin.length < 4 || verifying || isUnlocked) return;

    setVerifying(true);
    setErrorMsg(null);
    setProgressPercent(0);
    detectiveAudio.playScanBeep();

    // Verification progress bar simulation
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setProgressPercent(p);
      if (p >= 100) {
        clearInterval(interval);
        // Verify code
        const inputHash = hashSolution(pin);
        const isCorrect =
          inputHash === instance.codeHash ||
          pin === instance.generatedCode ||
          pin === template.defaultCode;

        if (isCorrect) {
          detectiveAudio.playAccessGranted();
          setIsUnlocked(true);
          setVerifying(false);
          onSuccessUnlock();
        } else {
          detectiveAudio.playAccessDenied();
          setVerifying(false);
          setErrorMsg('ACCESS DENIED: Invalid override combination. Review your evidence board, interrogation contradictions, and terminal logs.');
          setPin('');
        }
      }
    }, 180);
  };

  const handleRequestHint = () => {
    if (shownHintsCount < template.finalSafeHints.length) {
      detectiveAudio.playScanBeep();
      setShownHintsCount((prev) => prev + 1);
      onUseHint();
    }
  };

  // Inspect what clues or evidence cards player has found
  const discoveredClues = instance.cluesFound || [];
  const discoveredEvidence = template.evidenceCards.filter((e) =>
    instance.evidenceCollected.includes(e.id)
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 font-mono">
      {/* Safe Console Box */}
      <div className="bg-[#030b18] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.2)] relative overflow-hidden backdrop-blur-xl">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff0d_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Top Status */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
            {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-cyan-400" />}
            <span>FINAL ACCESS VAULT LOCK</span>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border uppercase flex items-center gap-1.5 ${
              isUnlocked
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
            }`}
          >
            {isUnlocked ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OVERRIDE UNLOCKED</span>
              </>
            ) : (
              <span>SECURITY LOCKDOWN ACTIVE</span>
            )}
          </div>
        </div>

        {/* Passcode Display Box */}
        <div className="mb-6 relative z-10">
          <div className="h-16 rounded-2xl bg-black/90 border-2 border-cyan-500/40 flex items-center justify-center gap-4 text-2xl sm:text-3xl font-bold tracking-[0.5em] text-cyan-300 shadow-[inset_0_0_20px_rgba(0,240,255,0.3)]">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`w-6 text-center ${
                  pin[idx] ? 'text-cyan-400' : 'text-stone-700'
                }`}
              >
                {pin[idx] ? pin[idx] : '_'}
              </span>
            ))}
          </div>

          {/* Verification Bar */}
          {verifying && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-cyan-400">
                <span>VERIFYING CRYPTOGRAPHIC OVERRIDE...</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-cyan-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-red-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[#041226]/80 hover:bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-white font-bold text-lg transition-all shadow-lg active:shadow-none"
            >
              {digit}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-bold text-xs uppercase transition-all"
          >
            CLEAR
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#041226]/80 hover:bg-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-white font-bold text-lg transition-all"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center transition-all"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Submit Unlock Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUnlock}
          disabled={pin.length < 4 || verifying || isUnlocked}
          className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl ${
            isUnlocked
              ? 'bg-emerald-500 text-black shadow-emerald-500/40'
              : pin.length === 4 && !verifying
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-cyan-500/30'
              : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{isUnlocked ? 'VAULT ACCESS GRANTED' : 'TRANSMIT OVERRIDE CODE'}</span>
        </motion.button>
      </div>

      {/* Discovered Digits Roadmap Box */}
      <div className="bg-[#030d1d] border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase">
            <Key className="w-4 h-4 text-amber-400" />
            <span>CASE SOLVING ROADMAP • 4-DIGIT DECRYPTION</span>
          </div>
          <span className="text-[11px] text-stone-400">
            OBJECTIVES MET: {instance.cluesFound.length + instance.evidenceCollected.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">DIGIT #1</span>
            <p className="text-[11px] text-stone-300">CCTV / Log</p>
            <div className="text-sm font-bold text-amber-300">
              {instance.inspectedCCTVCams.length > 0 || instance.evidenceCollected.includes('ev_a_sec_log')
                ? '[1]'
                : '[?]'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">DIGIT #2</span>
            <p className="text-[11px] text-stone-300">Suspect Alibi</p>
            <div className="text-sm font-bold text-amber-300">
              {instance.inspectedCharacters.length > 0 ? '[7]' : '[?]'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">DIGIT #3</span>
            <p className="text-[11px] text-stone-300">Terminal Cipher</p>
            <div className="text-sm font-bold text-amber-300">
              {instance.terminalCommandsRun.length > 0 ? '[4]' : '[?]'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
            <span className="text-[10px] text-cyan-400 uppercase font-bold">DIGIT #4</span>
            <p className="text-[11px] text-stone-300">Blueprint Room</p>
            <div className="text-sm font-bold text-amber-300">
              {instance.investigatedRooms.includes('room_gen') || instance.investigatedRooms.length > 0
                ? '[9]'
                : '[?]'}
            </div>
          </div>
        </div>
      </div>

      {/* Hints Accordion Box */}
      <div className="bg-[#030d1d] border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>CLASSIFIED DECRYPTION HINTS ({shownHintsCount}/{template.finalSafeHints.length})</span>
          </div>

          {shownHintsCount < template.finalSafeHints.length && (
            <button
              onClick={handleRequestHint}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors"
            >
              REVEAL NEXT HINT
            </button>
          )}
        </div>

        <div className="space-y-2">
          {template.finalSafeHints.slice(0, shownHintsCount).map((hint, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 text-xs text-stone-300 flex items-start gap-2"
            >
              <span className="text-cyan-400 font-bold">#{idx + 1}:</span>
              <span>{hint}</span>
            </div>
          ))}
          {shownHintsCount === 0 && (
            <p className="text-xs text-stone-500 italic">
              No hints requested yet. Solve puzzles across Blueprint, CCTV, and Terminal tabs to derive the 4-digit code.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

