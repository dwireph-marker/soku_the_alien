// Timezone-aware Recurring Birthday Calculation Engine & Utilities

export interface BirthdayConfig {
  birthdayDate: string; // YYYY-MM-DD
  birthdayTime: string; // HH:mm:ss or HH:mm
  timezone: string;
  countdownEnabled?: boolean;
  birthdayMonth?: number; // 1 - 12
  birthdayDay?: number; // 1 - 31
  birthdayYear?: number;
  targetDate?: string;
}

export interface NextBirthdayOccurrence {
  targetTimestampMs: number;
  targetDateIso: string;
  targetYear: number;
  isPassedThisYear: boolean;
  formattedTarget: string;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  timezone: string;
}

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isFinished: boolean;
}

export const COMMON_TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+5:30) [Default]', offset: '+05:30' },
  { id: 'UTC', label: 'UTC (Coordinated Universal Time - UTC+0:00)', offset: '+00:00' },
  { id: 'America/New_York', label: 'America/New_York (Eastern Time - EST/EDT)', offset: '-05:00' },
  { id: 'America/Chicago', label: 'America/Chicago (Central Time - CST/CDT)', offset: '-06:00' },
  { id: 'America/Denver', label: 'America/Denver (Mountain Time - MST/MDT)', offset: '-07:00' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time - PST/PDT)', offset: '-08:00' },
  { id: 'America/Toronto', label: 'America/Toronto (Canada Eastern)', offset: '-05:00' },
  { id: 'Europe/London', label: 'Europe/London (GMT/BST - UK)', offset: '+00:00' },
  { id: 'Europe/Paris', label: 'Europe/Paris (Central European Time - CET/CEST)', offset: '+01:00' },
  { id: 'Europe/Berlin', label: 'Europe/Berlin (Germany - CET/CEST)', offset: '+01:00' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Standard Time - GST - UTC+4:00)', offset: '+04:00' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8:00)', offset: '+08:00' },
  { id: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time - JST - UTC+9:00)', offset: '+09:00' },
  { id: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT - UTC+8:00)', offset: '+08:00' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT - UTC+10/11)', offset: '+10:00' },
  { id: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT - New Zealand)', offset: '+12:00' },
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getMonthName(month: number, short: boolean = false): string {
  // month is 1 - 12 (1 = January, 11 = November, 12 = December)
  const idx = Math.max(0, Math.min(11, (month || 1) - 1));
  return short ? MONTH_SHORT_NAMES[idx] : MONTH_NAMES[idx];
}

export function formatBirthdayShortDisplay(config?: {
  birthdayDay?: number;
  birthdayMonth?: number;
  birthdayDate?: string;
  targetDate?: string;
} | null): string {
  if (!config) return 'Configured';
  let m = config.birthdayMonth;
  let d = config.birthdayDay;
  if (!m || !d) {
    const parsed = parseDateString(config.birthdayDate || config.targetDate);
    m = parsed.month;
    d = parsed.day;
  }
  const monthStr = getMonthName(m, true);
  return `${d} ${monthStr}`;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] || 31;
}

export function getSafeDayForYear(year: number, month: number, day: number): number {
  // February 29 special handling: on non-leap years, maps safely to February 28
  if (month === 2 && day === 29) {
    return isLeapYear(year) ? 29 : 28;
  }
  const maxDays = getDaysInMonth(year, month);
  return Math.min(Math.max(1, day), maxDays);
}

export function getCurrentDateTimeInTimezone(timezone: string = 'Asia/Kolkata'): {
  year: number;
  month: number; // 1 - 12
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => {
      const p = parts.find((pt) => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    let hour = getPart('hour');
    if (hour === 24) hour = 0;

    return {
      year: getPart('year') || now.getFullYear(),
      month: getPart('month') || now.getMonth() + 1,
      day: getPart('day') || now.getDate(),
      hours: hour,
      minutes: getPart('minute'),
      seconds: getPart('second'),
    };
  } catch (e) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hours: now.getUTCHours(),
      minutes: now.getUTCMinutes(),
      seconds: now.getUTCSeconds(),
    };
  }
}

export function getTimezoneOffsetMs(date: Date, timezone: string): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  } catch (e) {
    return 0;
  }
}

