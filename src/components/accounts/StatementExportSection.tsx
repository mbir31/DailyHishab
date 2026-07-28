import React, { useState } from 'react';
import { Entry } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileSpreadsheet, FileText, CheckCircle2, Share2, Loader2, Send, ShieldCheck, Download, Award, Stamp } from 'lucide-react';
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
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Digital Seal & Watermark customization state
  const [enableStamp, setEnableStamp] = useState<boolean>(true);
  const [stampText, setStampText] = useState<string>(
    userProfile.language === 'bn' ? 'যাচাইকৃত ও অনুমোদিত' : 'PAID & VERIFIED'
  );
  const [stampStyle, setStampStyle] = useState<'circular' | 'rectangular' | 'badge'>('circular');
  const [stampColor, setStampColor] = useState<'bluish-purple' | 'classic-red' | 'emerald-green' | 'dark-navy'>('bluish-purple');
  const [enableBackgroundWatermark, setEnableBackgroundWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>(
    userProfile.language === 'bn' ? 'অফিসিয়াল নথি' : 'OFFICIAL STATEMENT'
  );

  const currencySymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');
  const appTitle = userProfile.mainTitle || 'DailyHishab';

  // Ink hex color mapper for realistic rubber stamp simulation
  const inkHexColor =
    stampColor === 'classic-red'
      ? '#c62828'
      : stampColor === 'emerald-green'
      ? '#2e7d32'
      : stampColor === 'dark-navy'
      ? '#0f172a'
      : '#283593'; // Classic bluish-purple rubber stamp ink

  // Filter out blank / unfilled entries (entries with 0 or empty amount AND blank description)
  const validEntries = entries.filter((e) => {
    const hasAmount = typeof e.amount === 'number' && e.amount > 0;
    const hasDesc = typeof e.description === 'string' && e.description.trim().length > 0;
    return hasAmount || hasDesc;
  });

  // Total calculations based on valid entries
  const totalIncome = validEntries.reduce((s, e) => (e.type === 'income' ? s + (e.amount || 0) : s), 0);
  const totalExpense = validEntries.reduce((s, e) => (e.type === 'expense' ? s + (e.amount || 0) : s), 0);
  const netBalance = totalIncome - totalExpense;

  const dateLabel = fromDate === toDate ? `Date: ${formatDateWithDay(fromDate, userProfile.language)}` : `Period: ${formatDDMMYYYY(fromDate, userProfile.language)} to ${formatDDMMYYYY(toDate, userProfile.language)}`;

  // 1. Share / Download as JPG Image
  const handleShareJPG = async (targetApp: 'whatsapp' | 'general' = 'general') => {
    if (targetApp === 'whatsapp') {
      setIsSharingWhatsApp(true);
    } else {
      setIsSharingImage(true);
    }
    setExportMsg(userProfile.language === 'bn' ? 'এইচডি জেপিজি ছবি স্টেটমেন্ট তৈরি হচ্ছে...' : 'Generating high-res JPG statement image...');

    const filename = `${appTitle}_Statement_${fromDate}_${toDate}`;
    const textSummary = `📊 *${appTitle} Financial Statement*\n${dateLabel}\n\n🟢 *Total Income:* ${currencySymbol} ${totalIncome.toLocaleString()}\n🔴 *Total Expense:* ${currencySymbol} ${totalExpense.toLocaleString()}\n⚖️ *Net Balance:* ${currencySymbol} ${netBalance.toLocaleString()}\n\n_Total Transactions: ${validEntries.length}_`;

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
        setExportMsg(userProfile.language === 'bn' ? 'স্টেটমেন্টের ছবি সফলভাবে শেয়ার হয়েছে!' : 'Statement image shared successfully!');
      } else if (res.method === 'whatsapp') {
        setExportMsg(userProfile.language === 'bn' ? 'জেপিজি ছবি ডাউনলোড হয়েছে ও হোয়াটসঅ্যাপ খোলা হয়েছে!' : 'JPG Image downloaded & WhatsApp opened!');
      } else {
        setExportMsg(userProfile.language === 'bn' ? 'জেপিজি ছবি সফলভাবে ডাউনলোড হয়েছে!' : 'JPG Statement image downloaded successfully!');
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

      const itemizedRows = validEntries.map((e, idx) => ({
        'SL No': idx + 1,
        'Date': formatDateWithDay(e.date, userProfile.language, true),
        'Type': e.type.toUpperCase(),
        'Description': e.description || '',
        'Category': e.category || 'General',
        'Amount': e.amount || 0,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([...summaryRows, ...itemizedRows]);

      XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');
      XLSX.writeFile(wb, `${appTitle}_Statement_${fromDate}_to_${toDate}.xlsx`);

      setExportMsg(userProfile.language === 'bn' ? 'এক্সেল ফাইলেই স্টেটমেন্ট ডাউনলোড হয়েছে!' : 'Excel statement downloaded successfully!');
      setTimeout(() => setExportMsg(null), 3500);
    } catch (err) {
      alert('Failed to generate Excel statement.');
    }
  };

  // 3. Export to PDF (.pdf) with full Bangla font & high DPI canvas rendering support
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setExportMsg(userProfile.language === 'bn' ? 'বাংলা ফ্রন্টসহ পিডিএফ স্টেটমেন্ট ফাইল তৈরি করা হচ্ছে...' : 'Generating PDF statement with Bangla font support...');

    try {
      const element = document.getElementById('statement-image-export-card');
      if (!element) {
        alert('Statement template not found');
        setIsExportingPDF(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2, // 2x High-DPI crisp rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / pdfWidth;
      const scaledHeight = imgHeight / ratio;

      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
      } else {
        let heightLeft = scaledHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(`${appTitle}_Statement_${fromDate}_to_${toDate}.pdf`);

      setExportMsg(userProfile.language === 'bn' ? 'বাংলা ফন্টসহ পিডিএফ স্টেটমেন্ট সফলভাবে ডাউনলোড হয়েছে!' : 'PDF statement with Bangla fonts downloaded successfully!');
      setTimeout(() => setExportMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to generate PDF statement:', err);
      alert('Failed to generate PDF statement: ' + (err.message || 'Error rendering canvas'));
    } finally {
      setIsExportingPDF(false);
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
          {userProfile.language === 'bn' ? `হোয়াটসঅ্যাপে ছবি শেয়ার অথবা এক্সেল ও বাংলা ফন্টসহ পিডিএফ রিপোর্ট ডাউনলোড করুন (${fromDate} থেকে ${toDate})` : `Share as JPG image to WhatsApp / chat apps or download Excel & Bangla PDF statements (${fromDate} to ${toDate})`}
        </p>
      </div>

      {exportMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportMsg}</span>
        </div>
      )}

      {/* Custom Watermark & Digital Stamp Customization Panel */}
      <div className="bg-slate-50 dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3.5 text-left transition-all">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              {userProfile.language === 'bn' ? 'ডিজিটাল সিল ও ওয়াটারমার্ক সেটিংস' : 'Digital Seal & Watermark Options'}
            </span>
          </div>

          {/* Toggle Button */}
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableStamp}
              onChange={(e) => setEnableStamp(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {enableStamp ? (userProfile.language === 'bn' ? 'সিল সক্রিয়' : 'Seal Enabled') : (userProfile.language === 'bn' ? 'সিল বন্ধ' : 'Seal Disabled')}
            </span>
          </label>
        </div>

        {enableStamp && (
          <div className="space-y-3 pt-1 border-t border-gray-200 dark:border-gray-700 animate-fade-in text-xs">
            {/* Input Field & Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                {userProfile.language === 'bn' ? 'সিল / স্ট্যাম্পের লেখা (কাস্টমাইজ করুন):' : 'Custom Stamp / Seal Text:'}
              </label>
              <input
                type="text"
                value={stampText}
                onChange={(e) => setStampText(e.target.value)}
                placeholder="e.g. PAID & VERIFIED"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-medium">{userProfile.language === 'bn' ? 'দ্রুত বাছাই:' : 'Presets:'}</span>
                {(userProfile.language === 'bn'
                  ? ['যাচাইকৃত ও অনুমোদিত', 'পরিশোধিত (PAID)', 'অফিসিয়াল সিল', 'অডিট সম্পন্ন', 'গোপনীয় তথ্য']
                  : ['PAID & VERIFIED', 'APPROVED & SIGNED', 'OFFICIAL SEAL', 'AUDITED & RECORDED', 'CONFIDENTIAL']
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStampText(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      stampText === preset
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Design & Color Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Stamp Design Style */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  {userProfile.language === 'bn' ? 'স্ট্যাম্প আকার / শেপ:' : 'Stamp Shape & Design:'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'circular', label: userProfile.language === 'bn' ? 'গোল সিল' : 'Circular' },
                    { id: 'rectangular', label: userProfile.language === 'bn' ? 'চৌকো বক্স' : 'Rectangular' },
                    { id: 'badge', label: userProfile.language === 'bn' ? 'সিগনেচার ব্যাজ' : 'Signature Seal' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStampStyle(st.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                        stampStyle === st.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink Color Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  {userProfile.language === 'bn' ? 'সিলের কালি (ইঙ্ক কালার):' : 'Stamp Ink Color:'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'bluish-purple', label: 'Indigo Ink', colorBg: 'bg-[#283593]' },
                    { id: 'classic-red', label: 'Red Ink', colorBg: 'bg-[#c62828]' },
                    { id: 'emerald-green', label: 'Green Ink', colorBg: 'bg-[#2e7d32]' },
                    { id: 'dark-navy', label: 'Navy Ink', colorBg: 'bg-[#0f172a]' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStampColor(c.id as any)}
                      className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        stampColor === c.id
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.colorBg}`} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Diagonal Watermark Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBackgroundWatermark}
                  onChange={(e) => setEnableBackgroundWatermark(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {userProfile.language === 'bn' ? 'ব্যাকগ্রাউন্ড ডায়াগনাল ওয়াটারমার্ক যুক্ত করুন' : 'Add Diagonal Background Watermark'}
                </span>
              </label>

              {enableBackgroundWatermark && (
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Watermark Text"
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-bold outline-none"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        {/* Share JPG via Web Share / Apps */}
        <button
          type="button"
          disabled={isSharingImage || isSharingWhatsApp || isExportingPDF}
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
          disabled={isSharingImage || isSharingWhatsApp || isExportingPDF}
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
          disabled={isExportingPDF}
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{userProfile.language === 'bn' ? 'এক্সেল ফাইল ডাউনলোড' : 'Export Excel (.XLSX)'}</span>
        </button>

        {/* PDF Button */}
        <button
          type="button"
          disabled={isSharingImage || isSharingWhatsApp || isExportingPDF}
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isExportingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>{userProfile.language === 'bn' ? 'বাংলা পিডিএফ স্টেটমেন্ট' : 'Export PDF Statement'}</span>
        </button>
      </div>

      {/* Offscreen high-DPI HTML element captured by html2canvas for JPG & PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0px', width: '820px', pointerEvents: 'none' }}>
        <div
          id="statement-image-export-card"
          className="w-[820px] p-8 bg-white text-slate-800 font-sans space-y-5 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden"
        >
          {/* Diagonal Background Watermark (if enabled) */}
          {enableBackgroundWatermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-[0.06] -rotate-30 select-none">
              <span
                className="text-7xl font-black uppercase tracking-widest whitespace-nowrap"
                style={{ color: inkHexColor }}
              >
                {watermarkText || stampText || 'OFFICIAL STATEMENT'}
              </span>
            </div>
          )}

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
                <strong className="text-slate-900 font-bold">{userProfile.currency || (userProfile.language === 'bn' ? 'BDT (৳)' : 'INR (₹)')} • Standard Accounting</strong>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-400 font-normal">Issued On: </span>
                <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-normal">Total Filled Records: </span>
                <strong className="text-blue-600 font-black">{validEntries.length} Transactions</strong>
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
                {validEntries.filter((e) => e.type === 'income').length} Revenue Records
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
                {validEntries.filter((e) => e.type === 'expense').length} Expense Records
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
                {netBalance >= 0 ? '🟢 Surplus' : '🔴 Deficit'}
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
                {userProfile.language === 'bn' ? 'বিস্তারিত লেনদেন বিবরণী' : 'Itemized Balance Statement Records'} ({validEntries.length} {userProfile.language === 'bn' ? 'টি লেনদেন' : 'entries'})
              </span>
              <span className="text-slate-500 font-normal normal-case text-[11px]">Amounts in {currencySymbol}</span>
            </div>

            {validEntries.length === 0 ? (
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
                  <div className="col-span-4">Description</div>
                  <div className="col-span-1 text-center">Type</div>
                  <div className="col-span-2 text-right">Amount ({currencySymbol})</div>
                </div>

                {/* Table Rows - ONLY filled validEntries */}
                <div className="divide-y divide-slate-100 text-xs">
                  {validEntries.slice(0, 50).map((e, idx) => (
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
                          {e.type === 'income' ? '+' : '-'}{currencySymbol} {(e.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Summary Row */}
                <div className="bg-slate-100 border-t border-slate-300 py-2.5 px-3 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Period Totals ({validEntries.length} items)</span>
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

            {validEntries.length > 50 && (
              <p className="text-[10px] text-slate-400 text-center pt-0.5 italic">
                + {validEntries.length - 50} additional itemized entries saved in database
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

            {/* Dynamic Official Stamp Graphic */}
            {enableStamp && (
              <div className="flex items-center justify-center shrink-0">
                {stampStyle === 'circular' && (
                  <div
                    className="relative inline-flex items-center justify-center p-1 rounded-full transform -rotate-12 select-none"
                    style={{ color: inkHexColor }}
                  >
                    <div
                      className="w-24 h-24 rounded-full border-4 border-double flex flex-col items-center justify-center text-center p-1 leading-none relative overflow-hidden bg-white/40"
                      style={{ borderColor: inkHexColor }}
                    >
                      {/* Inner dashed circle */}
                      <div
                        className="absolute inset-1 rounded-full border border-dashed pointer-events-none opacity-80"
                        style={{ borderColor: inkHexColor }}
                      />

                      <span className="text-[7px] font-black uppercase tracking-widest opacity-90">
                        ★ {appTitle.substring(0, 14).toUpperCase()} ★
                      </span>

                      <span
                        className="text-[10px] font-black my-1 uppercase tracking-tight px-1 font-sans border-y py-0.5 w-full truncate"
                        style={{ borderColor: inkHexColor }}
                      >
                        {stampText || 'VERIFIED'}
                      </span>

                      <span className="text-[7px] font-extrabold uppercase tracking-wider opacity-85">
                        {fromDate.replace(/-/g, '.')}
                      </span>
                    </div>
                  </div>
                )}

                {stampStyle === 'rectangular' && (
                  <div
                    className="relative inline-block p-1 transform -rotate-6 select-none"
                    style={{ color: inkHexColor }}
                  >
                    <div
                      className="px-3.5 py-1.5 border-4 border-double rounded-md flex flex-col items-center justify-center text-center leading-none min-w-[140px] bg-white/40"
                      style={{ borderColor: inkHexColor }}
                    >
                      <div
                        className="text-[7px] font-black uppercase tracking-widest border-b pb-0.5 mb-1 w-full"
                        style={{ borderColor: inkHexColor }}
                      >
                        ★ OFFICIAL LEDGER SEAL ★
                      </div>
                      <div className="text-[12px] font-black uppercase tracking-wider py-0.5 font-sans truncate max-w-[150px]">
                        {stampText || 'PAID & VERIFIED'}
                      </div>
                      <div
                        className="text-[7px] font-bold uppercase tracking-tight pt-0.5 border-t mt-1 w-full opacity-85"
                        style={{ borderColor: inkHexColor }}
                      >
                        REF: DH-{fromDate.replace(/-/g, '')}
                      </div>
                    </div>
                  </div>
                )}

                {stampStyle === 'badge' && (
                  <div
                    className="relative inline-flex flex-col items-center transform -rotate-6 select-none"
                    style={{ color: inkHexColor }}
                  >
                    <div
                      className="px-3 py-1.5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-0.5 bg-white/40"
                      style={{ borderColor: inkHexColor }}
                    >
                      <span className="text-[7px] font-extrabold uppercase tracking-widest">DIGITALLY SIGNED</span>
                      <span
                        className="text-[11px] font-black uppercase tracking-tight px-2 py-0.5 rounded border"
                        style={{ borderColor: inkHexColor }}
                      >
                        {stampText || 'APPROVED'}
                      </span>
                      <span className="text-[7px] font-mono opacity-80 uppercase">
                        BY: {userProfile.username || appTitle}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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


