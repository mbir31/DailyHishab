import React, { useState } from 'react';
import { TimeFilterType } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { Calendar } from 'lucide-react';

interface TimeFilterProps {
  activeFilter: TimeFilterType;
  onFilterChange: (filter: TimeFilterType) => void;
  customFrom: string;
  customTo: string;
  onCustomRangeChange: (from: string, to: string) => void;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({
  activeFilter,
  onFilterChange,
  customFrom,
  customTo,
  onCustomRangeChange,
}) => {
  const { t } = useApp();

  const filters: { id: TimeFilterType; label: string }[] = [
    { id: 'day', label: t.accounts.timeFilters.day },
    { id: 'week', label: t.accounts.timeFilters.week },
    { id: 'month', label: t.accounts.timeFilters.month },
    { id: 'year', label: t.accounts.timeFilters.year },
    { id: 'custom', label: t.accounts.timeFilters.custom },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Scrollable Filter Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full justify-start sm:justify-center">
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Picker when Custom filter is active */}
      {activeFilter === 'custom' && (
        <div className="glass-card p-3 sm:p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in max-w-md mx-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomRangeChange(e.target.value, customTo)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomRangeChange(customFrom, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
