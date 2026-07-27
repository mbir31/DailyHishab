import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllEntries } from '../../utils/storage';
import { formatDateWithDay } from '../../utils/dateHelpers';
import { Entry, EntryType } from '../../types/entry.types';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  getPresetTags,
  removePresetTag,
} from '../../utils/categories';
import { ExportStatementModal } from './ExportStatementModal';
import {
  Search,
  Filter,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const AdvancedSearchSection: React.FC = () => {
  const { userProfile, t } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const allEntries: Entry[] = useMemo(() => {
    return getAllEntries();
  }, []);

  // Combine unique categories for filter
  const allCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_INCOME_CATEGORIES.forEach((c) => set.add(c.label));
    DEFAULT_EXPENSE_CATEGORIES.forEach((c) => set.add(c.label));
    allEntries.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [allEntries]);

  // Combine unique tags for filter
  const allTagOptions = useMemo(() => {
    const set = new Set<string>();
    getPresetTags().forEach((t) => set.add(t));
    allEntries.forEach((e) => {
      if (e.tags) e.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [allEntries]);

  // Execute advanced search & filter pipeline
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      // 1. Keyword search (Description / Serial / Category / Tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inDesc = e.description?.toLowerCase().includes(q);
        const inCat = e.category?.toLowerCase().includes(q);
        const inSerial = e.serial.toString() === q;
        const inTag = e.tags ? e.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (!inDesc && !inCat && !inSerial && !inTag) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;

      // 3. Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // 4. Tag filter
      if (selectedTag !== 'all') {
        if (!e.tags || !e.tags.includes(selectedTag)) return false;
      }

      // 5. Min/Max Amount filter
      if (minAmount !== '') {
        const min = parseFloat(minAmount);
        if (!isNaN(min) && e.amount < min) return false;
      }
      if (maxAmount !== '') {
        const max = parseFloat(maxAmount);
        if (!isNaN(max) && e.amount > max) return false;
      }

      // 6. Date Range filter
      if (fromDate !== '' && e.date < fromDate) return false;
      if (toDate !== '' && e.date > toDate) return false;

      return true;
    });
  }, [
    allEntries,
    searchQuery,
    typeFilter,
    selectedCategory,
    selectedTag,
    minAmount,
    maxAmount,
    fromDate,
    toDate,
  ]);

  // Aggregated totals of search results
  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredEntries.forEach((e) => {
      if (e.type === 'income') inc += e.amount || 0;
      if (e.type === 'expense') exp += e.amount || 0;
    });
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
    };
  }, [filteredEntries]);

  const currency = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setSelectedTag('all');
    setMinAmount('');
    setMaxAmount('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Advanced Search Filter Panel */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/50 dark:border-white/10 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Search className="w-5 h-5 text-blue-500" />
            <span>Advanced Search & Ledger Filters</span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Row 1: Keyword Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search particulars, customer name, category, or #tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Row 2: Type, Category, Tag Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
              Entry Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Types (Income & Expense)</option>
              <option value="income">Income Only (+)</option>
              <option value="expense">Expense Only (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">
              Hashtag
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">All Tags</option>
              {allTagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Date Range & Amount Range */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Max Amount</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="∞"
              className="w-full px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Filter Summary & Export Header */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-gray-900 dark:text-white">
            Matched: <strong className="text-blue-500">{filteredEntries.length}</strong> entries
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Inc: {currency} {totals.income.toLocaleString()}
          </span>
          <span className="text-rose-600 dark:text-rose-400">
            Exp: {currency} {totals.expense.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Search Results (Excel / PDF)</span>
        </button>
      </div>

      {/* Filtered Ledger Table Results */}
      <div className="glass-panel overflow-hidden shadow-xl border border-white/50 dark:border-white/10 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-gray-200/60 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Category & Particulars</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-gray-400 font-semibold">
                    No ledger transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-gray-200/40 dark:border-gray-800/40 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium"
                  >
                    <td className="py-2.5 px-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateWithDay(e.date, userProfile.language, true)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          e.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {e.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-900 dark:text-white">
                      <div className="font-semibold">{e.description || '—'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                        {e.category && (
                          <span className="font-bold text-gray-600 dark:text-gray-300">
                            [{e.category}]
                          </span>
                        )}
                        {e.tags && e.tags.map((t) => <span key={t}>#{t}</span>)}
                      </div>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold text-sm font-tabular ${
                        e.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {currency} {e.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Statement Modal */}
      {isExportModalOpen && (
        <ExportStatementModal
          entries={filteredEntries}
          fromDate={fromDate || 'Beginning'}
          toDate={toDate || 'Present'}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};
