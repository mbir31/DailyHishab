import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DateSelector } from '../components/shared/DateSelector';
import { TimeFilter } from '../components/accounts/TimeFilter';
import { SummaryCard } from '../components/accounts/SummaryCard';
import { NotesSection } from '../components/accounts/NotesSection';
import { ExportModal } from '../components/accounts/ExportModal';
import { AnalyticsDashboard } from '../components/accounts/AnalyticsDashboard';
import { AdvancedSearch } from '../components/accounts/AdvancedSearch';
import { StatementExportSection } from '../components/accounts/StatementExportSection';
import { FinancialHealthCard } from '../components/accounts/FinancialHealthCard';
import { TimeFilterType } from '../types/entry.types';
import { getDateRangeForFilter } from '../utils/dateHelpers';
import { getEntriesForRange, getNoteForRange, getAllEntries } from '../utils/storage';
import { ArrowUpRight, ArrowDownRight, Wallet, Scale, BarChart3, Search, FileSpreadsheet, LayoutDashboard, Activity } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { selectedDate, userProfile, t } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'analytics' | 'search' | 'export'>('overview');

  const [activeFilter, setActiveFilter] = useState<TimeFilterType>('day');
  const [customFrom, setCustomFrom] = useState<string>(selectedDate);
  const [customTo, setCustomTo] = useState<string>(selectedDate);

  // Compute active date range based on filter and selected date
  const { from: dateFrom, to: dateTo } = useMemo(() => {
    return getDateRangeForFilter(activeFilter, selectedDate, customFrom, customTo);
  }, [activeFilter, selectedDate, customFrom, customTo]);

  // Query entries in range
  const entriesInRange = useMemo(() => {
    return getEntriesForRange(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  // All time entries for global analytics & search
  const allTimeEntries = useMemo(() => {
    return getAllEntries();
  }, [selectedDate, activeSubTab]);

  // Aggregate income and expenses
  const { totalIncome, incomeCount, totalExpense, expenseCount, netBalance } = useMemo(() => {
    let incTotal = 0;
    let incCnt = 0;
    let expTotal = 0;
    let expCnt = 0;

    entriesInRange.forEach(e => {
      if (e.type === 'income') {
        incTotal += e.amount || 0;
        if (e.amount > 0) incCnt++;
      } else {
        expTotal += e.amount || 0;
        if (e.amount > 0) expCnt++;
      }
    });

    return {
      totalIncome: incTotal,
      incomeCount: incCnt,
      totalExpense: expTotal,
      expenseCount: expCnt,
      netBalance: incTotal - expTotal,
    };
  }, [entriesInRange]);

  // Income vs Expense Percentage Calculation
  const totalVolume = totalIncome + totalExpense;
  const incomePercent = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 50;
  const expensePercent = totalVolume > 0 ? Math.round((totalExpense / totalVolume) * 100) : 50;

  const currentNote = getNoteForRange(dateFrom, dateTo);

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto animate-fade-in">
      {/* Date Selector */}
      <DateSelector />

      {/* Sub Navigation Bar for Reports View */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200/50 dark:border-gray-800 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Trends</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('search')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'search'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search & Filters</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'export'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export PDF & Excel</span>
        </button>
      </div>

      {/* VIEW 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Time Filter Pills & Custom Range */}
          <TimeFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            customFrom={customFrom}
            customTo={customTo}
            onCustomRangeChange={(f, t) => {
              setCustomFrom(f);
              setCustomTo(t);
            }}
          />

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <SummaryCard
              title={t.accounts.summaryCards.totalIncome}
              amount={totalIncome}
              count={incomeCount}
              type="income"
              icon={<ArrowUpRight className="w-5 h-5 text-emerald-500" />}
              subtitle={`${incomePercent}% of volume`}
            />

            <SummaryCard
              title={t.accounts.summaryCards.totalExpense}
              amount={totalExpense}
              count={expenseCount}
              type="expense"
              icon={<ArrowDownRight className="w-5 h-5 text-rose-500" />}
              subtitle={`${expensePercent}% of volume`}
            />

            <SummaryCard
              title={t.accounts.summaryCards.netBalance}
              amount={netBalance}
              count={incomeCount + expenseCount}
              type="balance"
              icon={<Wallet className="w-5 h-5 text-blue-500" />}
              subtitle={netBalance >= 0 ? 'Surplus' : 'Deficit'}
            />
          </div>

          {/* Income vs Expense Ratio Visual Bar */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-2 border border-white/50 dark:border-white/10">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-500" />
                <span>{t.accounts.breakdown}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Income {incomePercent}%
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Expense {expensePercent}%
                </span>
              </div>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${incomePercent}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
              />
              <div
                style={{ width: `${expensePercent}%` }}
                className="h-full bg-rose-500 transition-all duration-500"
              />
            </div>
          </div>

          {/* Professional Financial Health & Ratios Card */}
          <FinancialHealthCard
            entries={entriesInRange}
            fromDate={dateFrom}
            toDate={dateTo}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netBalance={netBalance}
          />

          {/* Notes Section for Selected Period */}
          <NotesSection fromDate={dateFrom} toDate={dateTo} />

          {/* Image Share Modal Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 border border-white/50 dark:border-white/10 text-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Share Card Image
            </h3>
            <ExportModal
              fromDate={dateFrom}
              toDate={dateTo}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netBalance={netBalance}
              noteContent={currentNote}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: ANALYTICS & TRENDS */}
      {activeSubTab === 'analytics' && (
        <AnalyticsDashboard entries={allTimeEntries} />
      )}

      {/* VIEW 3: SEARCH & FILTERS */}
      {activeSubTab === 'search' && (
        <AdvancedSearch entries={allTimeEntries} />
      )}

      {/* VIEW 4: PDF & EXCEL STATEMENTS EXPORT */}
      {activeSubTab === 'export' && (
        <div className="space-y-6">
          <TimeFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            customFrom={customFrom}
            customTo={customTo}
            onCustomRangeChange={(f, t) => {
              setCustomFrom(f);
              setCustomTo(t);
            }}
          />

          <StatementExportSection
            fromDate={dateFrom}
            toDate={dateTo}
            entries={entriesInRange}
          />
        </div>
      )}
    </div>
  );
};
