import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppLogo } from '../brand/AppLogo';
import { Palette, Copy, Check, Download, CheckCircle2 } from 'lucide-react';

export const BrandShowcaseSection: React.FC = () => {
  const { userProfile, updateUserProfile } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  const selectedVariant = userProfile.logoVariant || 'full';

  const handleCopySvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="dh_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A8A"/><stop offset="45%" stop-color="#2563EB"/><stop offset="100%" stop-color="#0F766E"/></linearGradient><linearGradient id="dh_ledger_page" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2E8F0"/></linearGradient><linearGradient id="dh_bdt_gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE047"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient><linearGradient id="dh_growth_grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#10B981"/><stop offset="50%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#38BDF8"/></linearGradient></defs><rect x="16" y="16" width="480" height="480" rx="124" fill="url(#dh_bg_grad)"/><path d="M96 360 C 140 340, 210 340, 248 356 V 200 C 210 184, 140 184, 96 204 Z" fill="url(#dh_ledger_page)" fill-opacity="0.95"/><path d="M416 360 C 372 340, 302 340, 264 356 V 200 C 302 184, 372 184, 416 204 Z" fill="url(#dh_ledger_page)" fill-opacity="0.85"/><path d="M256 190 V 368" stroke="#1E293B" stroke-width="8" stroke-linecap="round"/><path d="M228 170 C210 150, 180 160, 180 186 C180 210, 205 218, 236 220" stroke="url(#dh_bdt_gold)" stroke-width="28" stroke-linecap="round" fill="none"/><path d="M236 140 V 330" stroke="url(#dh_bdt_gold)" stroke-width="30" stroke-linecap="round"/><path d="M200 248 H 272" stroke="url(#dh_bdt_gold)" stroke-width="26" stroke-linecap="round"/><path d="M236 330 C236 355, 275 355, 290 330" stroke="url(#dh_bdt_gold)" stroke-width="26" stroke-linecap="round" fill="none"/><path d="M110 330 Q 230 260, 390 120" stroke="url(#dh_growth_grad)" stroke-width="32" stroke-linecap="round" fill="none"/><path d="M320 120 H 390 V 190" stroke="url(#dh_growth_grad)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
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

  const logoVariants = [
    {
      id: 'full' as const,
      name: 'Full Horizontal',
      description: 'Standard brand mark with icon, title & tagline. Ideal for header navigation & invoices.',
      badge: 'Recommended',
    },
    {
      id: 'badge' as const,
      name: 'Glass Badge',
      description: 'Modern translucent pill badge with PRO seal. Great for clean high-contrast layouts.',
      badge: 'Modern',
    },
    {
      id: 'stacked' as const,
      name: 'Stacked Hero',
      description: 'Centered vertical brand mark. Perfect for splash screens, logins & full reports.',
      badge: 'Centered',
    },
    {
      id: 'icon-only' as const,
      name: 'Icon Mark Only',
      description: 'Minimalist squircle vector icon. Compact look for slim mobile navigation bars.',
      badge: 'Minimal',
    },
  ];

  const handleSelectVariant = (variantId: 'full' | 'badge' | 'stacked' | 'icon-only') => {
    updateUserProfile({ logoVariant: variantId });
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2>App Brand & Commercial Logo</h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Select your preferred logo display style for the application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Selectable Logo Display Variants Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Select Logo Display Variant
          </h3>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Click any card to set as your active logo variant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {logoVariants.map((item) => {
            const isSelected = selectedVariant === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectVariant(item.id)}
                className={`relative text-left p-4 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 border ${
                  isSelected
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/30 shadow-lg scale-[1.01]'
                    : 'bg-white/60 dark:bg-gray-900/60 border-gray-200/60 dark:border-gray-800 hover:border-blue-400/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                }`}
              >
                {/* Top Badge & Radio indicator */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {item.badge}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium group-hover:text-gray-600">
                        Click to Select
                      </span>
                    )}
                  </div>
                </div>

                {/* Logo Preview Box */}
                <div className="py-3 px-2 flex items-center justify-center min-h-[90px] rounded-xl bg-slate-900/5 dark:bg-slate-900/40 border border-black/5 dark:border-white/5">
                  <AppLogo variant={item.id} size={item.id === 'stacked' ? 'md' : 'sm'} showTagline={true} />
                </div>

                {/* Label & Description */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
