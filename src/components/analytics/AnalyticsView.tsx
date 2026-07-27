import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllEntries } from '../../utils/storage';
import { Entry } from '../../types/entry.types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart as PieIcon,
  BarChart2,
  DollarSign,
  Award,
  CalendarDays,
  Percent,
} from 'lucide-react';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
];

export const AnalyticsView: React.FC = () => {
  const { userProfile, t } = useApp();
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [analyticsMode, setAnalyticsMode] = useState<'yearly' | 'monthly'>('yearly');

  const allEntries: Entry[] = useMemo(() => {
    return getAllEntries();
  }, []);

  // Filter entries for selected year
  const yearEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (!e || !e.date) return false;
      const yr = parseInt(e.date.split('-')[0], 10);
      return yr === selectedYear;
    });
  }, [allEntries, selectedYear]);

  // Monthly breakdown data (Jan - Dec for selected year)
  const monthlyTrendData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const data = months.map((name, index) => {
      const monthNum = index + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      const prefix = `${selectedYear}-${monthStr}`;

      let inc = 0;
      let exp = 0;

      yearEntries.forEach((e) => {
        if (e.date.startsWith(prefix)) {
          if (e.type === 'income') inc += e.amount || 0;
          if (e.type === 'expense') exp += e.amount || 0;
        }
      });

      return {
        month: name,
        Income: inc,
        Expense: exp,
        Net: inc - exp,
      };
    });

    return data;
  }, [yearEntries, selectedYear]);

  // Daily breakdown data for selected month
  const dailyTrendData = useMemo(() => {
    const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
    const prefix = `${selectedYear}-${monthStr}`;

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDate = `${prefix}-${dayStr}`;

      let inc = 0;
      let exp = 0;

      yearEntries.forEach((e) => {
        if (e.date === fullDate) {
          if (e.type === 'income') inc += e.amount || 0;
          if (e.type === 'expense') exp += e.amount || 0;
        }
      });

      result.push({
        day: `${day}`,
        Income: inc,
        Expense: exp,
        Net: inc - exp,
      });
    }

    return result;
  }, [yearEntries, selectedYear, selectedMonth]);

  // Expense Category Breakdown
  const expenseCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    const filtered = analyticsMode === 'yearly'
      ? yearEntries
      : yearEntries.filter((e) => {
          const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
          return e.date.startsWith(`${selectedYear}-${monthStr}`);
        });

    filtered.forEach((e) => {
      if (e.type === 'expense' && e.amount > 0) {
        const cat = e.category || 'General Expense';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
      }
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [yearEntries, selectedYear, selectedMonth, analyticsMode]);

  // Income Category Breakdown
  const incomeCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};

    const filtered = analyticsMode === 'yearly'
      ? yearEntries
      : yearEntries.filter((e) => {
          const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
          return e.date.startsWith(`${selectedYear}-${monthStr}`);
        });

    filtered.forEach((e) => {
      if (e.type === 'income' && e.amount > 0) {
        const cat = e.category || 'General Income';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
      }
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [yearEntries, selectedYear, selectedMonth, analyticsMode]);

  // Key KPI Metrics
  const kpis = useMemo(() => {
    const filtered = analyticsMode === 'yearly'
      ? yearEntries
      : yearEntries.filter((e) => {
          const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
          return e.date.startsWith(`${selectedYear}-${monthStr}`);
        });

    let totalInc = 0;
    let totalExp = 0;

    filtered.forEach((e) => {
      if (e.type === 'income') totalInc += e.amount || 0;
      if (e.type === 'expense') totalExp += e.amount || 0;
    });

    const net = totalInc - totalExp;
    const savingsRate = totalInc > 0 ? Math.round((net / totalInc) * 100) : 0;

    const daysCount = analyticsMode === 'yearly' ? 365 : new Date(selectedYear, selectedMonth, 0).getDate();
    const avgDailyExpense = Math.round(totalExp / (daysCount || 1));

    // Find highest expense category
    let topExpCat = 'None';
    let topExpAmt = 0;
    expenseCategoryData.forEach((item) => {
      if (item.value > topExpAmt) {
        topExpAmt = item.value;
        topExpCat = item.name;
      }
    });

    return {
      totalInc,
      totalExp,
      net,
      savingsRate,
      avgDailyExpense,
      topExpCat,
    };
  }, [yearEntries, selectedYear, selectedMonth, analyticsMode, expenseCategoryData]);

  const currency = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Analytics Toolbar Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnalyticsMode('yearly')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              analyticsMode === 'yearly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300'
            }`}
          >
            Yearly View ({selectedYear})
          </button>

          <button
            type="button"
            onClick={() => setAnalyticsMode('monthly')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              analyticsMode === 'monthly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300'
            }`}
          >
            Monthly View
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Year Picker */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
          >
            {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>

          {/* Month Picker if monthly mode active */}
          {analyticsMode === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              {[
                { m: 1, name: 'January' },
                { m: 2, name: 'February' },
                { m: 3, name: 'March' },
                { m: 4, name: 'April' },
                { m: 5, name: 'May' },
                { m: 6, name: 'June' },
                { m: 7, name: 'July' },
                { m: 8, name: 'August' },
                { m: 9, name: 'September' },
                { m: 10, name: 'October' },
                { m: 11, name: 'November' },
                { m: 12, name: 'December' },
              ].map((item) => (
                <option key={item.m} value={item.m}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Income KPI */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Total Income</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-tabular">
            {currency} {kpis.totalInc.toLocaleString()}
          </div>
        </div>

        {/* Expense KPI */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Total Expense</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-tabular">
            {currency} {kpis.totalExp.toLocaleString()}
          </div>
        </div>

        {/* Savings Rate KPI */}
        <div className="glass-panel p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" />
            <span>Savings Rate</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-tabular">
            {kpis.savingsRate}%
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Top Expense</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
            {kpis.topExpCat}
          </div>
        </div>
      </div>

      {/* Main Income vs Expense Cashflow Chart */}
      <div className="glass-panel p-5 rounded-2xl space-y-3 border border-white/50 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <span>
              {analyticsMode === 'yearly'
                ? `Income & Expense Stream (${selectedYear})`
                : `Daily Stream (${selectedMonth}/${selectedYear})`}
            </span>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsMode === 'yearly' ? monthlyTrendData : dailyTrendData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey={analyticsMode === 'yearly' ? 'month' : 'day'} stroke="#888888" fontSize={11} />
              <YAxis stroke="#888888" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="Expense"
                stroke="#EF4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Category Pie Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-3 border border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            <PieIcon className="w-5 h-5 text-rose-500" />
            <span>Expense Category Breakdown</span>
          </div>

          {expenseCategoryData.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-gray-400">
              No expense entries recorded for this period.
            </div>
          ) : (
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Income Category Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl space-y-3 border border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <span>Income Sources Breakdown</span>
          </div>

          {incomeCategoryData.length === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-gray-400">
              No income entries recorded for this period.
            </div>
          ) : (
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
