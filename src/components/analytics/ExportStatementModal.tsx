import React, { useState } from 'react';
import { Entry } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Printer, Download, X, CheckCircle2 } from 'lucide-react';

interface ExportStatementModalProps {
  entries: Entry[];
  fromDate: string;
  toDate: string;
  onClose: () => void;
}

export const ExportStatementModal: React.FC<ExportStatementModalProps> = ({
  entries,
  fromDate,
  toDate,
  onClose,
}) => {
  const { userProfile, t } = useApp();
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const currency = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  // Filter out blank / unfilled entries
  const validEntries = entries.filter((e) => {
    const hasAmount = typeof e.amount === 'number' && e.amount > 0;
    const hasDesc = typeof e.description === 'string' && e.description.trim().length > 0;
    return hasAmount || hasDesc;
  });

  // Compute total summary
  const totalIncome = validEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpense = validEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // 1. Export to Excel (.XLSX)
  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Financial Summary Sheet
      const summaryData = [
        ['DAILYHISHAB FINANCIAL STATEMENT REPORT'],
        ['Account Owner:', userProfile.username || 'User'],
        ['Business Title:', userProfile.mainTitle || 'DailyHishab'],
        ['Period:', `${formatDDMMYYYY(fromDate, userProfile.language)} to ${formatDDMMYYYY(toDate, userProfile.language)}`],
        ['Generated Date:', new Date().toLocaleString()],
        [],
        ['SUMMARY METRICS', 'AMOUNT'],
        ['Total Income (+)', totalIncome],
        ['Total Expense (-)', totalExpense],
        ['Net Balance (=)', netBalance],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Detailed Ledger Transactions Sheet
      const ledgerRows = validEntries.map((e) => ({
        Date: formatDateWithDay(e.date, userProfile.language, true),
        Serial: e.serial,
        Type: e.type.toUpperCase(),
        Category: e.category || 'General',
        Tags: e.tags ? e.tags.join(', ') : '',
        Description: e.description,
        'Amount': e.amount,
      }));

      const ledgerSheet = XLSX.utils.json_to_sheet(ledgerRows);
      XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Ledger Entries');

      // Write file
      const fileName = `DailyHishab_Statement_${fromDate}_to_${toDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportSuccessMsg('Excel statement exported successfully!');
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err) {
      alert('Failed to export Excel statement.');
    }
  };

  // 2. Trigger Print / PDF Printable Statement
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl rounded-3xl space-y-5 border border-white/20 dark:border-white/10 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Financial Statement Exporter
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Period: {formatDDMMYYYY(fromDate, userProfile.language)} to {formatDDMMYYYY(toDate, userProfile.language)} ({validEntries.length} records)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {exportSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Statement Preview Card */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-3 print:p-0 print:border-none print:shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                {userProfile.mainTitle || 'DailyHishab'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Official Financial Statement • {userProfile.username}
              </p>
            </div>
            <div className="text-right text-xs font-bold text-gray-500">
              <div>{fromDate} ~ {toDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2 bg-black/5 dark:bg-white/5 rounded-xl">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500">Income</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {currency} {totalIncome.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500">Expense</div>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                {currency} {totalExpense.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500">Net Balance</div>
              <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                {currency} {netBalance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 print:hidden">
          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.XLSX)</span>
          </button>

          {/* Printable Statement PDF */}
          <button
            type="button"
            onClick={handlePrintStatement}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
