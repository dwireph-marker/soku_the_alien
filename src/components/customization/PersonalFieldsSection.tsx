import React from 'react';
import { Calendar } from 'lucide-react';

interface PersonalFieldsSectionProps {
  herName: string;
  setHerName: (val: string) => void;
  hisName: string;
  setHisName: (val: string) => void;
  targetYear: number;
  setTargetYear: (val: number) => void;
}

export const PersonalFieldsSection: React.FC<PersonalFieldsSectionProps> = ({
  herName,
  setHerName,
  hisName,
  setHisName,
  targetYear,
  setTargetYear,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">
            Girlfriend's Name
          </label>
          <input
            type="text"
            required
            value={herName || ''}
            onChange={(e) => setHerName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 font-serif"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">
            Your Name / Signature
          </label>
          <input
            type="text"
            required
            value={hisName || ''}
            onChange={(e) => setHisName(e.target.value)}
            placeholder="e.g. Alex"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-orange-500 font-serif"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">
          Birthday Midnight Date & Time
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <span className="font-serif font-semibold text-amber-200 text-sm block">
                01/11 (1st November) at 12:00 AM Midnight
              </span>
              <span className="text-[11px] text-stone-400 block font-serif">Fixed date & midnight time</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4">
            <label className="text-xs text-orange-400 font-semibold uppercase tracking-wider">Year:</label>
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="bg-stone-900 border border-orange-500/50 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              {Array.from({ length: 20 }, (_, i) => 2024 + i).map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
