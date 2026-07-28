import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/numberFormat';

interface SummaryCardProps {
  title: string;
  amount: number;
  count?: number;
  type: 'income' | 'expense' | 'balance';
  icon: React.ReactNode;
  subtitle?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  count,
  type,
  icon,
  subtitle,
}) => {
  const { userProfile } = useApp();

  const formattedAmount = formatCurrency(
    amount,
    userProfile.language,
    userProfile.currency
  );

  const avgValue = typeof count === 'number' && count > 0 ? Math.round(amount / count) : 0;

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
    <div className="glass-card p-4 sm:p-5 flex flex-col justify-between h-[135px] sm:h-[150px] relative overflow-hidden group hover:scale-[1.01] transition-all duration-300 border border-white/50 dark:border-white/10">
      {/* Top Row: Icon & Count */}
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-2xl border ${badgeColor} shadow-sm group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        {typeof count === 'number' && (
          <div className="text-right">
            <span className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full block">
              {count} {userProfile.language === 'bn' ? 'টি হিসাব' : count === 1 ? 'entry' : 'entries'}
            </span>
            {count > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium block mt-0.5">
                {userProfile.language === 'bn' ? 'গড়: ' : 'Avg: '}{formatCurrency(avgValue, userProfile.language, userProfile.currency)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Amount & Title Label */}
      <div className="min-w-0">
        <div className={`text-xl sm:text-2xl font-black font-tabular truncate ${textColor} tracking-tight`}>
          {formattedAmount}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="text-xs font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
            {title}
          </div>
          {subtitle && (
            <span className="text-[10px] font-semibold text-gray-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