export function getZonedTimestamp(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number,
  timezone: string
): number {
  const safeDay = getSafeDayForYear(year, month, day);
  const naiveUtc = Date.UTC(year, month - 1, safeDay, hours, minutes, seconds);
  const offset = getTimezoneOffsetMs(new Date(naiveUtc), timezone);
  const exactUtc = naiveUtc - offset;
  const refinedOffset = getTimezoneOffsetMs(new Date(exactUtc), timezone);
  return naiveUtc - refinedOffset;
}

export function parseDateString(dateStr?: string): { year: number; month: number; day: number } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { year: 2026, month: 12, day: 25 };
  }
  // Try YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }
  return { year: 2026, month: 12, day: 25 };
}

export function parseTimeString(timeStr?: string): { hours: number; minutes: number; seconds: number } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  // Handle 12-hour format like "12:00 AM" or "06:30 PM"
  const clean = timeStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    const isPm = clean.includes('PM');
    const digitsOnly = clean.replace(/AM|PM/g, '').trim();
    const [hStr, mStr, sStr] = digitsOnly.split(':');
    let h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10) || 0;
    const s = parseInt(sStr || '0', 10) || 0;

    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;

    return { hours: Math.min(23, Math.max(0, h)), minutes: Math.min(59, Math.max(0, m)), seconds: Math.min(59, Math.max(0, s)) };
  }

  // Handle 24-hour format "HH:MM:SS" or "HH:MM"
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10) || 0;
  const m = parseInt(parts[1] || '0', 10) || 0;
  const s = parseInt(parts[2] || '0', 10) || 0;

  return {
    hours: Math.min(23, Math.max(0, h)),
    minutes: Math.min(59, Math.max(0, m)),
    seconds: Math.min(59, Math.max(0, s)),
  };
}

export function calculateNextBirthdayOccurrence(config: {
  birthdayDate?: string;
  birthdayTime?: string;
  timezone?: string;
  birthdayMonth?: number;
  birthdayDay?: number;
  birthdayYear?: number;
  targetDate?: string;
}): NextBirthdayOccurrence {
  const timezone = config.timezone || 'Asia/Kolkata';

  let month = config.birthdayMonth;
  let day = config.birthdayDay;

  if (!month || !day) {
    const parsedDate = parseDateString(config.birthdayDate || config.targetDate);
    month = parsedDate.month;
    day = parsedDate.day;
  }

  const { hours, minutes, seconds } = parseTimeString(config.birthdayTime || '00:00:00');
  const nowInTz = getCurrentDateTimeInTimezone(timezone);
  const nowMs = Date.now();

  const thisYearTargetMs = getZonedTimestamp(nowInTz.year, month, day, hours, minutes, seconds, timezone);

  let targetYear = nowInTz.year;
  let targetTimestampMs = thisYearTargetMs;
  let isPassedThisYear = false;

  // If this year's birthday timestamp has already arrived or passed in the given timezone,
  // automatically advance to next year's birthday occurrence!
  if (thisYearTargetMs <= nowMs) {
    isPassedThisYear = true;
    targetYear = nowInTz.year + 1;
    targetTimestampMs = getZonedTimestamp(targetYear, month, day, hours, minutes, seconds, timezone);
  }

  const targetDateObj = new Date(targetTimestampMs);
  const targetDateIso = targetDateObj.toISOString();

  let formattedTarget = '';
  try {
    formattedTarget = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(targetDateObj);
  } catch (e) {
    formattedTarget = targetDateIso;
  }

  return {
    targetTimestampMs,
    targetDateIso,
    targetYear,
    isPassedThisYear,
    formattedTarget,
    month,
    day,
    hours,
    minutes,
    seconds,
    timezone,
  };
}

export function calculateRemainingTime(targetTimestampMs: number): RemainingTime {
  const nowMs = Date.now();
  const difference = targetTimestampMs - nowMs;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isFinished: true,
    };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalSeconds: Math.max(0, totalSeconds),
    isFinished: false,
  };
}

// Convert 24-hour time "00:00" to 12-hour "12:00 AM"
export function formatTime24to12(time24: string): { hour12: number; minute: number; period: 'AM' | 'PM'; formatted: string } {
  const { hours, minutes } = parseTimeString(time24);
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let hour12 = hours % 12;
  if (hour12 === 0) hour12 = 12;

  const formatted = `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  return { hour12, minute: minutes, period, formatted };
}

// Convert 12-hour components to 24-hour "HH:MM:SS"
export function formatTime12to24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12;
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}
