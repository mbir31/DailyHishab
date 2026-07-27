import React from 'react';
import { useApp } from '../../context/AppContext';
import { LayoutList, TableProperties, RotateCcw } from 'lucide-react';
import { CustomNavLabels } from '../../types/user.types';

export const NavLabelsSection: React.FC = () => {
  const { userProfile, updateUserProfile, t } = useApp();

  const handleLabelChange = (field: keyof CustomNavLabels, value: string) => {
    updateUserProfile({
      customLabels: {
        ...userProfile.customLabels,
        [field]: value,
      },
    });
  };

  const handleResetDefaults = () => {
    updateUserProfile({
      customLabels: {
        entryPlus: '',
        entryMinus: '',
        accounts: '',
        settings: '',
        incomeColumnHeader: '',
        expenseColumnHeader: '',
        amountColumnHeader: '',
        slNoColumnHeader: '',
        descriptionPlaceholder: '',
        addRowBtn: '',
        totalIncomeLabel: '',
        totalExpenseLabel: '',
      },
    });
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Header & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <LayoutList className="w-5 h-5" />
          </div>
          <span>{t.settings.labels.title}</span>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold transition-all active:scale-95"
          title="Reset all custom labels to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Part 1: Bottom Navigation Bar Tab Labels */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Navigation Bar Labels
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.entryPlusLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.entryPlus || ''}
              onChange={(e) => handleLabelChange('entryPlus', e.target.value)}
              placeholder={t.nav.entryPlus}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.entryMinusLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.entryMinus || ''}
              onChange={(e) => handleLabelChange('entryMinus', e.target.value)}
              placeholder={t.nav.entryMinus}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.accountsLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.accounts || ''}
              onChange={(e) => handleLabelChange('accounts', e.target.value)}
              placeholder={t.nav.accounts}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.settingsLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.settings || ''}
              onChange={(e) => handleLabelChange('settings', e.target.value)}
              placeholder={t.nav.settings}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Entry Table Column Headers & Form Field Customization */}
      <div className="space-y-3 pt-3 border-t border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {t.settings.labels.tableHeaderTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Income Column Header */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.incomeColumnHeader}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.incomeColumnHeader || ''}
              onChange={(e) => handleLabelChange('incomeColumnHeader', e.target.value)}
              placeholder="Customer / Description"
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expense Column Header */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.expenseColumnHeader}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.expenseColumnHeader || ''}
              onChange={(e) => handleLabelChange('expenseColumnHeader', e.target.value)}
              placeholder="Expense Description"
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Serial No Column Header */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.slNoColumnHeader}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.slNoColumnHeader || ''}
              onChange={(e) => handleLabelChange('slNoColumnHeader', e.target.value)}
              placeholder={t.entries.slNo}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount Column Header */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.amountColumnHeader}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.amountColumnHeader || ''}
              onChange={(e) => handleLabelChange('amountColumnHeader', e.target.value)}
              placeholder={t.entries.amount}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description Field Placeholder */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.descriptionPlaceholder}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.descriptionPlaceholder || ''}
              onChange={(e) => handleLabelChange('descriptionPlaceholder', e.target.value)}
              placeholder={t.entries.descriptionPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Row Button Text */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.addRowBtn}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.addRowBtn || ''}
              onChange={(e) => handleLabelChange('addRowBtn', e.target.value)}
              placeholder={t.entries.addRow}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Total Income Label */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.totalIncomeLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.totalIncomeLabel || ''}
              onChange={(e) => handleLabelChange('totalIncomeLabel', e.target.value)}
              placeholder={t.entries.todaysTotalIncome}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Total Expense Label */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t.settings.labels.totalExpenseLabel}
            </label>
            <input
              type="text"
              value={userProfile.customLabels?.totalExpenseLabel || ''}
              onChange={(e) => handleLabelChange('totalExpenseLabel', e.target.value)}
              placeholder={t.entries.todaysTotalExpense}
              className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
