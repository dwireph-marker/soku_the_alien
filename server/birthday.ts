import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export interface BirthdaySettings {
  birthdayDate: string; // YYYY-MM-DD
  birthdayTime: string; // HH:mm:ss or HH:mm
  timezone: string;
  countdownEnabled: boolean;
  birthdayMonth: number; // 1 - 12
  birthdayDay: number; // 1 - 31
  birthdayYear: number;
  targetDate: string; // ISO string
  updatedAt?: string;
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'birthday-settings.json');

// Ensure data directory exists safely
function ensureDataDir() {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // In serverless environments, local filesystem may be read-only
  }
}

export const defaultBirthdaySettings: BirthdaySettings = {
  birthdayDate: '2026-12-25',
  birthdayTime: '00:00:00',
  timezone: 'Asia/Kolkata',
  countdownEnabled: true,
  birthdayMonth: 12,
  birthdayDay: 25,
  birthdayYear: 2026,
  targetDate: '2026-12-24T18:30:00.000Z',
  updatedAt: new Date().toISOString(),
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getSafeDayForYear(year: number, month: number, day: number): number {
  if (month === 2 && day === 29) {
    return isLeapYear(year) ? 29 : 28;
  }
  const maxDays = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 31;
  return Math.min(day, maxDays);
}

export function getCurrentDateTimeInTimezone(timezone: string = 'Asia/Kolkata'): {
  year: number;
  month: number;
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
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
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

export function calculateNextOccurrence(
  month: number,
  day: number,
  timeStr: string,
  timezone: string = 'Asia/Kolkata'
): {
  targetTimestampMs: number;
  targetDateIso: string;
  targetYear: number;
  isPassedThisYear: boolean;
  formattedTarget: string;
} {
  const [hStr, mStr, sStr] = (timeStr || '00:00:00').split(':');
  const hours = parseInt(hStr || '0', 10) || 0;
  const minutes = parseInt(mStr || '0', 10) || 0;
  const seconds = parseInt(sStr || '0', 10) || 0;

  const nowInTz = getCurrentDateTimeInTimezone(timezone);
  const nowMs = Date.now();

  const thisYearTargetMs = getZonedTimestamp(nowInTz.year, month, day, hours, minutes, seconds, timezone);

  let targetYear = nowInTz.year;
  let targetTimestampMs = thisYearTargetMs;
  let isPassedThisYear = false;

  if (thisYearTargetMs <= nowMs) {
    isPassedThisYear = true;
    targetYear = nowInTz.year + 1;
    targetTimestampMs = getZonedTimestamp(targetYear, month, day, hours, minutes, seconds, timezone);
  }

  const targetDate = new Date(targetTimestampMs);
  const targetDateIso = targetDate.toISOString();

  let formattedTarget = '';
  try {
    formattedTarget = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(targetDate);
  } catch (e) {
    formattedTarget = targetDateIso;
  }

  return {
    targetTimestampMs,
    targetDateIso,
    targetYear,
    isPassedThisYear,
    formattedTarget,
  };
}

export function readStoredBirthdaySettings(): BirthdaySettings {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return { ...defaultBirthdaySettings, ...data };
    }
  } catch (e) {
    console.warn('Could not read birthday settings from file:', e);
  }
  return { ...defaultBirthdaySettings };
}

export function saveStoredBirthdaySettings(settings: Partial<BirthdaySettings>): BirthdaySettings {
  ensureDataDir();
  const current = readStoredBirthdaySettings();
  const merged: BirthdaySettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate targetDate
  const nextOcc = calculateNextOccurrence(
    merged.birthdayMonth,
    merged.birthdayDay,
    merged.birthdayTime,
    merged.timezone
  );
  merged.targetDate = nextOcc.targetDateIso;

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing birthday settings file:', e);
  }

  return merged;
}

// Controller Handlers
export function handleGetBirthdaySettings(req: Request, res: Response) {
  try {
    const settings = readStoredBirthdaySettings();
    const nextOcc = calculateNextOccurrence(
      settings.birthdayMonth,
      settings.birthdayDay,
      settings.birthdayTime,
      settings.timezone
    );

    return res.json({
      success: true,
      settings: {
        ...settings,
        nextOccurrenceIso: nextOcc.targetDateIso,
        targetTimestampMs: nextOcc.targetTimestampMs,
        targetYear: nextOcc.targetYear,
        isPassedThisYear: nextOcc.isPassedThisYear,
        formattedNextOccurrence: nextOcc.formattedTarget,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve birthday settings' });
  }
}

export function handleUpdateBirthdaySettings(req: Request, res: Response) {
  try {
    const { birthdayDate, birthdayTime, timezone, countdownEnabled } = req.body;

    if (!birthdayDate || typeof birthdayDate !== 'string') {
      return res.status(400).json({ error: 'Please select a valid birthday date (YYYY-MM-DD).' });
    }

    const dateParts = birthdayDate.split('-');
    if (dateParts.length !== 3) {
      return res.status(400).json({ error: 'Please enter a valid birthday date in YYYY-MM-DD format.' });
    }

    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10);
    const day = parseInt(dateParts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return res.status(400).json({ error: 'Please enter a valid birthday month (1-12) and day (1-31).' });
    }

    // February 29 handling validation check
    if (month === 2 && day === 29) {
      // Allowed: Will automatically fall back to Feb 28 on non-leap years
    } else if (month === 2 && day > 29) {
      return res.status(400).json({ error: 'February cannot have more than 29 days.' });
    }

    if (!birthdayTime || typeof birthdayTime !== 'string') {
      return res.status(400).json({ error: 'Please enter a valid birthday time (HH:MM or HH:MM:SS).' });
    }

    const timeParts = birthdayTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return res.status(400).json({ error: 'Please enter a valid time between 00:00 and 23:59.' });
    }

    const tz = timezone || 'Asia/Kolkata';
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    } catch (e) {
      return res.status(400).json({ error: `Invalid timezone provided: "${tz}".` });
    }

    const updated = saveStoredBirthdaySettings({
      birthdayDate,
      birthdayTime: timeParts.length === 2 ? `${birthdayTime}:00` : birthdayTime,
      timezone: tz,
      countdownEnabled: countdownEnabled !== false,
      birthdayMonth: month,
      birthdayDay: day,
      birthdayYear: year,
    });

    const nextOcc = calculateNextOccurrence(month, day, updated.birthdayTime, tz);

    return res.json({
      success: true,
      message: 'Birthday date, time, and recurrence settings updated successfully.',
      settings: {
        ...updated,
        nextOccurrenceIso: nextOcc.targetDateIso,
        targetTimestampMs: nextOcc.targetTimestampMs,
        targetYear: nextOcc.targetYear,
        isPassedThisYear: nextOcc.isPassedThisYear,
        formattedNextOccurrence: nextOcc.formattedTarget,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update birthday settings' });
  }
}
