import { EntryType } from '../types/entry.types';

export interface CategoryOption {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

export const DEFAULT_INCOME_CATEGORIES: CategoryOption[] = [];
export const DEFAULT_EXPENSE_CATEGORIES: CategoryOption[] = [];

export const CUSTOM_INCOME_CATEGORIES_KEY = 'dailyhishab_custom_income_categories';
export const CUSTOM_EXPENSE_CATEGORIES_KEY = 'dailyhishab_custom_expense_categories';

/**
 * Load user's custom category options for Income or Expense from localStorage
 */
export function getCustomCategories(type: EntryType): string[] {
  try {
    const key = type === 'income' ? CUSTOM_INCOME_CATEGORIES_KEY : CUSTOM_EXPENSE_CATEGORIES_KEY;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((c: string) => c.trim()).filter(Boolean);
      }
    }
  } catch (e) {
    console.error(`Failed to load custom categories for ${type}:`, e);
  }
  return [];
}

/**
 * Save custom category options for Income or Expense to localStorage
 */
export function saveCustomCategories(type: EntryType, categories: string[]): void {
  try {
    const key = type === 'income' ? CUSTOM_INCOME_CATEGORIES_KEY : CUSTOM_EXPENSE_CATEGORIES_KEY;
    const cleaned = Array.from(new Set(categories.map(c => c.trim()).filter(Boolean)));
    localStorage.setItem(key, JSON.stringify(cleaned));
  } catch (e) {
    console.error(`Failed to save custom categories for ${type}:`, e);
  }
}

/**
 * Add a new custom category option
 */
export function addCustomCategory(type: EntryType, newCategory: string): string[] {
  const clean = newCategory.trim();
  if (!clean) return getCustomCategories(type);
  const current = getCustomCategories(type);
  if (!current.some(c => c.toLowerCase() === clean.toLowerCase())) {
    const updated = [...current, clean];
    saveCustomCategories(type, updated);
    return updated;
  }
  return current;
}

/**
 * Remove an existing custom category option
 */
export function removeCustomCategory(type: EntryType, categoryToRemove: string): string[] {
  const clean = categoryToRemove.trim();
  const current = getCustomCategories(type);
  const updated = current.filter(c => c.toLowerCase() !== clean.toLowerCase());
  saveCustomCategories(type, updated);
  return updated;
}

export const DEFAULT_PRESET_TAGS: string[] = ['cash', 'bank', 'online', 'urgent', 'vendor', 'client'];

export const POPULAR_TAGS: string[] = ['cash', 'bank', 'online', 'urgent', 'vendor', 'client'];

const PRESET_TAGS_STORAGE_KEY = 'dailyhishab_preset_tags';

export function getPresetTags(): string[] {
  try {
    const stored = localStorage.getItem(PRESET_TAGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const tags = parsed.map((t: string) => t.replace(/^#/, ''));
        return tags;
      }
    }
  } catch (e) {
    console.error('Failed to load preset tags:', e);
  }
  return DEFAULT_PRESET_TAGS;
}

export function savePresetTags(tags: string[]): void {
  try {
    const cleaned = Array.from(new Set(tags.map(t => t.trim().replace(/^#/, '')).filter(Boolean)));
    localStorage.setItem(PRESET_TAGS_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save preset tags:', e);
  }
}

export function removePresetTag(tagToRemove: string): string[] {
  const clean = tagToRemove.trim().replace(/^#/, '');
  const current = getPresetTags();
  const updated = current.filter(t => t.toLowerCase() !== clean.toLowerCase());
  savePresetTags(updated);
  return updated;
}

export function addPresetTag(newTag: string): string[] {
  const clean = newTag.trim().replace(/^#/, '');
  if (!clean) return getPresetTags();
  const current = getPresetTags();
  if (!current.some(t => t.toLowerCase() === clean.toLowerCase())) {
    const updated = [...current, clean];
    savePresetTags(updated);
    return updated;
  }
  return current;
}

export function resetPresetTags(): string[] {
  savePresetTags(DEFAULT_PRESET_TAGS);
  return DEFAULT_PRESET_TAGS;
}

/**
  * Automatically parses hashtags embedded in description text (e.g. "Payment for #vendor #cash")
  */
export function extractTagsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w\d_অ-ঢ়া-ৌ]+/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map(t => t.toLowerCase())));
}

export function getCategoryBadgeColor(category: string, type: EntryType): string {
  const catList = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const match = catList.find(c => c.id === category || c.label.toLowerCase() === category.toLowerCase());
  return match ? match.color : type === 'income' ? 'bg-emerald-500' : 'bg-rose-500';
}
