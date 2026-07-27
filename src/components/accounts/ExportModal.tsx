import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportElementToImage } from '../../utils/exportService';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import { Download, Share2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/numberFormat';

interface ExportModalProps {
  fromDate: string;
  toDate: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  noteContent: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  fromDate,
  toDate,
  totalIncome,
  totalExpense,
  netBalance,
  noteContent,
}) => {
  const { userProfile, t } = useApp();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExport = async (format: 'jpg' | 'png') => {
    setIsExporting(true);
    setExportMessage(t.accounts.export.downloading);

    const rangeStr = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    const filename = `DailyHishab_${rangeStr}_${Date.now()}`;

    const success = await exportElementToImage({
      elementId: 'accounts-export-card',
      filename,
      format,
    });

    setIsExporting(false);
    if (success) {
      setExportMessage(t.accounts.export.success);
      setTimeout(() => setExportMessage(null), 3000);
    } else {
      setExportMessage(t.accounts.export.error);
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  const formattedIncome = formatCurrency(totalIncome, userProfile.language, userProfile.currency);
  const formattedExpense = formatCurrency(totalExpense, userProfile.language, userProfile.currency);
  const formattedBalance = formatCurrency(netBalance, userProfile.language, userProfile.currency);

  const dateRangeLabel = fromDate === toDate ? `Date: ${formatDateWithDay(fromDate, userProfile.language)}` : `Period: ${formatDDMMYYYY(fromDate, userProfile.language)} - ${formatDDMMYYYY(toDate, userProfile.language)}`;

  return (
    <div className="space-y-4">
      {/* Export Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          disabled={isExporting}
          onClick={() => handleExport('jpg')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{t.accounts.export.buttonJpg}</span>
        </button>

        <button
          disabled={isExporting}
          onClick={() => handleExport('png')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span>{t.accounts.export.buttonPng}</span>
        </button>
      </div>

      {exportMessage && (
        <div className="text-center text-xs font-semibold text-blue-600 dark:text-blue-400 animate-fade-in">
          {exportMessage}
        </div>
      )}

      {/* Hidden Export Template Target for html2canvas */}
      <div className="overflow-hidden h-0 w-0 absolute -left-[9999px] -top-[9999px]">
        <div
          id="accounts-export-card"
          className="w-[600px] p-8 bg-white text-gray-900 font-sans space-y-6 rounded-3xl border border-gray-200 shadow-2xl"
        >
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-2xl font-black text-blue-600 tracking-tight">
                {userProfile.mainTitle || 'DailyHishab'}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {userProfile.subtitle || 'Personal & Business Ledger'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                FINANCIAL REPORT
              </span>
              <p className="text-[11px] text-gray-400 mt-1 font-semibold">
                {dateRangeLabel}
              </p>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                {t.accounts.summaryCards.totalIncome}
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {formattedIncome}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                {t.accounts.summaryCards.totalExpense}
              </span>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                {formattedExpense}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${netBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {t.accounts.summaryCards.netBalance}
              </span>
              <span className={`text-xl font-black mt-1 block ${netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {formattedBalance}
              </span>
            </div>
          </div>

          {/* Notes Section if available */}
          {noteContent && noteContent.trim() !== '' && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">
                {t.accounts.notes.title}
              </span>
              <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                {noteContent}
              </p>
            </div>
          )}

          {/* Footer Timestamp */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-[10px] text-gray-400 font-medium">
            <span>Generated via DailyHishab PWA</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
