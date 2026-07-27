import { Language } from '../types/user.types';

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumerals(numStr: string): string {
  return numStr.replace(/\d/g, (digit) => BENGALI_NUMERALS[parseInt(digit, 10)]);
}

export function parseFormattedNumber(val: string): number {
  if (!val) return 0;
  // Convert Bengali numerals to Western digits if present
  let clean = val;
  BENGALI_NUMERALS.forEach((bengali, idx) => {
    clean = clean.replaceAll(bengali, idx.toString());
  });
  // Strip non-numeric except decimal
  clean = clean.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatCurrency(amount: number, lang: Language = 'en', currencyOverride?: string): string {
  const symbol = currencyOverride || (lang === 'bn' ? '৳' : '₹');
  const absAmount = Math.abs(amount);
  
  // Format with standard thousand separators
  const parts = absAmount.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10).toLocaleString('en-US');
  const formattedStr = `${integerPart}.${parts[1]}`;
  
  if (lang === 'bn') {
    const bengaliNum = toBengaliNumerals(formattedStr);
    return `${symbol} ${bengaliNum}`;
  }
  
  return `${symbol} ${formattedStr}`;
}

export function formatNumberOnly(amount: number, lang: Language = 'en'): string {
  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10).toLocaleString('en-US');
  const formattedStr = `${integerPart}.${parts[1]}`;
  return lang === 'bn' ? toBengaliNumerals(formattedStr) : formattedStr;
}
