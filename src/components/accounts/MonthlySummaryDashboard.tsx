import React, { useState, useMemo } from 'react';
import { Entry } from '../../types/entry.types';
import { getAllEntries } from '../../utils/storage';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Tag,
  Receipt,
  Scale,
  Sparkles,
  Award,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MonthlySummaryDashboardProps {
  entries?: Entry[];
}

export const MonthlySummaryDashboard: React.FC<MonthlySummaryDashboardProps> = ({ entries: propEntries }) => {
  const { userProfile } = useApp();

  // Current year & month defaults
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12

  const currencySymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');
  const isBn = userProfile.language === 'bn';

  const allEntries = useMemo(() => {
    return propEntries || getAllEntries();
  }, [propEntries]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonthReset = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Month Names
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const bnMonths = [
    'জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const monthName = isBn ? bnMonths[selectedMonth - 1] : enMonths[selectedMonth - 1];

  // Helper for days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Calculate metrics for selected month and previous month
  const {
    currentEntries,
    currentIncome,
    currentExpense,
    incomeCount,
    expenseCount,
    prevIncome,
    prevExpense,
    topIncomeCategories,
    topExpenseCategories,
    highestIncomeEntry,
    highestExpenseEntry,
    dailySummaryMap,
  } = useMemo(() => {
    // Current Month String Prefix: "YYYY-MM"
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    // Previous Month Details
    const pYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const pMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevMonthStr = `${pYear}-${String(pMonth).padStart(2, '0')}`;

    let inc = 0;
    let exp = 0;
    let incCnt = 0;
    let expCnt = 0;

    let pInc = 0;
    let pExp = 0;

    const currEntries: Entry[] = [];
    const incCatMap: Record<string, { total: number; count: number }> = {};
    const expCatMap: Record<string, { total: number; count: number }> = {};

    let maxIncEntry: Entry | null = null;
    let maxExpEntry: Entry | null = null;

    const dayMap: Record<string, { income: number; expense: number; count: number }> = {};

    allEntries.forEach((e) => {
      if (!e.date) return;

      if (e.date.startsWith(monthStr)) {
        currEntries.push(e);
        const dayKey = e.date;
        if (!dayMap[dayKey]) dayMap[dayKey] = { income: 0, expense: 0, count: 0 };
        dayMap[dayKey].count++;

        if (e.type === 'income') {
          const amt = e.amount || 0;
          inc += amt;
          if (amt > 0) incCnt++;
          dayMap[dayKey].income += amt;

          const cat = e.category?.trim() || (isBn ? 'অন্যান্য আয়' : 'General Income');
          if (!incCatMap[cat]) incCatMap[cat] = { total: 0, count: 0 };
          incCatMap[cat].total += amt;
          incCatMap[cat].count++;

          if (!maxIncEntry || amt > maxIncEntry.amount) {
            maxIncEntry = e;
          }
        } else if (e.type === 'expense') {
          const amt = e.amount || 0;
          exp += amt;
          if (amt > 0) expCnt++;
          dayMap[dayKey].expense += amt;

          const cat = e.category?.trim() || (isBn ? 'অন্যান্য খরচ' : 'General Expense');
          if (!expCatMap[cat]) expCatMap[cat] = { total: 0, count: 0 };
          expCatMap[cat].total += amt;
          expCatMap[cat].count++;

          if (!maxExpEntry || amt > maxExpEntry.amount) {
            maxExpEntry = e;
          }
        }
      } else if (e.date.startsWith(prevMonthStr)) {
        if (e.type === 'income') {
          pInc += e.amount || 0;
        } else if (e.type === 'expense') {
          pExp += e.amount || 0;
        }
      }
    });

    const topInc = Object.entries(incCatMap)
      .map(([name, data]) => ({ name, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total);

    const topExp = Object.entries(expCatMap)
      .map(([name, data]) => ({ name, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total);

    return {
      currentEntries: currEntries,
      currentIncome: inc,
      currentExpense: exp,
      incomeCount: incCnt,
      expenseCount: expCnt,
      prevIncome: pInc,
      prevExpense: pExp,
      topIncomeCategories: topInc,
      topExpenseCategories: topExp,
      highestIncomeEntry: maxIncEntry,
      highestExpenseEntry: maxExpEntry,
      dailySummaryMap: dayMap,
    };
  }, [allEntries, selectedYear, selectedMonth, isBn]);

  const currentNet = currentIncome - currentExpense;
  const prevNet = prevIncome - prevExpense;

  // Percentage calculations
  const savingsRate = currentIncome > 0 ? Math.max(0, Math.round((currentNet / currentIncome) * 100)) : 0;
  const expenseRatio = currentIncome > 0 ? Math.min(100, Math.round((currentExpense / currentIncome) * 100)) : 0;

  const avgDailyIncome = Math.round(currentIncome / daysInMonth);
  const avgDailyExpense = Math.round(currentExpense / daysInMonth);

  // Variance vs Previous Month
  const incomeDiff = currentIncome - prevIncome;
  const incomeChangePct = prevIncome > 0 ? Math.round((incomeDiff / prevIncome) * 100) : 0;

  const expenseDiff = currentExpense - prevExpense;
  const expenseChangePct = prevExpense > 0 ? Math.round((expenseDiff / prevExpense) * 100) : 0;

  const activeDaysCount = Object.keys(dailySummaryMap).length;

  const formatNumber = (num: number) => {
    return num.toLocaleString(isBn ? 'bn-BD' : 'en-US');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Month Selection Header Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 dark:border-white/10 shadow-lg bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-purple-900/10 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {isBn ? 'মাসিক আয় ও ব্যয়ের হিসাব সামারি' : 'Monthly Financial Dashboard'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
              {isBn
                ? `${monthName} ${selectedYear}-এর হিসাব সংক্ষেপ এবং ক্যাশফ্লো রিপোর্ট`
                : `Comprehensive text summary & breakdown for ${monthName} ${selectedYear}`}
            </p>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="px-4 py-2 rounded-2xl bg-blue-600 text-white font-extrabold text-sm sm:text-base shadow-md min-w-[140px] text-center">
              {monthName} {selectedYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {(selectedYear !== today.getFullYear() || selectedMonth !== today.getMonth() + 1) && (
              <button
                type="button"
                onClick={handleCurrentMonthReset}
                className="px-3 py-2 text-xs font-bold rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all cursor-pointer"
              >
                {isBn ? 'চলতি মাস' : 'Current Month'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Income */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="uppercase tracking-wider">{isBn ? 'মোট আয়' : 'Total Income'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {currencySymbol}{formatNumber(currentIncome)}
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-semibold mt-1">
              {incomeCount} {isBn ? 'টি এন্ট্রি' : 'transactions'} • {currencySymbol}{formatNumber(avgDailyIncome)}/{isBn ? 'দিন' : 'day'}
            </p>
          </div>
          {prevIncome > 0 && (
            <div className="pt-2 border-t border-emerald-500/20 flex items-center gap-1.5 text-[11px] font-bold">
              {incomeDiff >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{incomeChangePct}%
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {incomeChangePct}%
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {isBn ? 'গত মাসের তুলনায়' : 'vs last month'}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Total Expense */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
            <span className="uppercase tracking-wider">{isBn ? 'মোট খরচ' : 'Total Expense'}</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {currencySymbol}{formatNumber(currentExpense)}
            </div>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80 font-semibold mt-1">
              {expenseCount} {isBn ? 'টি এন্ট্রি' : 'transactions'} • {currencySymbol}{formatNumber(avgDailyExpense)}/{isBn ? 'দিন' : 'day'}
            </p>
          </div>
          {prevExpense > 0 && (
            <div className="pt-2 border-t border-rose-500/20 flex items-center gap-1.5 text-[11px] font-bold">
              {expenseDiff <= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {expenseChangePct}%
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{expenseChangePct}%
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {isBn ? 'গত মাসের তুলনায়' : 'vs last month'}
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Net Cash Flow / Balance */}
        <div className={`glass-panel p-5 rounded-2xl border space-y-3 relative overflow-hidden shadow-sm ${
          currentNet >= 0
            ? 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10'
            : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
            <span className="uppercase tracking-wider">{isBn ? 'মাসিক নিট ব্যালেন্স' : 'Net Balance'}</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
              currentNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {currencySymbol}{formatNumber(currentNet)}
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
              {currentNet >= 0
                ? (isBn ? 'উদ্বৃত্ত (Surplus)' : 'Net Surplus')
                : (isBn ? 'ঘাটতি (Deficit)' : 'Net Deficit')}
            </p>
          </div>
          <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between text-[11px] font-bold">
            <span className="text-gray-500 dark:text-gray-400">{isBn ? 'সঞ্চয় হার:' : 'Savings Rate:'}</span>
            <span className={savingsRate > 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
              {savingsRate}%
            </span>
          </div>
        </div>

        {/* Card 4: Monthly Health Ratio */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-3 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <span className="uppercase tracking-wider">{isBn ? 'খরচের অনুপাত' : 'Expense Ratio'}</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {expenseRatio}%
            </div>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 font-semibold mt-1">
              {isBn ? 'আয়ের বিপরীতে ব্যয়ের শতকরা হার' : 'of income spent this month'}
            </p>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expenseRatio > 80 ? 'bg-rose-500' : expenseRatio > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, expenseRatio)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Narrative Executive Summary Text Box */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 dark:border-white/10 shadow-md space-y-3 bg-white/60 dark:bg-gray-900/60">
        <div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{isBn ? 'মাসিক সংক্ষেপ ও বিশ্লেষণ' : 'Monthly Executive Summary'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
          {isBn ? (
            <>
              <strong>{monthName} {selectedYear}</strong> মাসে আপনার মোট আয় অর্জিত হয়েছে{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{formatNumber(currentIncome)}</span>{' '}
              ({incomeCount} টি এন্ট্রিতে) এবং মোট ব্যয় সংঘটিত হয়েছে{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400">{currencySymbol}{formatNumber(currentExpense)}</span>{' '}
              ({expenseCount} টি এন্ট্রিতে)।{' '}
              {currentNet >= 0 ? (
                <>
                  ফলে এই মাসে আপনার মোট অর্জিত উদ্বৃত্ত দাঁড়িয়েছে{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">{currencySymbol}{formatNumber(currentNet)}</span>{' '}
                  (যা মোট আয়ের {savingsRate}% সঞ্চয় হার)।
                </>
              ) : (
                <>
                  ফলে এই মাসে ব্যয়ের পরিমাণ আয়কে অতিক্রম করায় মোট ঘাটতি দাঁড়িয়েছে{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">{currencySymbol}{formatNumber(Math.abs(currentNet))}</span>।
                </>
              )}{' '}
              গড়ে প্রতিদিনের আয় ছিল {currencySymbol}{formatNumber(avgDailyIncome)} এবং প্রতিদিনের খরচ ছিল {currencySymbol}{formatNumber(avgDailyExpense)}।{' '}
              এই মাসে মোট {activeDaysCount} দিন লেনদেন লিপিবদ্ধ করা হয়েছে।
            </>
          ) : (
            <>
              During <strong>{monthName} {selectedYear}</strong>, total income recorded was{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{formatNumber(currentIncome)}</span>{' '}
              across {incomeCount} entry(ies), while total expenses totaled{' '}
              <span className="font-bold text-rose-600 dark:text-rose-400">{currencySymbol}{formatNumber(currentExpense)}</span>{' '}
              across {expenseCount} entry(ies).{' '}
              {currentNet >= 0 ? (
                <>
                  This generated a net surplus of{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">{currencySymbol}{formatNumber(currentNet)}</span>{' '}
                  representing a {savingsRate}% monthly savings retention rate.
                </>
              ) : (
                <>
                  This resulted in a net monthly deficit of{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">{currencySymbol}{formatNumber(Math.abs(currentNet))}</span>.
                </>
              )}{' '}
              Daily averages stood at {currencySymbol}{formatNumber(avgDailyIncome)} for income and {currencySymbol}{formatNumber(avgDailyExpense)} for expenses across {activeDaysCount} active transaction days.
            </>
          )}
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {highestIncomeEntry && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                {isBn ? 'সর্বোচ্চ আয় এন্ট্রি' : 'Top Income Entry'}
              </span>
              <p className="font-bold text-gray-900 dark:text-white">
                {highestIncomeEntry.description} ({currencySymbol}{formatNumber(highestIncomeEntry.amount)})
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {highestIncomeEntry.date} • {highestIncomeEntry.category || 'General'}
              </p>
            </div>
          )}

          {highestExpenseEntry && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
              <span className="font-bold text-rose-700 dark:text-rose-300 block">
                {isBn ? 'সর্বোচ্চ খরচ এন্ট্রি' : 'Top Expense Entry'}
              </span>
              <p className="font-bold text-gray-900 dark:text-white">
                {highestExpenseEntry.description} ({currencySymbol}{formatNumber(highestExpenseEntry.amount)})
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {highestExpenseEntry.date} • {highestExpenseEntry.category || 'General'}
              </p>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
            <span className="font-bold text-indigo-700 dark:text-indigo-300 block">
              {isBn ? 'সক্রিয় দিন সংখ্যা' : 'Active Days'}
            </span>
            <p className="font-bold text-gray-900 dark:text-white">
              {activeDaysCount} / {daysInMonth} {isBn ? 'দিন এন্ট্রি রয়েছে' : 'days with activity'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {daysInMonth - activeDaysCount} {isBn ? 'দিন কোন লেনদেন হয়নি' : 'days without transactions'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Tables (Text-Based) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Categories */}
        <div className="glass-panel p-5 rounded-3xl border border-white/60 dark:border-white/10 shadow-md space-y-4 bg-white/60 dark:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                {isBn ? 'খাতভিত্তিক আয়' : 'Income Categories'}
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {topIncomeCategories.length} {isBn ? 'টি খাত' : 'categories'}
            </span>
          </div>

          {topIncomeCategories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              {isBn ? 'এই মাসে কোন আয়ের হিসাব নেই' : 'No income recorded for this month'}
            </p>
          ) : (
            <div className="space-y-3">
              {topIncomeCategories.map((cat, idx) => {
                const pct = currentIncome > 0 ? Math.round((cat.total / currentIncome) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-800 dark:text-gray-200">
                        {cat.name} <span className="text-gray-400 font-normal">({cat.count})</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {currencySymbol}{formatNumber(cat.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="glass-panel p-5 rounded-3xl border border-white/60 dark:border-white/10 shadow-md space-y-4 bg-white/60 dark:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                {isBn ? 'খাতভিত্তিক ব্যয়' : 'Expense Categories'}
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {topExpenseCategories.length} {isBn ? 'টি খাত' : 'categories'}
            </span>
          </div>

          {topExpenseCategories.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              {isBn ? 'এই মাসে কোন খরচের হিসাব নেই' : 'No expenses recorded for this month'}
            </p>
          ) : (
            <div className="space-y-3">
              {topExpenseCategories.map((cat, idx) => {
                const pct = currentExpense > 0 ? Math.round((cat.total / currentExpense) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-800 dark:text-gray-200">
                        {cat.name} <span className="text-gray-400 font-normal">({cat.count})</span>
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-mono">
                        {currencySymbol}{formatNumber(cat.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Month-over-Month Comparison Text Table */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/60 dark:border-white/10 shadow-md space-y-4 bg-white/60 dark:bg-gray-900/60 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-500" />
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
            {isBn ? 'পূর্ববর্তী মাসের সাথে তুলনা' : 'Month-over-Month Comparison'}
          </h3>
        </div>

        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-[11px]">
              <th className="py-2.5 px-3">{isBn ? 'ক্যাটালগ' : 'Metric'}</th>
              <th className="py-2.5 px-3 text-right">{monthName} {selectedYear}</th>
              <th className="py-2.5 px-3 text-right">{isBn ? 'পূর্ববর্তী মাস' : 'Prev Month'}</th>
              <th className="py-2.5 px-3 text-right">{isBn ? 'পার্থক্য (Variance)' : 'Variance'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
            <tr>
              <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                {isBn ? 'মোট আয়' : 'Total Income'}
              </td>
              <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white font-mono">
                {currencySymbol}{formatNumber(currentIncome)}
              </td>
              <td className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                {currencySymbol}{formatNumber(prevIncome)}
              </td>
              <td className={`py-3 px-3 text-right font-bold font-mono ${incomeDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {incomeDiff >= 0 ? '+' : ''}{currencySymbol}{formatNumber(incomeDiff)} ({incomeChangePct}%)
              </td>
            </tr>

            <tr>
              <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400">
                {isBn ? 'মোট ব্যয়' : 'Total Expense'}
              </td>
              <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white font-mono">
                {currencySymbol}{formatNumber(currentExpense)}
              </td>
              <td className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                {currencySymbol}{formatNumber(prevExpense)}
              </td>
              <td className={`py-3 px-3 text-right font-bold font-mono ${expenseDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {expenseDiff >= 0 ? '+' : ''}{currencySymbol}{formatNumber(expenseDiff)} ({expenseChangePct}%)
              </td>
            </tr>

            <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold">
              <td className="py-3 px-3 text-blue-600 dark:text-blue-400">
                {isBn ? 'নিট ব্যালেন্স' : 'Net Cash Flow'}
              </td>
              <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-mono">
                {currencySymbol}{formatNumber(currentNet)}
              </td>
              <td className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                {currencySymbol}{formatNumber(prevNet)}
              </td>
              <td className={`py-3 px-3 text-right font-mono ${currentNet >= prevNet ? 'text-emerald-600' : 'text-rose-600'}`}>
                {currentNet >= prevNet ? '+' : ''}{currencySymbol}{formatNumber(currentNet - prevNet)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
