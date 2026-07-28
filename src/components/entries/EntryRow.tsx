import React, { useState, useEffect } from 'react';
import { Entry, EntryType } from '../../types/entry.types';
import { Trash2, ChevronDown, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getCustomCategories,
  addCustomCategory,
  removeCustomCategory,
} from '../../utils/categories';
import { toBengaliNumerals, parseBengaliToEnglishDigits } from '../../utils/numberFormat';

interface EntryRowProps {
  entry: Entry;
  type: EntryType;
  index: number;
  onUpdate: (index: number, updated: Partial<Entry>) => void;
  onDelete: (index: number) => void;
}

export const EntryRow: React.FC<EntryRowProps> = ({
  entry,
  type,
  index,
  onUpdate,
  onDelete,
}) => {
  const { userProfile, t } = useApp();

  // Custom Category Dropdown Options State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCatManager, setShowCatManager] = useState<boolean>(false);
  const [catInput, setCatInput] = useState<string>('');

  // Display Amount state to allow typing in both Bangla and English numerals
  const [displayAmount, setDisplayAmount] = useState<string>(() => {
    if (!entry.amount) return '';
    return userProfile.language === 'bn' ? toBengaliNumerals(entry.amount) : String(entry.amount);
  });

  useEffect(() => {
    setCustomCategories(getCustomCategories(type));
  }, [type]);

  // Sync display string with entry.amount when modified externally or language changes
  useEffect(() => {
    const currentNum = parseFloat(parseBengaliToEnglishDigits(displayAmount)) || 0;
    if (currentNum !== (entry.amount || 0)) {
      if (!entry.amount) {
        setDisplayAmount('');
      } else {
        setDisplayAmount(userProfile.language === 'bn' ? toBengaliNumerals(entry.amount) : String(entry.amount));
      }
    } else if (userProfile.language === 'bn' && entry.amount && !/[০-৯]/.test(displayAmount)) {
      setDisplayAmount(toBengaliNumerals(entry.amount));
    } else if (userProfile.language === 'en' && entry.amount && /[০-৯]/.test(displayAmount)) {
      setDisplayAmount(String(entry.amount));
    }
  }, [entry.amount, userProfile.language]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(index, { description: e.target.value });
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__manage_options__') {
      setShowCatManager(true);
    } else {
      onUpdate(index, { category: val });
    }
  };

  const handleAddNewCategoryOption = () => {
    if (!catInput.trim()) return;
    const cleanCat = catInput.trim();
    const updated = addCustomCategory(type, cleanCat);
    setCustomCategories(updated);
    onUpdate(index, { category: cleanCat });
    setCatInput('');
  };

  const handleRemoveCategoryOption = (catToRemove: string) => {
    const updated = removeCustomCategory(type, catToRemove);
    setCustomCategories(updated);
    if (entry.category === catToRemove) {
      onUpdate(index, { category: '' });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Convert Bengali numerals to Western digits first
    const cleanEng = parseBengaliToEnglishDigits(rawVal);
    // Keep digits and decimal point
    let sanitizedEng = cleanEng.replace(/[^0-9.]/g, '');
    const parts = sanitizedEng.split('.');
    if (parts.length > 2) {
      sanitizedEng = parts[0] + '.' + parts.slice(1).join('');
    }

    const num = parseFloat(sanitizedEng) || 0;
    onUpdate(index, { amount: num });

    if (userProfile.language === 'bn') {
      setDisplayAmount(toBengaliNumerals(sanitizedEng));
    } else {
      setDisplayAmount(sanitizedEng);
    }
  };

  return (
    <tr className="border-b border-gray-200/50 dark:border-gray-800/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
      {/* Column 1: Serial Number + Delete */}
      <td className="py-2.5 px-2 sm:px-3 text-center align-top pt-3 font-bold text-gray-500 dark:text-gray-400 w-12 sm:w-16 shrink-0 relative">
        <div className="flex items-center justify-center gap-1">
          <span className="group-hover:hidden">
            {userProfile.language === 'bn' ? toBengaliNumerals(entry.serial) : entry.serial}
          </span>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="hidden group-hover:flex items-center justify-center p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 transition-all active:scale-90 cursor-pointer"
            title={t.entries.deleteRow}
            aria-label="Delete Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Column 2: Customer / Description + Category Selector */}
      <td className="py-2 px-2 sm:px-3 align-top space-y-1.5">
        <textarea
          value={entry.description}
          onChange={handleDescriptionChange}
          placeholder={userProfile.customLabels?.descriptionPlaceholder || t.entries.descriptionPlaceholder}
          rows={1}
          className="w-full bg-transparent px-2.5 py-1.5 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-blue-500 focus:bg-white/50 dark:focus:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium resize-none overflow-hidden outline-none transition-all leading-relaxed"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* Category Selector Pill Row */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {/* Category Dropdown Pill & Add Option Trigger */}
          <div className="relative inline-flex items-center gap-1">
            <div className="relative inline-flex items-center">
              <select
                value={entry.category || ''}
                onChange={handleCategorySelectChange}
                className="appearance-none bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[11px] font-bold text-gray-700 dark:text-gray-300 px-2.5 py-0.5 pr-6 rounded-full border border-gray-300/40 dark:border-gray-700/40 outline-none cursor-pointer transition-all"
              >
                <option value="" className="bg-white dark:bg-gray-900 text-gray-400">
                  -- Category --
                </option>
                {/* Custom entry value if set and not in customCategories */}
                {entry.category && !customCategories.includes(entry.category) && (
                  <option value={entry.category} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {entry.category}
                  </option>
                )}
                {/* Custom categories options added by user */}
                {customCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    {cat}
                  </option>
                ))}
                <option value="__manage_options__" className="bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold">
                  + Add / Manage Options...
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setShowCatManager(!showCatManager)}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="Add or remove dropdown options"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Category Option Manager Popover */}
          {showCatManager && (
            <div className="w-full mt-1.5 p-2.5 rounded-xl bg-blue-50/90 dark:bg-gray-800/90 border border-blue-200 dark:border-blue-900/50 space-y-2 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-900 dark:text-blue-300">
                  Manage Dropdown Options ({type === 'income' ? 'Income' : 'Expense'})
                </span>
                <button
                  type="button"
                  onClick={() => setShowCatManager(false)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                  title="Close option manager"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input to add a new custom option */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewCategoryOption();
                    if (e.key === 'Escape') setShowCatManager(false);
                  }}
                  placeholder="Type new option name..."
                  className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-blue-300 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategoryOption}
                  disabled={!catInput.trim()}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* List of active custom options with Delete X buttons */}
              <div className="pt-1.5 border-t border-blue-200/50 dark:border-gray-700/50">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Active Dropdown Options ({customCategories.length})
                </div>
                {customCategories.length === 0 ? (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                    No custom options added yet. Type an option above to create one!
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {customCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onUpdate(index, { category: cat });
                            setShowCatManager(false);
                          }}
                          className="hover:underline cursor-pointer"
                          title={`Select '${cat}' for this row`}
                        >
                          {cat}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryOption(cat)}
                          className="p-0.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all cursor-pointer ml-0.5"
                          title={`Remove '${cat}' option from dropdown`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </td>

      {/* Column 3: Amount */}
      <td className="py-2 px-2 sm:px-3 align-top pt-3 w-28 sm:w-40">
        <div className="relative flex items-center">
          <span className="absolute left-2.5 text-xs font-bold text-gray-400 dark:text-gray-500 select-none">
            {userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹')}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder={userProfile.language === 'bn' ? '০' : '0'}
            className={`w-full bg-transparent pl-7 pr-2.5 py-1.5 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-blue-500 focus:bg-white/50 dark:focus:bg-gray-900/50 text-right font-bold font-tabular text-sm sm:text-base outline-none transition-all ${
              type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </div>
      </td>
    </tr>
  );
};

