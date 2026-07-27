import React, { useState, useMemo } from 'react';
import { Entry, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Calendar, Wallet, AreaChart as AreaChartIcon } from 'lucide-react';

interface AnalyticsDashboardProps {
  entries: Entry[];
}

const CATEGORY_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#64748B', '#D97706', '#059669',
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ entries }) => {
  const { userProfile } = useApp();
  const [analyticsView, setAnalyticsView] = useState<'monthly' | 'cumulative' | 'categories'>('monthly');

  const currencySymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  // 1. Monthly Breakdown Data (January to December)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthMap: Record<number, { month: string; income: number; expense: number; net: number; cumulative: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthMap[i] = { month: months[i], income: 0, expense: 0, net: 0, cumulative: 0 };
    }

    entries.forEach((e) => {
      if (!e.date) return;
      const parts = e.date.split('-');
      if (parts.length < 3) return;
      const yr = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-based month index
      if (yr === currentYear && m >= 0 && m < 12) {
        if (e.type === 'income') {
          monthMap[m].income += e.amount || 0;
        } else {
          monthMap[m].expense += e.amount || 0;
        }
        monthMap[m].net = monthMap[m].income - monthMap[m].expense;
      }
    });

    let runningTotal = 0;
    for (let i = 0; i < 12; i++) {
      runningTotal += monthMap[i].net;
      monthMap[i].cumulative = runningTotal;
    }

    return Object.values(monthMap);
  }, [entries]);

  // 2. Expense Category Breakdown
  const expenseCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};

    entries.forEach((e) => {
      if (e.type === 'expense' && e.amount > 0) {
        const cat = e.category || 'General Expense';
        catMap[cat] = (catMap[cat] || 0) + e.amount;
      }
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // 3. Income Category Breakdown
  const incomeCategoryData = useMemo(() => {
    const catMap: Record<string, number> = {};

    entries.forEach((e) => {
      if (e.type === 'income' && e.amount > 0) {
        const cat = e.category || 'General Income';
        catMap[cat] = (catMap[cat] || 0) + e.amount;
      }
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Totals
  const totalIncome = entries.reduce((s, e) => (e.type === 'income' ? s + (e.amount || 0) : s), 0);
  const totalExpense = entries.reduce((s, e) => (e.type === 'expense' ? s + (e.amount || 0) : s), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Header & Sub-Nav Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Financial Analytics & Trends
            </h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Interactive monthly & yearly insights with category breakdown
            </p>
          </div>
        </div>

        {/* Analytics Mode Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAnalyticsView('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              analyticsView === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly Cash Flow
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsView('cumulative')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              analyticsView === 'cumulative'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cumulative Net Trajectory
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsView('categories')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              analyticsView === 'categories'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Highlights Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            Total Revenue
          </span>
          <span className="text-sm sm:text-lg font-black text-emerald-700 dark:text-emerald-300 font-tabular">
            {currencySymbol} {totalIncome.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <span className="block text-[11px] font-bold text-rose-600 dark:text-rose-400">
            Total Expenses
          </span>
          <span className="text-sm sm:text-lg font-black text-rose-700 dark:text-rose-300 font-tabular">
            {currencySymbol} {totalExpense.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="block text-[11px] font-bold text-blue-600 dark:text-blue-400">
            Net Savings
          </span>
          <span className="text-sm sm:text-lg font-black text-blue-700 dark:text-blue-300 font-tabular">
            {currencySymbol} {netSavings.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <span className="block text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Savings Rate
          </span>
          <span className="text-sm sm:text-lg font-black text-purple-700 dark:text-purple-300 font-tabular">
            {savingsRate}%
          </span>
        </div>
      </div>

      {/* View 1: Monthly Comparison Bar Chart */}
      {analyticsView === 'monthly' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Monthly Cash In vs Cash Out ({new Date().getFullYear()})
          </h3>
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${currencySymbol} ${Number(val).toLocaleString()}`]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View 2: Cumulative Cash Trajectory Area Chart */}
      {analyticsView === 'cumulative' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Cumulative Net Balance Trajectory ({new Date().getFullYear()})
          </h3>
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${currencySymbol} ${Number(val).toLocaleString()}`, 'Cumulative Balance']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View 2: Category Distribution Charts */}
      {analyticsView === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Expense Category Donut */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
            <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              <span>Expense Categories</span>
            </h4>

            {expenseCategoryData.length > 0 ? (
              <div className="w-full h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-exp-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${currencySymbol} ${Number(val).toLocaleString()}`]}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400">No expense records found</div>
            )}

            {/* Top Categories List */}
            <div className="space-y-1.5 pt-1">
              {expenseCategoryData.slice(0, 4).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-gray-800 dark:text-gray-200">{cat.name}</span>
                  </div>
                  <span className="font-tabular font-bold text-gray-900 dark:text-white">
                    {currencySymbol} {cat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Income Category Donut */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Income Sources</span>
            </h4>

            {incomeCategoryData.length > 0 ? (
              <div className="w-full h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {incomeCategoryData.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${currencySymbol} ${Number(val).toLocaleString()}`]}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400">No income records found</div>
            )}

            {/* Top Categories List */}
            <div className="space-y-1.5 pt-1">
              {incomeCategoryData.slice(0, 4).map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-gray-800 dark:text-gray-200">{cat.name}</span>
                  </div>
                  <span className="font-tabular font-bold text-gray-900 dark:text-white">
                    {currencySymbol} {cat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
