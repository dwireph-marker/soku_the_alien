import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft, Trash2, Cpu, ShieldCheck, Sparkles, Key, Play } from 'lucide-react';
import { TreasureHuntTemplate, TreasureHuntInstance } from '../../types/firestore/treasureHunt';
import { detectiveAudio } from '../../utils/detectiveAudio';

interface TerminalTabProps {
  template: TreasureHuntTemplate;
  instance: TreasureHuntInstance;
  onExecuteCommand: (cmd: string, output: string) => void;
  onAddClue?: (clue: string) => void;
}

interface CommandHistoryItem {
  command: string;
  output: string;
  isError?: boolean;
  codeDigit?: string;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  template,
  instance,
  onExecuteCommand,
  onAddClue,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'sys.init',
      output: `CONNECTED TO CLASSIFIED TERMINAL // HOST: ${template.location.split('•')[0].trim()}\nACCESS LEVEL: LEVEL 4 // EYES ONLY\nTYPE "help" OR CLICK THE QUICK-COMMAND SHORTCUTS BELOW TO RUN SYSTEM DIAGNOSTICS.`,
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommandString = (cmdString: string) => {
    const cleanCmd = cmdString.trim().toLowerCase();
    if (!cleanCmd) return;

    detectiveAudio.playKeyClick();

    if (cleanCmd === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    if (cleanCmd === 'help') {
      const helpText =
        '╔══════════════════════════════════════════════════════════════════════╗\n║                ARCTIC ARRAY 7 — COMMAND DIRECTORY                   ║\n╚══════════════════════════════════════════════════════════════════════╝\n\n[DIAGNOSTICS & TELEMETRY]\n  • status                 - Facility core status & lockdown perimeter\n  • scan gen-04            - Read coolant flow & breaker logs\n  • scan dome-07           - Atmospheric sensor readings\n\n[CIPHER & ARCHIVES]\n  • decrypt blackout-key   - Run cryptographic key extraction\n  • logs security          - Retrieve level-2 badge timestamp audits\n  • query turnstile        - Sector gate entry history\n\n[SYSTEM]\n  • clear                  - Wipe terminal buffer\n  • help                   - Display this guide';
      setHistory((prev) => [...prev, { command: cmdString, output: helpText }]);
      setInputVal('');
      return;
    }

    // Check template terminal logs
    const matchingLog = template.terminalLogs.find(
      (log) =>
        log.command.toLowerCase() === cleanCmd ||
        cleanCmd.includes(log.command.toLowerCase()) ||
        log.command.toLowerCase().includes(cleanCmd)
    );

    if (matchingLog) {
      detectiveAudio.playClueUnlocked();
      const discoveredDigit = matchingLog.revealsDigit;
      setHistory((prev) => [
        ...prev,
        {
          command: cmdString,
          output: matchingLog.output,
          codeDigit: discoveredDigit,
        },
      ]);
      onExecuteCommand(cmdString, matchingLog.output);

      if (onAddClue && (matchingLog.clueRevealed || matchingLog.description)) {
        onAddClue(`[Terminal: ${matchingLog.command}] ${matchingLog.clueRevealed || matchingLog.description}`);
      }
    } else if (cleanCmd.startsWith('status')) {
      detectiveAudio.playScanBeep();
      setHistory((prev) => [
        ...prev,
        {
          command: cmdString,
          output: `SECURITY STATUS: LOCKDOWN ACTIVE\nCASE CODE: ${template.codeName}\nVERIFIED EVIDENCE: ${instance.evidenceCollected.length}/${template.evidenceCards.length}\nTERMINAL ACCESS: LEVEL 4 GRANTED\nINTEGRITY: 87% (AUXILIARY POWER)`,
        },
      ]);
    } else {
      detectiveAudio.playAccessDenied();
      setHistory((prev) => [
        ...prev,
        {
          command: cmdString,
          output: `COMMAND ERROR: "${cleanCmd}" not found. Type "help" or click one of the quick commands below.`,
          isError: true,
        },
      ]);
    }

    setInputVal('');
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommandString(inputVal);
  };

  const quickCommands = [
    'help',
    'status',
    'scan gen-04',
    'scan dome-07',
    'decrypt blackout-key',
    'logs security',
    'query turnstile',
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#040f1f]/90 border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>SECURITY COMMAND TERMINAL v4.19 — ROOT SHELL</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="px-2.5 py-1 rounded bg-black/60 hover:bg-cyan-950 border border-cyan-500/20 text-stone-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR SCREEN</span>
          </button>
        </div>
      </div>

      {/* Quick Command Action Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-stone-400 font-bold uppercase flex-shrink-0">
          SHORTCUTS:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommandString(cmd)}
            className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Play className="w-2.5 h-2.5 text-emerald-400" />
            <span>{cmd}</span>
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="h-[460px] bg-[#020712] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-6 overflow-y-auto flex flex-col justify-between shadow-[inset_0_0_50px_rgba(16,185,129,0.15)] relative cursor-text"
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[length:100%_4px] pointer-events-none opacity-60" />

        {/* History Stream */}
        <div className="space-y-4 text-xs sm:text-sm text-emerald-400 z-10">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span className="text-emerald-500">&gt;</span>
                <span>{item.command}</span>
              </div>

              <div
                className={`whitespace-pre-wrap pl-4 leading-relaxed font-mono ${
                  item.isError ? 'text-red-400' : 'text-emerald-300/90'
                }`}
              >
                {item.output}
              </div>

              {/* Code Digit Discovery Highlight */}
              {item.codeDigit && (
                <div className="ml-4 mt-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-between max-w-md">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>TERMINAL DIGIT EXTRACTED:</span>
                  </span>
                  <strong className="text-white text-base">[{item.codeDigit}]</strong>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Active Command Prompt Line */}
        <form onSubmit={handleCommandSubmit} className="mt-4 pt-3 border-t border-emerald-500/20 z-10">
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <span className="font-bold text-cyan-400">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type command (e.g. decrypt blackout-key, scan gen-04)..."
              className="flex-1 bg-transparent text-emerald-300 focus:outline-none placeholder:text-emerald-700/50 font-mono text-xs sm:text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition-colors"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

