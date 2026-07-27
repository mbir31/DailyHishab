import { EntryType } from '../types/entry.types';

export interface CategoryOption {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

export const DEFAULT_INCOME_CATEGORIES: CategoryOption[] = [
  { id: 'sales', label: 'Sales & Revenue', iconName: 'ShoppingBag', color: 'bg-emerald-500' },
  { id: 'services', label: 'Services & Consulting', iconName: 'Briefcase', color: 'bg-teal-500' },
  { id: 'salary', label: 'Salary / Wages', iconName: 'Banknote', color: 'bg-cyan-500' },
  { id: 'investments', label: 'Investments & Profit', iconName: 'TrendingUp', color: 'bg-blue-500' },
  { id: 'refunds', label: 'Refunds & Returns', iconName: 'RotateCcw', color: 'bg-indigo-500' },
  { id: 'other_income', label: 'Other Income', iconName: 'PlusCircle', color: 'bg-slate-500' },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryOption[] = [
  { id: 'rent', label: 'Rent & Lease', iconName: 'Building', color: 'bg-rose-500' },
  { id: 'utilities', label: 'Utilities & Bills', iconName: 'Zap', color: 'bg-amber-500' },
  { id: 'salaries', label: 'Staff Salaries', iconName: 'Users', color: 'bg-orange-500' },
  { id: 'supplies', label: 'Office Supplies', iconName: 'Package', color: 'bg-yellow-500' },
  { id: 'food', label: 'Food & Dining', iconName: 'Utensils', color: 'bg-red-500' },
  { id: 'transport', label: 'Travel & Transport', iconName: 'Car', color: 'bg-purple-500' },
  { id: 'marketing', label: 'Marketing & Ads', iconName: 'Megaphone', color: 'bg-pink-500' },
  { id: 'maintenance', label: 'Maintenance & Repairs', iconName: 'Wrench', color: 'bg-stone-500' },
  { id: 'taxes', label: 'Taxes & Fees', iconName: 'Receipt', color: 'bg-slate-500' },
  { id: 'other_expense', label: 'General Expense', iconName: 'MinusCircle', color: 'bg-gray-500' },
];

export const DEFAULT_PRESET_TAGS: string[] = [];

export const POPULAR_TAGS: string[] = [];

const PRESET_TAGS_STORAGE_KEY = 'dailyhishab_preset_tags';

export function getPresetTags(): string[] {
  try {
    const stored = localStorage.getItem(PRESET_TAGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const tags = parsed.map((t: string) => t.replace(/^#/, ''));
        // Clean up legacy preset tags if user hasn't customized yet
        const legacyDefaults = ['cash', 'bank', 'online', 'urgent', 'projecta', 'vendor', 'client', 'pending'];
        if (
          tags.length === legacyDefaults.length &&
          tags.every((t, i) => t.toLowerCase() === legacyDefaults[i])
        ) {
          localStorage.setItem(PRESET_TAGS_STORAGE_KEY, JSON.stringify([]));
          return [];
        }
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
