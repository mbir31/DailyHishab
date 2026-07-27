import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/numberFormat';

interface SummaryCardProps {
  title: string;
  amount: number;
  count?: number;
  type: 'income' | 'expense' | 'balance';
  icon: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  count,
  type,
  icon,
}) => {
  const { userProfile } = useApp();

  const formattedAmount = formatCurrency(
    amount,
    userProfile.language,
    userProfile.currency
  );

  let badgeColor = '';
  let textColor = '';

  if (type === 'income') {
    badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    textColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (type === 'expense') {
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    textColor = 'text-rose-600 dark:text-rose-400';
  } else {
    // Net Balance
    if (amount >= 0) {
      badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      textColor = 'text-blue-600 dark:text-blue-400';
    } else {
      badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      textColor = 'text-amber-600 dark:text-amber-400';
    }
  }

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col justify-between h-[130px] sm:h-[140px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      {/* Top Row: Icon & Count */}
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-2xl border ${badgeColor} shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {typeof count === 'number' && (
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {/* Bottom Row: Amount & Title Label */}
      <div className="min-w-0">
        <div className={`text-xl sm:text-2xl font-black font-tabular truncate ${textColor} tracking-tight`}>
          {formattedAmount}
        </div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
          {title}
        </div>
      </div>
    </div>
  );
};
