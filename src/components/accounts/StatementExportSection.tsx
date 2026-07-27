import React, { useState } from 'react';
import { Entry } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { FileSpreadsheet, FileText, Download, CheckCircle2, Share2, Image as ImageIcon, Loader2, Send } from 'lucide-react';
import { shareStatementAsImage } from '../../utils/exportService';

interface StatementExportSectionProps {
  fromDate: string;
  toDate: string;
  entries: Entry[];
}

export const StatementExportSection: React.FC<StatementExportSectionProps> = ({
  fromDate,
  toDate,
  entries,
}) => {
  const { userProfile } = useApp();
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [isSharingImage, setIsSharingImage] = useState<boolean>(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState<boolean>(false);

  const currencySymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');
  const appTitle = userProfile.mainTitle || 'DailyHishab';

  // Total calculations
  const totalIncome = entries.reduce((s, e) => (e.type === 'income' ? s + (e.amount || 0) : s), 0);
  const totalExpense = entries.reduce((s, e) => (e.type === 'expense' ? s + (e.amount || 0) : s), 0);
  const netBalance = totalIncome - totalExpense;

  const dateLabel = fromDate === toDate ? `Date: ${formatDateWithDay(fromDate, userProfile.language)}` : `Period: ${formatDDMMYYYY(fromDate, userProfile.language)} to ${formatDDMMYYYY(toDate, userProfile.language)}`;

  // 1. Share / Download as JPG Image
  const handleShareJPG = async (targetApp: 'whatsapp' | 'general' = 'general') => {
    if (targetApp === 'whatsapp') {
      setIsSharingWhatsApp(true);
    } else {
      setIsSharingImage(true);
    }
    setExportMsg('Generating high-res JPG statement image...');

    const filename = `${appTitle}_Statement_${fromDate}_${toDate}`;
    const textSummary = `📊 *${appTitle} Financial Statement*\n${dateLabel}\n\n🟢 *Total Income:* ${currencySymbol} ${totalIncome.toLocaleString()}\n🔴 *Total Expense:* ${currencySymbol} ${totalExpense.toLocaleString()}\n⚖️ *Net Balance:* ${currencySymbol} ${netBalance.toLocaleString()}\n\n_Total Transactions: ${entries.length}_`;

    const res = await shareStatementAsImage({
      elementId: 'statement-image-export-card',
      filename,
      title: `${appTitle} Statement (${dateLabel})`,
      textSummary,
      targetApp,
    });

    setIsSharingImage(false);
    setIsSharingWhatsApp(false);

    if (res.success) {
      if (res.method === 'web-share') {
        setExportMsg('Statement image shared successfully!');
      } else if (res.method === 'whatsapp') {
        setExportMsg('JPG Image downloaded & WhatsApp message opened!');
      } else {
        setExportMsg('JPG Statement image downloaded successfully!');
      }
      setTimeout(() => setExportMsg(null), 4000);
    } else {
      if (res.error !== 'Share cancelled') {
        setExportMsg(`Failed to share image: ${res.error || 'Unknown error'}`);
        setTimeout(() => setExportMsg(null), 4000);
      } else {
        setExportMsg(null);
      }
    }
  };

  // 2. Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const summaryRows = [
        { 'Report Title': appTitle, 'Statement Period': `${formatDDMMYYYY(fromDate, userProfile.language)} to ${formatDDMMYYYY(toDate, userProfile.language)}` },
        { 'Account Owner': userProfile.username || 'User', 'Generated On': new Date().toLocaleString() },
        { 'Total Income': `${currencySymbol} ${totalIncome}`, 'Total Expense': `${currencySymbol} ${totalExpense}`, 'Net Balance': `${currencySymbol} ${netBalance}` },
        {}, // Blank spacer
      ];

      const itemizedRows = entries.map((e, idx) => ({
        'SL No': idx + 1,
        'Date': formatDateWithDay(e.date, userProfile.language, true),
        'Type': e.type.toUpperCase(),
        'Description': e.description || '',
        'Category': e.category || 'General',
        'Tags': e.tags ? e.tags.join(', ') : '',
        'Amount': e.amount,
      }));

      const wb = XLSX.utils.book_new();

      // Create Worksheet combining summary & itemized data
      const ws = XLSX.utils.json_to_sheet([...summaryRows, ...itemizedRows]);

      XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');
      XLSX.writeFile(wb, `${appTitle}_Statement_${fromDate}_to_${toDate}.xlsx`);

      setExportMsg('Excel statement downloaded successfully!');
      setTimeout(() => setExportMsg(null), 3500);
    } catch (err) {
      alert('Failed to generate Excel statement.');
    }
  };

  // 3. Export to PDF (.pdf)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(37, 99, 235); // Blue 600
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(appTitle, 14, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Account & Financial Statement', 130, 18);

      // Statement Metadata Subhead
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Statement Period: ${formatDDMMYYYY(fromDate, userProfile.language)} to ${formatDDMMYYYY(toDate, userProfile.language)}`, 14, 38);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Owner: ${userProfile.username || 'Default User'} | Generated: ${new Date().toLocaleDateString()}`, 14, 44);

      // Summary Box Grid
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 50, 182, 22, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Income: ${currencySymbol} ${totalIncome.toLocaleString()}`, 20, 64);

      doc.setTextColor(239, 68, 68); // Red
      doc.text(`Expense: ${currencySymbol} ${totalExpense.toLocaleString()}`, 80, 64);

      doc.setTextColor(37, 99, 235); // Blue
      doc.text(`Net Balance: ${currencySymbol} ${netBalance.toLocaleString()}`, 140, 64);

      // Entries Table
      let y = 82;
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('SL', 18, y + 5.5);
      doc.text('Date', 30, y + 5.5);
      doc.text('Type', 55, y + 5.5);
      doc.text('Category', 75, y + 5.5);
      doc.text('Description', 115, y + 5.5);
      doc.text('Amount', 178, y + 5.5, { align: 'right' });

      y += 8;

      entries.slice(0, 45).forEach((e, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
        doc.rect(14, y, 182, 7, 'F');

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        doc.text(String(idx + 1), 18, y + 5);
        doc.text(formatDateWithDay(e.date, userProfile.language, true), 30, y + 5);
        doc.text(e.type.toUpperCase(), 55, y + 5);
        doc.text((e.category || 'General').substring(0, 18), 75, y + 5);
        doc.text((e.description || '—').substring(0, 32), 115, y + 5);

        if (e.type === 'income') {
          doc.setTextColor(16, 185, 129);
        } else {
          doc.setTextColor(239, 68, 68);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${currencySymbol} ${e.amount.toLocaleString()}`, 178, y + 5, { align: 'right' });

        y += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by DailyHishab Financial App — Secure Offline & Cloud Ledger', 14, 288);

      doc.save(`${appTitle}_Statement_${fromDate}_to_${toDate}.pdf`);

      setExportMsg('PDF statement downloaded successfully!');
      setTimeout(() => setExportMsg(null), 3500);
    } catch (err) {
      alert('Failed to generate PDF statement.');
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-5 border border-white/50 dark:border-white/10 text-center">
      <div className="flex flex-col items-center space-y-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Download className="w-4 h-4 text-blue-500" />
          <span>Financial Statements Export & Sharing</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Share as JPG image to WhatsApp / chat apps or download Excel & PDF statements ({fromDate} to {toDate})
        </p>
      </div>

      {exportMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportMsg}</span>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {/* Share JPG via Web Share / Apps */}
        <button
          type="button"
          disabled={isSharingImage || isSharingWhatsApp}
          onClick={() => handleShareJPG('general')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSharingImage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          <span>Share as JPG Image</span>
        </button>

        {/* Direct Share on WhatsApp */}
        <button
          type="button"
          disabled={isSharingImage || isSharingWhatsApp}
          onClick={() => handleShareJPG('whatsapp')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSharingWhatsApp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Share to WhatsApp</span>
        </button>

        {/* Excel Button */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel (.XLSX)</span>
        </button>

        {/* PDF Button */}
        <button
          type="button"
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Export PDF Statement</span>
        </button>
      </div>

      {/* Hidden high-DPI HTML element captured by html2canvas for JPG image generation */}
      <div className="overflow-hidden h-0 w-0 absolute -left-[9999px] -top-[9999px]">
        <div
          id="statement-image-export-card"
          className="w-[680px] p-8 bg-white text-gray-900 font-sans space-y-6 rounded-3xl border border-gray-200 shadow-2xl"
        >
          {/* Statement Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  DH
                </div>
                <h1 className="text-2xl font-black text-blue-600 tracking-tight">
                  {appTitle}
                </h1>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {userProfile.subtitle || 'Personal & Business Financial Statement'}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 uppercase tracking-wider">
                STATEMENT OF ACCOUNT
              </span>
              <p className="text-xs text-gray-700 font-bold mt-1.5">
                {dateLabel}
              </p>
            </div>
          </div>

          {/* Account Owner Info */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-600 font-semibold">
            <span>Owner: <strong className="text-gray-900">{userProfile.username || 'Account Holder'}</strong></span>
            <span>Generated: <strong className="text-gray-900">{new Date().toLocaleString()}</strong></span>
          </div>

          {/* 3 Summary KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Income
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {currencySymbol} {totalIncome.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Total Expense
              </span>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                {currencySymbol} {totalExpense.toLocaleString()}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${netBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${netBalance >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                Net Balance
              </span>
              <span className={`text-xl font-black mt-1 block ${netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {currencySymbol} {netBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Itemized Transactions Table Preview (Top 12) */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 border-b border-gray-200 pb-1">
                <span>Transaction Itemization ({entries.length} total)</span>
                <span>Amount ({currencySymbol})</span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {entries.slice(0, 12).map((e, idx) => (
                  <div key={e.id || idx} className="py-2 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{e.description || e.category || 'Entry'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-600">
                          {e.category || 'General'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {formatDateWithDay(e.date, userProfile.language, true)} {e.tags && e.tags.length > 0 ? `• Tags: ${e.tags.join(', ')}` : ''}
                      </p>
                    </div>

                    <span className={`font-extrabold text-sm ${e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {e.type === 'income' ? '+' : '-'}{currencySymbol} {e.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {entries.length > 12 && (
                <p className="text-[10px] text-gray-400 text-center pt-1 italic">
                  + {entries.length - 12} additional entries included in full ledger report
                </p>
              )}
            </div>
          )}

          {/* Footer Branding */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-[10px] text-gray-400 font-medium">
            <span>Generated via DailyHishab — Smart Daily Expense & Ledger Manager</span>
            <span>https://dailyhishab.app</span>
          </div>
        </div>
      </div>
    </div>
  );
};

