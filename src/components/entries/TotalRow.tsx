import React from 'react';
import { EntryType } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/numberFormat';

interface TotalRowProps {
  type: EntryType;
  totalAmount: number;
}

export const TotalRow: React.FC<TotalRowProps> = ({ type, totalAmount }) => {
  const { userProfile, t } = useApp();

  const isIncome = type === 'income';
  const defaultLabel = isIncome ? t.entries.todaysTotalIncome : t.entries.todaysTotalExpense;
  const label = isIncome
    ? userProfile.customLabels?.totalIncomeLabel || defaultLabel
    : userProfile.customLabels?.totalExpenseLabel || defaultLabel;
  const formattedTotal = formatCurrency(totalAmount, userProfile.language, userProfile.currency);

  return (
    <tr className={`border-t-2 ${isIncome ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'} font-bold`}>
      <td className="py-3 px-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        ∑
      </td>
      <td className="py-3 px-3 text-sm sm:text-base text-gray-900 dark:text-white uppercase tracking-wider font-extrabold">
        {label}
      </td>
      <td className={`py-3 px-3 text-right text-base sm:text-lg font-black font-tabular ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {formattedTotal}
      </td>
    </tr>
  );
};
