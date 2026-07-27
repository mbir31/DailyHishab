import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Entry, EntryType } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { EntryRow } from './EntryRow';
import { TotalRow } from './TotalRow';
import { Plus, Check, RefreshCw } from 'lucide-react';

interface EntryTableProps {
  type: EntryType;
}

export const EntryTable: React.FC<EntryTableProps> = ({ type }) => {
  const {
    selectedDate,
    currentIncomeEntries,
    currentExpenseEntries,
    saveCurrentDateEntries,
    userProfile,
    t,
  } = useApp();

  const initialEntries = type === 'income' ? currentIncomeEntries : currentExpenseEntries;

  // Local state for table rows to enable smooth debounced typing
  const [rows, setRows] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState<boolean>(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to construct empty row
  const createEmptyRow = (serialNum: number): Entry => ({
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    date: selectedDate,
    serial: serialNum,
    description: '',
    amount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Synchronize local rows with context entries when date or type changes
  useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      setRows(initialEntries);
    } else {
      // Default 5 empty rows
      const empty5: Entry[] = [];
      for (let i = 1; i <= 5; i++) {
        empty5.push(createEmptyRow(i));
      }
      setRows(empty5);
    }
  }, [selectedDate, type, initialEntries.length]);

  // Debounced auto-save function
  const triggerAutoSave = useCallback((updatedRows: Entry[]) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentDateEntries(type, updatedRows);
      setIsSaving(false);
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
    }, 500);
  }, [type, saveCurrentDateEntries]);

  // Update single row
  const handleUpdateRow = (index: number, updatedFields: Partial<Entry>) => {
    const nextRows = [...rows];
    nextRows[index] = { ...nextRows[index], ...updatedFields };
    setRows(nextRows);
    triggerAutoSave(nextRows);
  };

  // Delete single row with auto serial renumbering
  const handleDeleteRow = (indexToDelete: number) => {
    let nextRows = rows.filter((_, idx) => idx !== indexToDelete);
    // Ensure at least 1 empty row remains
    if (nextRows.length === 0) {
      nextRows = [createEmptyRow(1)];
    } else {
      // Renumber serials
      nextRows = nextRows.map((r, i) => ({ ...r, serial: i + 1 }));
    }
    setRows(nextRows);
    triggerAutoSave(nextRows);
  };

  // Add new row below
  const handleAddRow = () => {
    const nextSerial = rows.length + 1;
    const newRow = createEmptyRow(nextSerial);
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    triggerAutoSave(nextRows);
  };

  // Calculate total ignoring zero amount / empty rows
  const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 animate-fade-in">
      {/* Header Bar with Auto-Save Status */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {type === 'income' ? t.entries.typeIncome : t.entries.typeExpense}
          </h2>
        </div>

        {/* Saving Status Badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {isSaving ? (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : showSavedIndicator ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>{t.entries.saved}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Main Glassmorphic Table Container */}
      <div className="glass-panel overflow-hidden shadow-xl border border-white/50 dark:border-white/10 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-gray-200/60 dark:border-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2 sm:px-3 text-center w-12 sm:w-16">
                  {userProfile.customLabels?.slNoColumnHeader || t.entries.slNo}
                </th>
                <th className="py-3 px-2 sm:px-3">
                  {type === 'income'
                    ? userProfile.customLabels?.incomeColumnHeader || 'Customer / Description'
                    : userProfile.customLabels?.expenseColumnHeader || 'Expense Description'}
                </th>
                <th className="py-3 px-2 sm:px-3 text-right w-28 sm:w-40">
                  {userProfile.customLabels?.amountColumnHeader || t.entries.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <EntryRow
                  key={row.id}
                  entry={row}
                  type={type}
                  index={idx}
                  onUpdate={handleUpdateRow}
                  onDelete={handleDeleteRow}
                />
              ))}

              {/* Total Calculation Row */}
              <TotalRow type={type} totalAmount={totalAmount} />
            </tbody>
          </table>
        </div>

        {/* Add Row Button at bottom of table */}
        <div className="p-3 bg-black/5 dark:bg-white/5 border-t border-gray-200/50 dark:border-gray-800 flex justify-center">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{userProfile.customLabels?.addRowBtn || t.entries.addRow}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
