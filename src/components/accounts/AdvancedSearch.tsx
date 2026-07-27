import React, { useState, useMemo, useEffect } from 'react';
import { Entry, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDateWithDay } from '../../utils/dateHelpers';
import { getPresetTags, removePresetTag } from '../../utils/categories';
import { Search, Filter, Calendar, X, Tag, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';

interface AdvancedSearchProps {
  entries: Entry[];
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ entries }) => {
  const { userProfile } = useApp();
  const currencySymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  // Search Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [presetTags, setPresetTags] = useState<string[]>([]);

  useEffect(() => {
    setPresetTags(getPresetTags());
  }, []);

  // Collect all unique categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_INCOME_CATEGORIES.forEach((c) => set.add(c));
    DEFAULT_EXPENSE_CATEGORIES.forEach((c) => set.add(c));
    entries.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [entries]);

  // Filtered Entries Logic
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // 1. Type filter
      if (selectedType !== 'all' && e.type !== selectedType) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // 3. Amount filter
      if (minAmount && (e.amount || 0) < parseFloat(minAmount)) return false;
      if (maxAmount && (e.amount || 0) > parseFloat(maxAmount)) return false;

      // 4. Date filter
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;

      // 5. Keyword Query Search (Description, Category, Tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const catMatch = (e.category || '').toLowerCase().includes(q);
        const tagMatch = e.tags?.some((t) => t.toLowerCase().includes(q));
        if (!descMatch && !catMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [entries, selectedType, selectedCategory, minAmount, maxAmount, startDate, endDate, searchQuery]);

  // Totals for filtered view
  const filteredIncome = filteredEntries.reduce((s, e) => (e.type === 'income' ? s + e.amount : s), 0);
  const filteredExpense = filteredEntries.reduce((s, e) => (e.type === 'expense' ? s + e.amount : s), 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Advanced Search & Filters
            </h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Filter entries by keyword, tags, category, amount, or custom date range
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Bar Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, note, category or #tag..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Entry Type Selector */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Types (Income & Expense)</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Min Amount */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Min Amount ({currencySymbol})
          </label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max Amount */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 mb-1">
            Max Amount ({currencySymbol})
          </label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Preset Tag Quick Chips */}
      {presetTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quick Tag Filter:</span>
          {presetTags.map((tag) => {
            const isSelected = searchQuery.toLowerCase().includes(tag.toLowerCase());
            return (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-bold border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-700/60 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(`#${tag}`);
                    }
                  }}
                  className="cursor-pointer hover:underline"
                  title={isSelected ? `Clear filter #${tag}` : `Filter by #${tag}`}
                >
                  #{tag}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = removePresetTag(tag);
                    setPresetTags(updated);
                  }}
                  className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                    isSelected ? 'hover:bg-white/20 text-white/80' : 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-500'
                  }`}
                  title={`Remove #${tag} from presets`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Filter Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold">
        <span className="text-gray-700 dark:text-gray-300">
          Found <span className="text-blue-600 dark:text-blue-400 font-extrabold">{filteredEntries.length}</span> matching entries
        </span>

        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400">
            Income: {currencySymbol} {filteredIncome.toLocaleString()}
          </span>
          <span className="text-rose-600 dark:text-rose-400">
            Expense: {currencySymbol} {filteredExpense.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200/60 dark:border-gray-800 max-h-96">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5 border-b border-gray-200/60 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-200/40 dark:border-gray-800/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-gray-500 whitespace-nowrap">{formatDateWithDay(e.date, userProfile.language, true)}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {e.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {e.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                    {e.description || '—'}
                    {e.tags && e.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {e.tags.map((t) => (
                          <span key={t} className="text-[9px] font-bold text-blue-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 font-semibold">
                    {e.category || 'General'}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold font-tabular text-sm ${
                      e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {currencySymbol} {e.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                  No records match your search query
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
