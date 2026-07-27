import React, { useState, useEffect } from 'react';
import { Entry, EntryType, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types/entry.types';
import { Trash2, Tag, ChevronDown, Plus, X, Check, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getPresetTags, removePresetTag, addPresetTag, resetPresetTags } from '../../utils/categories';

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
  const [showTagInput, setShowTagInput] = useState<boolean>(false);
  const [tagText, setTagText] = useState<string>('');
  const [presetTags, setPresetTags] = useState<string[]>([]);

  useEffect(() => {
    setPresetTags(getPresetTags());
  }, []);

  const categories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(index, { description: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(index, { category: e.target.value });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/[^0-9.]/g, '');
    const num = parseFloat(sanitized) || 0;
    onUpdate(index, { amount: num });
  };

  const handleAddTag = () => {
    if (!tagText.trim()) return;
    const cleanTag = tagText.trim().replace(/^#/, '');
    const existingTags = entry.tags || [];
    if (!existingTags.includes(cleanTag)) {
      onUpdate(index, { tags: [...existingTags, cleanTag] });
    }
    // Also add to preset tags if new
    const updatedPresets = addPresetTag(cleanTag);
    setPresetTags(updatedPresets);
    setTagText('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const existingTags = entry.tags || [];
    onUpdate(index, { tags: existingTags.filter(t => t !== tagToRemove) });
  };

  const handleTogglePresetTag = (pTag: string) => {
    const existingTags = entry.tags || [];
    if (existingTags.includes(pTag)) {
      onUpdate(index, { tags: existingTags.filter(t => t !== pTag) });
    } else {
      onUpdate(index, { tags: [...existingTags, pTag] });
    }
  };

  const handleDeletePresetTagFromStorage = (pTag: string) => {
    const updated = removePresetTag(pTag);
    setPresetTags(updated);
  };

  const handleResetPresetsList = () => {
    const reset = resetPresetTags();
    setPresetTags(reset);
  };

  return (
    <tr className="border-b border-gray-200/50 dark:border-gray-800/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
      {/* Column 1: Serial Number + Delete */}
      <td className="py-2.5 px-2 sm:px-3 text-center align-top pt-3 font-bold text-gray-500 dark:text-gray-400 w-12 sm:w-16 shrink-0 relative">
        <div className="flex items-center justify-center gap-1">
          <span className="group-hover:hidden">{entry.serial}</span>
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="hidden group-hover:flex items-center justify-center p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 transition-all active:scale-90"
            title={t.entries.deleteRow}
            aria-label="Delete Row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Column 2: Customer / Description + Category & Tags */}
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

        {/* Category Selector & Tags Pill Row */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {/* Category Dropdown Pill */}
          <div className="relative inline-flex items-center">
            <select
              value={entry.category || categories[0]}
              onChange={handleCategoryChange}
              className="appearance-none bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[11px] font-bold text-gray-700 dark:text-gray-300 px-2.5 py-0.5 pr-6 rounded-full border border-gray-300/40 dark:border-gray-700/40 outline-none cursor-pointer transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Active Tags */}
          {entry.tags && entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 p-0.5 rounded-full hover:bg-rose-500/15 transition-all cursor-pointer flex items-center justify-center"
                title={`Remove #${tag}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          {/* Add Tag & Preset Tags Drawer */}
          {showTagInput ? (
            <div className="w-full mt-1.5 p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-300/60 dark:border-gray-700/60 space-y-2 shadow-xs">
              {/* Input Field with Cross/Clear Button */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    autoFocus
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setShowTagInput(false);
                    }}
                    placeholder="Enter custom tag..."
                    className="w-full pl-2.5 pr-6 py-1 text-xs bg-white dark:bg-gray-900 border border-blue-500/60 rounded-lg outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  {tagText && (
                    <button
                      type="button"
                      onClick={() => setTagText('')}
                      className="absolute right-2 text-gray-400 hover:text-rose-500 p-0.5 rounded-full transition-colors cursor-pointer"
                      title="Clear text"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagText.trim()}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagInput(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                  title="Close tag menu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Saved Tags List */}
              <div className="pt-1.5 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
                    Your Saved Tags
                  </span>
                  {presetTags.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetPresetsList}
                      className="text-[10px] text-gray-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
                      title="Clear all saved tags"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {presetTags.length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">No saved tags yet. Type a tag above to create one!</span>
                  ) : (
                    presetTags.map((pTag) => {
                      const isAttached = (entry.tags || []).includes(pTag);
                      return (
                        <div
                          key={pTag}
                          className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                            isAttached
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 shadow-2xs'
                              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleTogglePresetTag(pTag)}
                            className="flex items-center gap-1 cursor-pointer hover:underline"
                            title={isAttached ? `Remove #${pTag} from row` : `Add #${pTag} to row`}
                          >
                            <span>#{pTag}</span>
                            {isAttached && <Check className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 stroke-[3]" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePresetTagFromStorage(pTag);
                            }}
                            className="p-0.5 ml-0.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all cursor-pointer"
                            title={`Delete #${pTag}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 transition-all cursor-pointer"
              title="Add or manage tags"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>+ Tag</span>
            </button>
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
            type="number"
            step="any"
            min="0"
            value={entry.amount === 0 ? '' : entry.amount}
            onChange={handleAmountChange}
            placeholder="0"
            className={`w-full bg-transparent pl-7 pr-2.5 py-1.5 rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-blue-500 focus:bg-white/50 dark:focus:bg-gray-900/50 text-right font-bold font-tabular text-sm sm:text-base outline-none transition-all ${
              type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </div>
      </td>
    </tr>
  );
};
