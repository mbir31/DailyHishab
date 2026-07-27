import { Language } from '../types/user.types';
import { toBengaliNumerals } from './numberFormat';

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateString(dateStr: string, daysOffset: number): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return getTodayDateString();
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  date.setDate(date.getDate() + daysOffset);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const BENGALI_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BENGALI_WEEKDAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function formatDateDisplay(dateStr: string, lang: Language = 'en'): { weekday: string; dateFormatted: string } {
  const dateFormatted = formatDDMMYYYY(dateStr, lang);
  const weekday = getWeekdayName(dateStr, lang, false);
  return {
    weekday,
    dateFormatted,
  };
}

const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ENGLISH_WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Formats a YYYY-MM-DD date string into DD-MM-YYYY format.
 * Converts to Bengali numerals if lang === 'bn'.
 */
export function formatDDMMYYYY(dateStr: string, lang: Language = 'en'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');
  const formatted = `${day}-${month}-${year}`;

  if (lang === 'bn') {
    return toBengaliNumerals(formatted);
  }
  return formatted;
}

/**
 * Returns weekday name for a YYYY-MM-DD date string.
 */
export function getWeekdayName(dateStr: string, lang: Language = 'en', short: boolean = false): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);
  if (isNaN(dateObj.getTime())) return '';
  const dayIndex = dateObj.getDay();

  if (lang === 'bn') {
    return short ? BENGALI_WEEKDAYS_SHORT[dayIndex] : BENGALI_WEEKDAYS[dayIndex];
  } else {
    return short ? ENGLISH_WEEKDAYS_SHORT[dayIndex] : ENGLISH_WEEKDAYS[dayIndex];
  }
}

/**
 * Formats a YYYY-MM-DD date string as "DD-MM-YYYY (Weekday)" or "DD-MM-YYYY (Day)".
 */
export function formatDateWithDay(dateStr: string, lang: Language = 'en', shortDay: boolean = false): string {
  if (!dateStr) return '';
  const dateFormatted = formatDDMMYYYY(dateStr, lang);
  const weekday = getWeekdayName(dateStr, lang, shortDay);
  if (!weekday) return dateFormatted;
  return `${dateFormatted} (${weekday})`;
}

export function getDateRangeForFilter(
  filter: 'day' | 'week' | 'month' | 'year' | 'custom',
  referenceDateStr: string,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  if (filter === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  const parts = referenceDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const refDate = new Date(year, month, day);

  if (filter === 'day') {
    return { from: referenceDateStr, to: referenceDateStr };
  }

  if (filter === 'week') {
    // Start of week (Sunday)
    const dayOfWeek = refDate.getDay();
    const start = new Date(refDate);
    start.setDate(refDate.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    return { from: formatDate(start), to: formatDate(end) };
  }

  if (filter === 'month') {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from: start, to: end };
  }

  if (filter === 'year') {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }

  return { from: referenceDateStr, to: referenceDateStr };
}
