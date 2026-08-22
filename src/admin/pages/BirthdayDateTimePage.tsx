import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  Timer,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarCheck,
  RefreshCw,
  Info,
  CalendarClock
} from 'lucide-react';
import { SiteConfig } from '../../types';
import {
  COMMON_TIMEZONES,
  MONTH_NAMES,
  getDaysInMonth,
  getSafeDayForYear,
  isLeapYear,
  calculateNextBirthdayOccurrence,
  calculateRemainingTime,
  parseDateString,
  formatTime24to12,
  formatTime12to24,
  NextBirthdayOccurrence,
  RemainingTime,
} from '../../utils/birthdayCountdown';

interface BirthdayDateTimePageProps {
  config: SiteConfig | null;
  onSaveBirthday: (settings: {
    birthdayDate: string;
    birthdayTime: string;
    timezone: string;
    countdownEnabled: boolean;
    birthdayMonth: number;
    birthdayDay: number;
    birthdayYear: number;
  }) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BirthdayDateTimePage: React.FC<BirthdayDateTimePageProps> = ({
  config,
  onSaveBirthday,
  showToast,
}) => {
  // Parse initial config
  const initialDate = useMemo(() => {
    return parseDateString(config?.birthdayDate || config?.targetDate || '2026-12-25');
  }, [config?.birthdayDate, config?.targetDate]);

  const [day, setDay] = useState<number>(config?.birthdayDay || initialDate.day || 25);
  const [month, setMonth] = useState<number>(config?.birthdayMonth || initialDate.month || 12);
  const [year, setYear] = useState<number>(config?.birthdayYear || initialDate.year || 2026);

  const initialTime12 = useMemo(() => {
    return formatTime24to12(config?.birthdayTime || '00:00:00');
  }, [config?.birthdayTime]);

  const [hour12, setHour12] = useState<number>(initialTime12.hour12);
  const [minute, setMinute] = useState<number>(initialTime12.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialTime12.period);

  const [timezone, setTimezone] = useState<string>(config?.timezone || 'Asia/Kolkata');
  const [countdownEnabled, setCountdownEnabled] = useState<boolean>(
    config?.countdownEnabled !== undefined ? config.countdownEnabled : true
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if external config updates
  useEffect(() => {
    if (config) {
      const parsed = parseDateString(config.birthdayDate || config.targetDate || '2026-12-25');
      setDay(config.birthdayDay || parsed.day);
      setMonth(config.birthdayMonth || parsed.month);
      setYear(config.birthdayYear || parsed.year);

      const t12 = formatTime24to12(config.birthdayTime || '00:00:00');
      setHour12(t12.hour12);
      setMinute(t12.minute);
      setPeriod(t12.period);

      if (config.timezone) setTimezone(config.timezone);
      if (config.countdownEnabled !== undefined) setCountdownEnabled(config.countdownEnabled);
    }
  }, [config]);

  // Adjust day if selected month has fewer days
  useEffect(() => {
    const maxDays = getDaysInMonth(year, month);
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [month, year, day]);

  // Live calculation of next occurrence
  const nextOccurrence: NextBirthdayOccurrence = useMemo(() => {
    const time24 = formatTime12to24(hour12, minute, period);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calculateNextBirthdayOccurrence({
      birthdayDate: dateStr,
      birthdayTime: time24,
      timezone,
      birthdayMonth: month,
      birthdayDay: day,
      birthdayYear: year,
    });
  }, [day, month, year, hour12, minute, period, timezone]);

  // Live ticking countdown preview for this target
  const [previewTime, setPreviewTime] = useState<RemainingTime>(() =>
    calculateRemainingTime(nextOccurrence.targetTimestampMs)
  );

  useEffect(() => {
    const updatePreview = () => {
      setPreviewTime(calculateRemainingTime(nextOccurrence.targetTimestampMs));
    };
    updatePreview();
    const interval = setInterval(updatePreview, 1000);
    return () => clearInterval(interval);
  }, [nextOccurrence.targetTimestampMs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!day || day < 1 || day > 31) {
      setValidationError('Please select a valid birthday day (1-31).');
      return;
    }
    if (!month || month < 1 || month > 12) {
      setValidationError('Please select a valid birthday month.');
      return;
    }
    if (month === 2 && day > 29) {
      setValidationError('February cannot have more than 29 days.');
      return;
    }
    if (hour12 < 1 || hour12 > 12) {
      setValidationError('Please enter a valid hour between 1 and 12.');
      return;
    }
    if (minute < 0 || minute > 59) {
      setValidationError('Please enter a valid minute between 0 and 59.');
      return;
    }
    if (!timezone) {
      setValidationError('Please select a timezone.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const time24 = formatTime12to24(hour12, minute, period);
      const safeDay = getSafeDayForYear(year, month, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

      // Save via API backend and Firestore synchronization
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const { auth } = await import('../../lib/firebase/client');
      if (auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
      }

      await fetch('/api/birthday/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          birthdayDate: dateStr,
          birthdayTime: time24,
          timezone,
          countdownEnabled,
          birthdayMonth: month,
          birthdayDay: safeDay,
          birthdayYear: year,
        }),
      }).catch((e) => {
        console.warn('API route call fallback:', e);
      });

      await onSaveBirthday({
        birthdayDate: dateStr,
        birthdayTime: time24,
        timezone,
        countdownEnabled,
        birthdayMonth: month,
        birthdayDay: safeDay,
        birthdayYear: year,
      });

      setSaveSuccess(true);
      showToast('Birthday date, time, and recurrence settings updated successfully!', 'success');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error saving birthday configuration:', err);
      showToast(err.message || 'Failed to save birthday configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2.5">
            <span className="text-2xl">🎂</span>
            <span>Birthday Date & Time</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Configure the annual birthday date, exact time, and timezone. The system automatically rolls forward every year.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <CalendarClock className="w-4 h-4 text-amber-400" />
          <span>Annual Auto-Roll Forward Active</span>
        </div>
      </div>

      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-100">Validation Error</p>
            <p className="mt-0.5 text-rose-300">{validationError}</p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="font-medium">
            Birthday configuration successfully saved! Public countdown has been updated with the new target.
          </p>
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Section Heading */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Configure Birthday & Timezone</span>
            </h2>
            <span className="text-[11px] text-stone-400">Single Source of Truth</span>
          </div>

          {/* 1. Birthday Date Picker / Components */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-200 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Birthday Date</span>
              <span className="text-[10px] text-stone-400 font-normal">(Month & Day repeat every year)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Day selector */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">Day</label>
                <select
                  value={day}
                  onChange={(e) => setDay(parseInt(e.target.value, 10))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month selector */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year selector / display */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">
                  Starting Year
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || 2026)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {month === 2 && day === 29 && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 mt-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Leap year date detected (Feb 29). On non-leap years, the countdown will automatically target February 28th safely.
                </span>
              </p>
            )}
          </div>

          {/* 2. Birthday Time Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-200 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Birthday Time</span>
              <span className="text-[10px] text-stone-400 font-normal">(Exact hour & minute countdown finishes)</span>
            </label>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              {/* Hour 12 */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">Hour</label>
                <select
                  value={hour12}
                  onChange={(e) => setHour12(parseInt(e.target.value, 10))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">Minute</label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period (AM/PM) */}
              <div>
                <label className="block text-[10px] text-stone-400 uppercase tracking-wider mb-1">AM / PM</label>
                <div className="grid grid-cols-2 bg-stone-950 border border-stone-800 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      period === 'AM'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      period === 'PM'
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Timezone Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Time Zone</span>
              <span className="text-[10px] text-stone-400 font-normal">
                (Countdown targets this timezone regardless of visitor's location)
              </span>
            </label>

            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Countdown Enable / Disable */}
          <div className="pt-2">
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-950/70 border border-stone-800 cursor-pointer hover:border-stone-700 transition-colors">
              <input
                type="checkbox"
                checked={countdownEnabled}
                onChange={(e) => setCountdownEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-stone-900 border-stone-700 focus:ring-amber-500 focus:ring-offset-stone-900"
              />
              <div className="flex-1">
                <span className="text-xs font-semibold text-stone-200 block">
                  Enable Hero Birthday Countdown Timer
                </span>
                <span className="text-[11px] text-stone-400 block">
                  When enabled, shows the live Days : Hours : Minutes : Seconds countdown clock on the frontend hero section.
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  countdownEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {countdownEnabled ? '✓ Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Explanatory Note Required by Spec */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5">Automatic Next-Year Rollover:</strong>
              “Your birthday repeats automatically every year. Once this year's birthday passes, the countdown automatically moves to the same date and time next year.”
            </div>
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <h2 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-400" />
              <span>Target Birthday & Live Countdown Preview</span>
            </h2>
            <span className="text-[10px] text-stone-400">Calculated in Real-Time</span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                Recurring Annual Schedule
              </span>
              <p className="text-sm font-bold text-amber-300">
                Every {day} {MONTH_NAMES[month - 1]} at {String(hour12).padStart(2, '0')}:
                {String(minute).padStart(2, '0')} {period}
              </p>
              <p className="text-[11px] text-stone-400">Timezone: {timezone}</p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-1">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                Calculated Next Occurrence
              </span>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <span>{nextOccurrence.formattedTarget}</span>
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    nextOccurrence.isPassedThisYear
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}
                >
                  {nextOccurrence.isPassedThisYear
                    ? `Rolled forward to ${nextOccurrence.targetYear}`
                    : `Active in ${nextOccurrence.targetYear}`}
                </span>
              </div>
            </div>
          </div>

          {/* Frontend Matching Countdown Display */}
          <div className="p-6 rounded-2xl bg-[#03020c] border border-orange-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-orange-400/80 font-semibold mb-3">
              Live Countdown Preview
            </span>

            <div className="flex items-center justify-center gap-2 sm:gap-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-light text-white tabular-nums">
                  {String(previewTime.days).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
                  Days
                </span>
              </div>
              <span className="text-xl sm:text-3xl font-thin text-white/20 pb-4">:</span>

              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-light text-white tabular-nums">
                  {String(previewTime.hours).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
                  Hours
                </span>
              </div>
              <span className="text-xl sm:text-3xl font-thin text-white/20 pb-4">:</span>

              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-light text-white tabular-nums">
                  {String(previewTime.minutes).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
                  Minutes
                </span>
              </div>
              <span className="text-xl sm:text-3xl font-thin text-white/20 pb-4">:</span>

              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-normal text-orange-500 tabular-nums">
                  {String(previewTime.seconds).padStart(2, '0')}
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
                  Seconds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-stone-950 font-bold text-xs shadow-lg shadow-amber-900/20 flex items-center gap-2.5 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                <span>Saving Birthday Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-stone-950" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
