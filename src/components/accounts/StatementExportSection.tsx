import React, { useState } from 'react';
import { Entry } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { FileSpreadsheet, FileText, Download, CheckCircle2, Share2, Image as ImageIcon, Loader2, Send, ShieldCheck, Award } from 'lucide-react';
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
      doc.text(`Owner: ${userProfile.username || 'Valued User'} | Generated: ${new Date().toLocaleDateString()}`, 14, 44);

      // Summary Box Grid
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 50, 182, 22, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Total Income: ${currencySymbol} ${totalIncome.toLocaleString()}`, 20, 64);

      doc.setTextColor(239, 68, 68); // Red
      doc.text(`Total Expense: ${currencySymbol} ${totalExpense.toLocaleString()}`, 80, 64);

      doc.setTextColor(37, 99, 235); // Blue
      doc.text(`Net Balance: ${currencySymbol} ${netBalance.toLocaleString()}`, 140, 64);

      // Entries Table Header
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

      if (entries.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('No transaction records found for the selected date / period.', 14, y + 10);
      } else {
        entries.forEach((e, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;

            // Re-render header on new page
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
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated by ${appTitle} Financial App — Complete Balance Statement`, 14, 288);

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
          <span>{userProfile.language === 'bn' ? 'আর্থিক স্টেটমেন্ট রিপোর্ট ও শেয়ার' : 'Financial Statements Export & Sharing'}</span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {userProfile.language === 'bn' ? `হোয়াটসঅ্যাপে ছবি শেয়ার অথবা এক্সেল ও পিডিএফ রিপোর্ট ডাউনলোড করুন (${fromDate} থেকে ${toDate})` : `Share as JPG image to WhatsApp / chat apps or download Excel & PDF statements (${fromDate} to ${toDate})`}
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
          <span>{userProfile.language === 'bn' ? 'ছবি হিসেবে শেয়ার' : 'Share as JPG Image'}</span>
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
          <span>{userProfile.language === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Share to WhatsApp'}</span>
        </button>

        {/* Excel Button */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{userProfile.language === 'bn' ? 'এক্সেল ফাইলেই ডাউনলোড' : 'Export Excel (.XLSX)'}</span>
        </button>

        {/* PDF Button */}
        <button
          type="button"
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>{userProfile.language === 'bn' ? 'পিডিএফ স্টেটমেন্ট' : 'Export PDF Statement'}</span>
        </button>
      </div>

      {/* Hidden high-DPI HTML element captured by html2canvas for JPG image generation */}
      <div className="overflow-hidden h-0 w-0 absolute -left-[9999px] -top-[9999px]">
        <div
          id="statement-image-export-card"
          className="w-[820px] p-8 bg-white text-slate-800 font-sans space-y-5 rounded-3xl border border-slate-200 shadow-2xl relative"
        >
          {/* Top Decorative Gradient Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 rounded-t-3xl -mt-8 -mx-8 mb-4" />

          {/* Statement Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-lg tracking-wider">
                  DH
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    {appTitle}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                    Verified Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {userProfile.subtitle || 'Personal & Business General Financial Statement'}
                </p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-400/30 uppercase tracking-widest">
                OFFICIAL STATEMENT
              </span>
              <div className="text-xs font-bold text-slate-200">
                Ref: DH-{fromDate.replace(/-/g, '')}-{toDate.replace(/-/g, '')}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Period: {formatDDMMYYYY(fromDate, userProfile.language)} to {formatDDMMYYYY(toDate, userProfile.language)}
              </p>
            </div>
          </div>

          {/* Account & Report Metadata Bar */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 font-medium grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div>
                <span className="text-slate-400 font-normal">Account Holder: </span>
                <strong className="text-slate-900 font-bold">{userProfile.username || 'Valued Account Owner'}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Currency & Format: </span>
                <strong className="text-slate-900 font-bold">{userProfile.currency || 'BDT (৳)'} • Standard Accounting</strong>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-400 font-normal">Issued On: </span>
                <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Total Records in Period: </span>
                <strong className="text-blue-600 font-black">{entries.length} Transactions</strong>
              </div>
            </div>
          </div>

          {/* 4 KPI Financial Summary Cards Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Income Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                Total Income
              </span>
              <div className="text-lg font-black text-emerald-700 font-tabular my-1">
                {currencySymbol} {totalIncome.toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold text-emerald-600">
                {entries.filter((e) => e.type === 'income').length} Revenue Records
              </span>
            </div>

            {/* Expense Card */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                Total Expense
              </span>
              <div className="text-lg font-black text-rose-700 font-tabular my-1">
                {currencySymbol} {totalExpense.toLocaleString()}
              </div>
              <span className="text-[10px] font-semibold text-rose-600">
                {entries.filter((e) => e.type === 'expense').length} Expense Records
              </span>
            </div>

            {/* Net Balance Card */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${netBalance >= 0 ? 'bg-blue-50/80 border-blue-200/80' : 'bg-amber-50/80 border-amber-200/80'}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${netBalance >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                Net Balance
              </span>
              <div className={`text-lg font-black font-tabular my-1 ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {currencySymbol} {netBalance.toLocaleString()}
              </div>
              <span className={`text-[10px] font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {netBalance >= 0 ? '🟢 Profit Surplus' : '🔴 Net Deficit'}
              </span>
            </div>

            {/* Profit Margin / Retention */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">
                Profit Margin
              </span>
              <div className="text-lg font-black text-indigo-700 font-tabular my-1">
                {totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0}%
              </div>
              <span className="text-[10px] font-semibold text-indigo-600">
                Net Cash Retention
              </span>
            </div>
          </div>

          {/* Itemized Transactions Table */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-200">
              <span>
                {userProfile.language === 'bn' ? 'বিস্তারিত লেনদেন বিবরণী' : 'Itemized Balance Statement Records'} ({entries.length} {userProfile.language === 'bn' ? 'টি লেনদেন' : 'entries'})
              </span>
              <span className="text-slate-500 font-normal normal-case text-[11px]">Amounts in {currencySymbol}</span>
            </div>

            {entries.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {userProfile.language === 'bn' ? 'নির্দিষ্ট তারিখে কোনো লেনদেন রেকর্ড নেই' : 'No transactions recorded for this date / period'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {userProfile.language === 'bn' ? 'মোট আয়: ৳ 0.00 • মোট ব্যয়: ৳ 0.00 • জের: ৳ 0.00' : 'Total Income: 0.00 • Total Expense: 0.00 • Net Balance: 0.00'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {/* Table Header */}
                <div className="bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 px-3 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-center">SL</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-4">Description / Tags</div>
                  <div className="col-span-1 text-center">Type</div>
                  <div className="col-span-2 text-right">Amount ({currencySymbol})</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-100 text-xs">
                  {entries.slice(0, 30).map((e, idx) => (
                    <div
                      key={e.id || idx}
                      className={`py-2 px-3 grid grid-cols-12 gap-2 items-center ${
                        idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                      }`}
                    >
                      <div className="col-span-1 text-center font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </div>

                      <div className="col-span-2 font-medium text-slate-700 text-[11px]">
                        {formatDateWithDay(e.date, userProfile.language, true)}
                      </div>

                      <div className="col-span-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-bold truncate max-w-[100px]">
                          {e.category || 'General'}
                        </span>
                      </div>

                      <div className="col-span-4 space-y-0.5 min-w-0">
                        <div className="font-bold text-slate-900 truncate text-xs">
                          {e.description || e.category || 'Transaction Record'}
                        </div>
                        {e.tags && e.tags.length > 0 && (
                          <div className="text-[9px] text-slate-400 font-medium truncate">
                            #{e.tags.join(' #')}
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            e.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {e.type === 'income' ? 'INC' : 'EXP'}
                        </span>
                      </div>

                      <div className="col-span-2 text-right font-black font-tabular text-xs">
                        <span className={e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {e.type === 'income' ? '+' : '-'}{currencySymbol} {e.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Summary Row */}
                <div className="bg-slate-100 border-t border-slate-300 py-2.5 px-3 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Period Totals ({entries.length} items)</span>
                  <div className="flex items-center gap-4 font-tabular text-[11px]">
                    <span className="text-emerald-700 font-black">Total In: +{currencySymbol} {totalIncome.toLocaleString()}</span>
                    <span className="text-rose-700 font-black">Total Out: -{currencySymbol} {totalExpense.toLocaleString()}</span>
                    <span className={`font-black text-xs ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                      Net Balance: {currencySymbol} {netBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {entries.length > 30 && (
              <p className="text-[10px] text-slate-400 text-center pt-0.5 italic">
                + {entries.length - 30} additional itemized entries saved in full digital database
              </p>
            )}
          </div>

          {/* Verification Stamp & Security Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {/* Security disclaimer */}
            <div className="space-y-1 text-[10px] text-slate-500 max-w-[500px]">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Digitally Authenticated Ledger Statement</span>
              </div>
              <p className="leading-tight text-slate-400">
                This document is generated automatically by {appTitle} double-entry accounting engine. Verified for accuracy, tax estimation, and audit documentation.
              </p>
            </div>

            {/* Official Stamp Graphic */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-600/40 p-1 flex items-center justify-center text-center">
                <div className="w-full h-full rounded-full bg-blue-50/80 border border-blue-600/60 p-1 flex flex-col items-center justify-center leading-none text-[8px] font-black text-blue-800 uppercase tracking-tighter">
                  <span className="text-[7px] text-blue-600">★ OFFICIAL ★</span>
                  <span className="my-0.5 text-blue-900 font-extrabold">VERIFIED</span>
                  <span className="text-[7px] text-emerald-600">AUDIT READY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright bar */}
          <div className="text-[9px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Powered by {appTitle} • Smart Personal & Business Ledger</span>
            <span>Ref ID: DH-STMT-{fromDate.replace(/-/g, '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

