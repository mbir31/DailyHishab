import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppLogo } from '../brand/AppLogo';
import { Palette, Copy, Check, Download, CheckCircle2 } from 'lucide-react';

export const BrandShowcaseSection: React.FC = () => {
  const { userProfile, updateUserProfile } = useApp();
  const [copied, setCopied] = useState<boolean>(false);

  const selectedVariant = userProfile.logoVariant || 'full';

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
