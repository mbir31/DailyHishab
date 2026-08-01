import React, { useState } from 'react';
import { Entry } from '../../types/entry.types';
import { useApp } from '../../context/AppContext';
import { formatDDMMYYYY, formatDateWithDay } from '../../utils/dateHelpers';
import { formatCurrency, formatNumberOnly } from '../../utils/numberFormat';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FileSpreadsheet, FileText, CheckCircle2, Share2, Loader2, Send, ShieldCheck, Download, Award, Stamp } from 'lucide-react';
import { shareStatementAsImage, renderElementToCanvas, calculateSmartPageSlices } from '../../utils/exportService';

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

  // Filter out blank / unfilled entries and sort tagged entries first, grouped by tag
  const validEntries = entries
    .filter((e) => {
      const hasAmount = typeof e.amount === 'number' && e.amount > 0;
      const hasDesc = typeof e.description === 'string' && e.description.trim().length > 0;
      return hasAmount || hasDesc;
    })
    .sort((a, b) => {
      const aTags = a.tags && a.tags.length > 0 ? a.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
      const bTags = b.tags && b.tags.length > 0 ? b.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

      const aHasTags = aTags.length > 0;
      const bHasTags = bTags.length > 0;

      // 1. Tagged entries first, untagged entries later
      if (aHasTags && !bHasTags) return -1;
      if (!aHasTags && bHasTags) return 1;

      // 2. Group entries with the same tag together
      if (aHasTags && bHasTags) {
        const tagStrA = aTags.sort().join(',');
        const tagStrB = bTags.sort().join(',');
        if (tagStrA !== tagStrB) {
          return tagStrA.localeCompare(tagStrB);
        }
      }

      return 0;
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
      language: userProfile.language,
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
    setExportMsg(userProfile.language === 'bn' ? 'বাংলা ফন্টসহ পিডিএফ স্টেটমেন্ট ফাইল তৈরি করা হচ্ছে...' : 'Generating PDF statement with Bangla font support...');

    try {
      const element = document.getElementById('statement-image-export-card');
      if (!element) {
        alert('Statement template not found');
        setIsExportingPDF(false);
        return;
      }

      const canvas = await renderElementToCanvas(element, {
        backgroundColor: '#FFFFFF',
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate single A4 page height in canvas pixel space (210mm : 297mm ratio)
      const pageCanvasHeight = Math.floor((imgWidth * pdfHeight) / pdfWidth);

      const topMargin = Math.floor(pageCanvasHeight * 0.03);
      const bottomMargin = Math.floor(pageCanvasHeight * 0.05);

      const slices = calculateSmartPageSlices(element, canvas, pageCanvasHeight, {
        topMargin,
        bottomMargin,
      });

      if (slices.length === 1) {
        // Fits within a single A4 page
        const scaledHeight = (imgHeight * pdfWidth) / imgWidth;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(scaledHeight, pdfHeight));

        // Footer for single page
        pdf.setFontSize(8);
        pdf.setTextColor(140, 140, 140);
        const pageStr = userProfile.language === 'bn' ? 'পৃষ্ঠা ১ / ১' : 'Page 1 of 1';
        pdf.text(`${appTitle} Statement • ${pageStr}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      } else {
        // Exceeds single A4 page height -> split across multiple pages cleanly between data rows
        const totalPages = slices.length;

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const slice = slices[i];

          // Create a dedicated page slice canvas
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = pageCanvasHeight;
          const ctx = pageCanvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, imgWidth, pageCanvasHeight);

            // Draw slice onto page canvas starting cleanly at topMargin
            ctx.drawImage(
              canvas,
              0, slice.startY,
              imgWidth, slice.sliceHeight,
              0, topMargin,
              imgWidth, slice.sliceHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

          // Footer for each page
          pdf.setFontSize(8);
          pdf.setTextColor(140, 140, 140);
          const pageStr =
            userProfile.language === 'bn'
              ? `পৃষ্ঠা ${formatNumberOnly(i + 1, 'bn')} / ${formatNumberOnly(totalPages, 'bn')}`
              : `Page ${i + 1} of ${totalPages}`;
          pdf.text(`${appTitle} Statement • ${pageStr}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
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
          className="w-[820px] p-6 bg-white text-slate-800 font-sans space-y-3.5 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden"
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
          <div className="h-2 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500 rounded-t-3xl -mt-6 -mx-6 mb-3" />

          {/* Statement Header Banner */}
          <div data-page-break-avoid="true" className="statement-block bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              {(userProfile.photoURL || (userProfile as any).photoUrl) ? (
                <img
                  src={userProfile.photoURL || (userProfile as any).photoUrl || ''}
                  alt={userProfile.username || 'User Profile'}
                  className="w-10 h-10 rounded-xl object-cover shadow-lg border-2 border-white/30 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/30 shrink-0">
                  {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'D'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">
                    {appTitle}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                    {userProfile.language === 'bn' ? 'যাচাইকৃত খাতা' : 'Verified Ledger'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                  {userProfile.subtitle || (userProfile.language === 'bn' ? 'ব্যক্তিগত ও বাণিজ্যিক আর্থিক হিসাব বিবরণী' : 'Personal & Business General Financial Statement')}
                </p>
              </div>
            </div>

            {/* Upper Right Header Texts (Always in English as requested) */}
            <div className="text-right space-y-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] font-extrabold border border-blue-400/30 uppercase tracking-widest">
                OFFICIAL STATEMENT
              </span>
              <div className="text-[11px] font-bold text-slate-200 font-mono">
                Ref: DH-{fromDate.replace(/-/g, '')}-{toDate.replace(/-/g, '')}
              </div>
              <p className="text-[10px] text-slate-400 font-medium font-mono">
                Period: {formatDDMMYYYY(fromDate, 'en')} to {formatDDMMYYYY(toDate, 'en')}
              </p>
            </div>
          </div>

          {/* Account & Report Metadata Bar */}
          <div data-page-break-avoid="true" className="statement-block bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-[11px] text-slate-600 font-medium grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div>
                <span className="text-slate-400 font-normal">{userProfile.language === 'bn' ? 'হিসাব রক্ষক/যাচাইকারী: ' : 'Accountant / Verifier: '}</span>
                <strong className="text-slate-900 font-bold">{userProfile.username || (userProfile.language === 'bn' ? 'সম্মানিত হিসাব রক্ষক/যাচাইকারী' : 'Valued Accountant / Verifier')}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-normal">{userProfile.language === 'bn' ? 'মুদ্রা ও ফরম্যাট: ' : 'Currency & Format: '}</span>
                <strong className="text-slate-900 font-bold">{currencySymbol} • {userProfile.language === 'bn' ? 'স্ট্যান্ডার্ড একাউন্টিং' : 'Standard Accounting'}</strong>
              </div>
            </div>

            <div className="space-y-0.5 text-right">
              <div>
                <span className="text-slate-400 font-normal">{userProfile.language === 'bn' ? 'ইস্যুর তারিখ: ' : 'Issued On: '}</span>
                <strong className="text-slate-900 font-bold">{new Date().toLocaleDateString(userProfile.language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-normal">{userProfile.language === 'bn' ? 'মোট লেনদেন সংখ্যা: ' : 'Total Filled Records: '}</span>
                <strong className="text-blue-600 font-black">
                  {userProfile.language === 'bn' ? `${formatNumberOnly(validEntries.length, 'bn')} টি লেনদেন` : `${validEntries.length} Transactions`}
                </strong>
              </div>
            </div>
          </div>

          {/* KPI Financial Summary Cards Grid */}
          {(() => {
            const isMonthlyOrYearly = (() => {
              if (!fromDate || !toDate) return false;
              const dFrom = new Date(fromDate);
              const dTo = new Date(toDate);
              const diffDays = Math.round((dTo.getTime() - dFrom.getTime()) / (1000 * 3600 * 24)) + 1;
              return diffDays >= 27;
            })();

            return (
              <div data-page-break-avoid="true" className={`statement-block grid ${isMonthlyOrYearly ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5`}>
                {/* Income Card */}
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">
                    {userProfile.language === 'bn' ? 'মোট আয়' : 'Total Income'}
                  </span>
                  <div className="text-base font-black text-emerald-700 font-tabular my-0.5">
                    {formatCurrency(totalIncome, userProfile.language, currencySymbol)}
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-600">
                    {userProfile.language === 'bn'
                      ? `${formatNumberOnly(validEntries.filter((e) => e.type === 'income').length, 'bn')} টি আয় রেকর্ড`
                      : `${validEntries.filter((e) => e.type === 'income').length} Revenue Records`}
                  </span>
                </div>

                {/* Expense Card */}
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex flex-col justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-800">
                    {userProfile.language === 'bn' ? 'মোট ব্যয়' : 'Total Expense'}
                  </span>
                  <div className="text-base font-black text-rose-700 font-tabular my-0.5">
                    {formatCurrency(totalExpense, userProfile.language, currencySymbol)}
                  </div>
                  <span className="text-[9px] font-semibold text-rose-600">
                    {userProfile.language === 'bn'
                      ? `${formatNumberOnly(validEntries.filter((e) => e.type === 'expense').length, 'bn')} টি ব্যয় রেকর্ড`
                      : `${validEntries.filter((e) => e.type === 'expense').length} Expense Records`}
                  </span>
                </div>

                {/* Net Balance Card */}
                <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${netBalance >= 0 ? 'bg-blue-50/80 border-blue-200/80' : 'bg-amber-50/80 border-amber-200/80'}`}>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider ${netBalance >= 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                    {userProfile.language === 'bn' ? 'জমা / ব্যালেন্স' : 'Net Balance'}
                  </span>
                  <div className={`text-base font-black font-tabular my-0.5 ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                    {formatCurrency(netBalance, userProfile.language, currencySymbol)}
                  </div>
                  <span className={`text-[9px] font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {netBalance >= 0 ? (userProfile.language === 'bn' ? '🟢 উদ্ধৃত্ত' : '🟢 Surplus') : (userProfile.language === 'bn' ? '🔴 ঘাটতি' : '🔴 Deficit')}
                  </span>
                </div>

                {/* Profit Margin / Retention Card (ONLY shown on Monthly or Yearly Statements) */}
                {isMonthlyOrYearly && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col justify-between">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-800">
                      {userProfile.language === 'bn' ? 'প্রফিট মার্জিন' : 'Profit Margin'}
                    </span>
                    <div className="text-base font-black text-indigo-700 font-tabular my-0.5">
                      {formatNumberOnly(totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0, userProfile.language)}%
                    </div>
                    <span className="text-[9px] font-semibold text-indigo-600">
                      {userProfile.language === 'bn' ? 'শুদ্ধ মুনাফা হার' : 'Net Cash Retention'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Itemized Transactions Table */}
          <div className="space-y-1.5 pt-0.5">
            <div data-page-break-avoid="true" className="statement-block flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-200">
              <span>
                {userProfile.language === 'bn' ? 'বিস্তারিত লেনদেন বিবরণী' : 'Itemized Balance Statement Records'} ({userProfile.language === 'bn' ? `${formatNumberOnly(validEntries.length, 'bn')} টি লেনদেন` : `${validEntries.length} entries`})
              </span>
              <span className="text-slate-500 font-normal normal-case text-[10px]">
                {userProfile.language === 'bn' ? 'টাকার পরিমাণ' : 'Amounts in'} {currencySymbol}
              </span>
            </div>

            {validEntries.length === 0 ? (
              <div data-page-break-avoid="true" className="statement-block p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {userProfile.language === 'bn' ? 'নির্দিষ্ট তারিখে কোনো লেনদেন রেকর্ড নেই' : 'No transactions recorded for this date / period'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {userProfile.language === 'bn' ? 'মোট আয়: ৳ ০.০০ • মোট ব্যয়: ৳ ০.০০ • জের: ৳ ০.০০' : 'Total Income: 0.00 • Total Expense: 0.00 • Net Balance: 0.00'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {/* Table Header */}
                <div data-page-break-avoid="true" className="statement-block bg-slate-900 text-white text-[9.5px] font-extrabold uppercase tracking-wider py-1 px-2.5 grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-1 text-center">{userProfile.language === 'bn' ? 'ক্রম' : 'SL'}</div>
                  <div className="col-span-2">{userProfile.language === 'bn' ? 'তারিখ' : 'Date'}</div>
                  <div className="col-span-2">{userProfile.language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</div>
                  <div className="col-span-4">{userProfile.language === 'bn' ? 'বর্ণনা' : 'Description'}</div>
                  <div className="col-span-1 text-center">{userProfile.language === 'bn' ? 'ধরণ' : 'Type'}</div>
                  <div className="col-span-2 text-right">{userProfile.language === 'bn' ? 'টাকা' : 'Amount'} ({currencySymbol})</div>
                </div>

                {/* Table Rows - ALL validEntries */}
                <div className="divide-y divide-slate-100">
                  {validEntries.map((e, idx) => (
                    <div
                      key={e.id || idx}
                      data-page-break-avoid="true"
                      className={`statement-row py-0.5 px-2.5 grid grid-cols-12 gap-1.5 items-center ${
                        idx % 2 === 0 ? 'bg-slate-50/60' : 'bg-white'
                      }`}
                    >
                      <div className="col-span-1 text-center font-bold text-slate-400 text-[10px]">
                        {formatNumberOnly(idx + 1, userProfile.language)}
                      </div>

                      <div className="col-span-2 font-medium text-slate-700 text-[10px]">
                        {formatDateWithDay(e.date, userProfile.language, true)}
                      </div>

                      <div className="col-span-2">
                        <span className="inline-block px-1.5 py-[1px] rounded-md bg-slate-200/70 text-slate-700 text-[9px] font-bold truncate max-w-[95px]">
                          {e.category || (userProfile.language === 'bn' ? 'সাধারণ' : 'General')}
                        </span>
                      </div>

                      <div className="col-span-4 min-w-0">
                        <div className="font-bold text-slate-900 truncate text-[10px] leading-tight">
                          {e.description || e.category || (userProfile.language === 'bn' ? 'লেনদেন হিসাব' : 'Transaction Record')}
                        </div>
                        {e.tags && e.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-0.5 mt-0.5">
                            {e.tags.map((t) => (
                              <span
                                key={t}
                                className="inline-block px-1 py-[1px] rounded bg-indigo-100/90 text-indigo-900 text-[8px] font-extrabold border border-indigo-200/60 leading-none"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 text-center">
                        <span
                          className={`inline-block px-1 py-[1px] rounded text-[8.5px] font-extrabold uppercase tracking-wide leading-none ${
                            e.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {e.type === 'income' ? (userProfile.language === 'bn' ? 'আয়' : 'INC') : (userProfile.language === 'bn' ? 'খরচ' : 'EXP')}
                        </span>
                      </div>

                      <div className="col-span-2 text-right font-black font-tabular text-[10.5px]">
                        <span className={e.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {e.type === 'income' ? '+' : '-'}{formatCurrency(e.amount || 0, userProfile.language, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Summary Row */}
                <div data-page-break-avoid="true" className="statement-block bg-slate-100 border-t border-slate-300 py-1 px-2.5 flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span>
                    {userProfile.language === 'bn' ? 'সাময়িক হিসাব মোট' : 'Period Totals'} ({formatNumberOnly(validEntries.length, userProfile.language)} {userProfile.language === 'bn' ? 'টি' : 'items'})
                  </span>
                  <div className="flex items-center gap-3.5 font-tabular text-[10.5px]">
                    <span className="text-emerald-700 font-black">
                      {userProfile.language === 'bn' ? 'মোট জমা: ' : 'Total In: +'}{formatCurrency(totalIncome, userProfile.language, currencySymbol)}
                    </span>
                    <span className="text-rose-700 font-black">
                      {userProfile.language === 'bn' ? 'মোট খরচ: ' : 'Total Out: -'}{formatCurrency(totalExpense, userProfile.language, currencySymbol)}
                    </span>
                    <span className={`font-black text-[11px] ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                      {userProfile.language === 'bn' ? 'জমা / ব্যালেন্স: ' : 'Net Balance: '}{formatCurrency(netBalance, userProfile.language, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Stamp & Security Footer */}
          <div data-page-break-avoid="true" className="statement-block pt-2.5 border-t border-slate-200 flex items-center justify-between">
            {/* Security disclaimer */}
            <div className="space-y-1 text-[10px] text-slate-500 max-w-[500px]">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{userProfile.language === 'bn' ? 'ডিজিটালভাবে সত্যায়িত লেজার বিবরণী' : 'Digitally Authenticated Ledger Statement'}</span>
              </div>
              <p className="leading-tight text-slate-400">
                {userProfile.language === 'bn'
                  ? 'এই বিবরণীটি ডেইলি হিসাব অ্যাপ দ্বারা স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে। তথ্যগত সঠিকতা ও অডিটের জন্য নির্ভরযোগ্য নথি।'
                  : `This document is generated automatically by ${appTitle} double-entry accounting engine. Verified for accuracy, tax estimation, and audit documentation.`}
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
            <span>
              {userProfile.language === 'bn'
                ? 'ডেইলি হিসাব দ্বারা পরিচালিত • স্মার্ট পার্সোনাল ও বিজনেস লেজার'
                : `Powered by ${appTitle} • Smart Personal & Business Ledger`}
            </span>
            <span>Ref ID: DH-STMT-{fromDate.replace(/-/g, '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


