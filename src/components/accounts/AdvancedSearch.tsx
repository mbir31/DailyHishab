import React, { useState, useMemo, useEffect } from 'react';
import { Entry, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDateWithDay } from '../../utils/dateHelpers';
import { getPresetTags, removePresetTag } from '../../utils/categories';
import { toBengaliNumerals, parseBengaliToEnglishDigits } from '../../utils/numberFormat';
import { Search, Filter, Calendar, X, Tag, ArrowUpRight, ArrowDownRight, RotateCcw, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
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

  // Filtered & Sorted Entries Logic
  const filteredEntries = useMemo(() => {
    const list = entries.filter((e) => {
      // 1. Type filter
      if (selectedType !== 'all' && e.type !== selectedType) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // 3. Amount filter
      const numMin = minAmount ? parseFloat(parseBengaliToEnglishDigits(minAmount)) : NaN;
      const numMax = maxAmount ? parseFloat(parseBengaliToEnglishDigits(maxAmount)) : NaN;
      if (!isNaN(numMin) && (e.amount || 0) < numMin) return false;
      if (!isNaN(numMax) && (e.amount || 0) > numMax) return false;

      // 4. Date filter
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;

      // 5. Keyword Query Search (Description, Category, Tags, Amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qEng = parseBengaliToEnglishDigits(q);
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const catMatch = (e.category || '').toLowerCase().includes(q);
        const tagMatch = e.tags?.some((t) => t.toLowerCase().includes(q));
        const amountValStr = (e.amount || 0).toString();
        const amountBnStr = toBengaliNumerals(amountValStr);
        const amountMatch = amountValStr.includes(q) || amountValStr.includes(qEng) || amountBnStr.includes(q);
        if (!descMatch && !catMatch && !tagMatch && !amountMatch) return false;
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [entries, selectedType, selectedCategory, minAmount, maxAmount, startDate, endDate, searchQuery, sortBy]);

  // Totals for filtered view
  const filteredIncome = filteredEntries.reduce((s, e) => (e.type === 'income' ? s + e.amount : s), 0);
  const filteredExpense = filteredEntries.reduce((s, e) => (e.type === 'expense' ? s + e.amount : s), 0);
  const filteredNet = filteredIncome - filteredExpense;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  const handleExportSearchResults = () => {
    try {
      const rows = filteredEntries.map((e, idx) => ({
        'SL No': idx + 1,
        Date: e.date,
        Type: e.type.toUpperCase(),
        Description: e.description || '',
        Category: e.category || 'General',
        Tags: e.tags ? e.tags.join(', ') : '',
        Amount: e.amount,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered Search Results');
      XLSX.writeFile(wb, `DailyHishab_Search_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Failed to export search results.');
    }
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
              {userProfile.language === 'bn' ? 'উন্নত অনুসন্ধান ও ফিল্টার' : 'Advanced Search & Filters'}
            </h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {userProfile.language === 'bn' ? 'কীওয়ার্ড, ট্যাগ, ক্যাটাগরি, টাকার পরিমাণ বা তারিখ অনুযায়ী খুঁজুন' : 'Filter entries by keyword, tags, category, amount, or custom date range'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{userProfile.language === 'bn' ? 'রিসেট' : 'Reset'}</span>
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
            placeholder={userProfile.language === 'bn' ? 'গ্রাহক, বিবরণ, ক্যাটাগরি বা #ট্যাগ লিখে খুঁজুন...' : 'Search by customer, note, category or #tag...'}
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
            <option value="all">{userProfile.language === 'bn' ? 'সকল প্রকার (আয় ও খরচ)' : 'All Types (Income & Expense)'}</option>
            <option value="income">{userProfile.language === 'bn' ? 'শুধুমাত্র আয়' : 'Income Only'}</option>
            <option value="expense">{userProfile.language === 'bn' ? 'শুধুমাত্র খরচ' : 'Expense Only'}</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{userProfile.language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
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
            {userProfile.language === 'bn' ? 'তারিখ হতে' : 'Date From'}
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
            {userProfile.language === 'bn' ? 'তারিখ পর্যন্ত' : 'Date To'}
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
            {userProfile.language === 'bn' ? 'সর্বনিম্ন পরিমাণ' : 'Min Amount'} ({currencySymbol})
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={userProfile.language === 'bn' ? toBengaliNumerals(minAmount) : minAmount}
            onChange={(e) => {
              const eng = parseBengaliToEnglishDigits(e.target.value).replace(/[^0-9.]/g, '');
              setMinAmount(eng);
            }}
            placeholder={userProfile.language === 'bn' ? '০' : '0'}
            className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max Amount */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-gray-500 dark:text-gray-400 mb-1">
            {userProfile.language === 'bn' ? 'সর্বোচ্চ পরিমাণ' : 'Max Amount'} ({currencySymbol})
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={userProfile.language === 'bn' ? toBengaliNumerals(maxAmount) : maxAmount}
            onChange={(e) => {
              const eng = parseBengaliToEnglishDigits(e.target.value).replace(/[^0-9.]/g, '');
              setMaxAmount(eng);
            }}
            placeholder={userProfile.language === 'bn' ? 'যেকোনো' : 'Any'}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200/50 dark:border-gray-800 text-xs font-bold">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 dark:text-gray-300">
            Found <span className="text-blue-600 dark:text-blue-400 font-extrabold">{filteredEntries.length}</span> entries
          </span>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-gray-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-gray-800 dark:text-gray-200 font-bold outline-none cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">
              In: {currencySymbol} {filteredIncome.toLocaleString()}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              Out: {currencySymbol} {filteredExpense.toLocaleString()}
            </span>
            <span className={`font-black ${filteredNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>
              Net: {currencySymbol} {filteredNet.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportSearchResults}
            disabled={filteredEntries.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            title="Export current search results to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Search</span>
          </button>
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
