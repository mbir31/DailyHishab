import React, { useState, useEffect } from 'react';
import { ListFilter, Plus, X, Trash2 } from 'lucide-react';
import {
  getCustomCategories,
  addCustomCategory,
  removeCustomCategory,
} from '../../utils/categories';

export const CustomDropdownSection: React.FC = () => {
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  const [newIncomeInput, setNewIncomeInput] = useState<string>('');
  const [newExpenseInput, setNewExpenseInput] = useState<string>('');

  useEffect(() => {
    refreshCategories();
  }, []);

  const refreshCategories = () => {
    setIncomeCategories(getCustomCategories('income'));
    setExpenseCategories(getCustomCategories('expense'));
  };

  const handleAddIncome = () => {
    if (!newIncomeInput.trim()) return;
    addCustomCategory('income', newIncomeInput.trim());
    setNewIncomeInput('');
    refreshCategories();
  };

  const handleRemoveIncome = (cat: string) => {
    removeCustomCategory('income', cat);
    refreshCategories();
  };

  const handleAddExpense = () => {
    if (!newExpenseInput.trim()) return;
    addCustomCategory('expense', newExpenseInput.trim());
    setNewExpenseInput('');
    refreshCategories();
  };

  const handleRemoveExpense = (cat: string) => {
    removeCustomCategory('expense', cat);
    refreshCategories();
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
        <ListFilter className="w-5 h-5 text-indigo-500" />
        <span>Custom Dropdown Options Manager</span>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
        Add or remove custom options for Income and Expense dropdown selectors.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Dropdown Options Box */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Income Options ({incomeCategories.length})
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newIncomeInput}
              onChange={(e) => setNewIncomeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
              placeholder="e.g. Store Sales, Commission..."
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-emerald-300 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleAddIncome}
              disabled={!newIncomeInput.trim()}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {incomeCategories.length === 0 ? (
              <span className="text-xs text-gray-400 italic">No custom income options added yet.</span>
            ) : (
              incomeCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-emerald-300 dark:border-emerald-800 shadow-2xs"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIncome(cat)}
                    className="p-0.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all cursor-pointer"
                    title={`Remove ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Expense Dropdown Options Box */}
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Expense Options ({expenseCategories.length})
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newExpenseInput}
              onChange={(e) => setNewExpenseInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
              placeholder="e.g. Shop Rent, Raw Materials..."
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-rose-300 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleAddExpense}
              disabled={!newExpenseInput.trim()}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {expenseCategories.length === 0 ? (
              <span className="text-xs text-gray-400 italic">No custom expense options added yet.</span>
            ) : (
              expenseCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-rose-300 dark:border-rose-800 shadow-2xs"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(cat)}
                    className="p-0.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all cursor-pointer"
                    title={`Remove ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
