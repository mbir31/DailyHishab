import React, { useState } from 'react';
import { AppLogo } from '../brand/AppLogo';
import { Palette, Copy, Check, Download, Layers, ShieldCheck, Sparkles, TrendingUp, BookOpen } from 'lucide-react';

export const BrandShowcaseSection: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopySvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="dh_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A8A"/><stop offset="50%" stop-color="#2563EB"/><stop offset="100%" stop-color="#0D9488"/></linearGradient><linearGradient id="dh_accent_grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient><linearGradient id="dh_arrow_grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#10B981"/></linearGradient><linearGradient id="dh_gold_grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FCD34D"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><rect x="16" y="16" width="480" height="480" rx="128" fill="url(#dh_bg_grad)"/><path d="M120 140 H392 M120 200 H392 M120 260 H300" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="16" stroke-linecap="round"/><path d="M140 120 V392" stroke="#FFFFFF" stroke-width="44" stroke-linecap="round"/><path d="M140 120 H250 C340 120, 380 180, 380 256 C380 332, 340 392, 250 392 H140" stroke="url(#dh_accent_grad)" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M320 160 V392" stroke="#FFFFFF" stroke-width="36" stroke-linecap="round"/><path d="M140 256 H270 L380 146" stroke="url(#dh_arrow_grad)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M310 146 H380 V216" stroke="url(#dh_arrow_grad)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="236" cy="312" r="32" fill="url(#dh_gold_grad)"/></svg>`;
    navigator.clipboard.writeText(svgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSvg = () => {
    const link = document.createElement('a');
    link.href = '/favicon.svg';
    link.download = 'DailyHishab_Commercial_Logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2>App Brand & Commercial Logo</h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Signature identity designed for DailyHishab
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Copy Raw SVG Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SVG!' : 'Copy SVG'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Logo</span>
          </button>
        </div>
      </div>

      {/* Main Brand Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Logo Variants Showcase */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Logo Display Variants
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Variant 1: Full Horizontal */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800 flex items-center justify-center min-h-[100px]">
              <AppLogo variant="full" size="md" showTagline={true} />
            </div>

            {/* Variant 2: Glass Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-900/20 to-purple-900/20 border border-blue-500/20 flex items-center justify-center min-h-[100px]">
              <AppLogo variant="badge" size="sm" showTagline={true} />
            </div>

            {/* Variant 3: Stacked Hero Mark */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-center min-h-[130px] sm:col-span-2">
              <AppLogo variant="stacked" size="lg" showTagline={true} />
            </div>
          </div>
        </div>

        {/* Right: Graphic Designer Philosophy & Monogram Rationale */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Design Concept & Symbolism
          </h3>

          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 dark:text-white block font-bold mb-0.5">
                  1. Ledger Book Binding ('D' Curve)
                </strong>
                The sweeping arch of the letter 'D' forms the spine and open pages of a traditional financial ledger book.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 dark:text-white block font-bold mb-0.5">
                  2. Growth Vector ('H' Crossbar)
                </strong>
                The crossbar of the interlocking 'H' transitions into an upward-sloping +45° growth arrow representing financial progress & profitability.
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900 dark:text-white block font-bold mb-0.5">
                  3. Golden Currency Node & Squircle
                </strong>
                A golden coin seal rests at the geometric center representing balance, accuracy, and prosperity framed in an ultra-modern squircle emblem.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
