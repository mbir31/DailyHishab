import React from 'react';

interface AppLogoProps {
  variant?: 'icon-only' | 'full' | 'badge' | 'stacked';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showTagline?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = true,
  animated = false,
  onClick,
}) => {
  // Dimension mapping for icon
  const getIconDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 44;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      case '2xl':
        return 110;
      default:
        return 44;
    }
  };

  const dim = getIconDimension();

  // Custom SVG Vector Logo Mark
  const LogoIcon = (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${
        animated ? 'hover:scale-105 active:scale-95' : ''
      }`}
    >
      <defs>
        {/* Background Squircle Gradient (Sapphire Blue to Deep Emerald/Teal) */}
        <linearGradient id="dh_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>

        {/* Ledger Page Gradient */}
        <linearGradient id="dh_ledger_page" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* BDT Currency Symbol (৳) Gold Gradient */}
        <linearGradient id="dh_bdt_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Ascending Growth Arrow Gradient (Emerald-Cyan) */}
        <linearGradient id="dh_growth_grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Bar Chart Gradients */}
        <linearGradient id="dh_bar1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="dh_bar2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.9" />
        </linearGradient>

        {/* Premium Glow Shadows */}
        <filter id="dh_glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#1E40AF" floodOpacity="0.4" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
        </filter>

        <filter id="dh_gold_glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* 1. Outer Squircle Badge with Glow */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="124"
        fill="url(#dh_bg_grad)"
        filter="url(#dh_glow)"
      />

      {/* Inner Metallic Glass Border */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="116"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.2"
        strokeWidth="6"
      />

      {/* 2. Open Ledger Book Foundation (Left & Right Pages) */}
      {/* Left Page */}
      <path
        d="M96 360 C 140 340, 210 340, 248 356 V 200 C 210 184, 140 184, 96 204 Z"
        fill="url(#dh_ledger_page)"
        fillOpacity="0.95"
      />
      {/* Right Page */}
      <path
        d="M416 360 C 372 340, 302 340, 264 356 V 200 C 302 184, 372 184, 416 204 Z"
        fill="url(#dh_ledger_page)"
        fillOpacity="0.85"
      />
      {/* Book Spine Center Line */}
      <path
        d="M256 190 V 368"
        stroke="#1E293B"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Ledger Page Lines (Subtle rulings) */}
      <path
        d="M120 236 C 160 224, 210 224, 236 234 M120 272 C 160 260, 210 260, 236 270 M120 308 C 160 296, 210 296, 236 306"
        stroke="#94A3B8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M392 236 C 352 224, 302 224, 276 234 M392 272 C 352 260, 302 260, 276 270 M392 308 C 352 296, 302 296, 276 306"
        stroke="#94A3B8"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* 3. Ascending Financial Growth Bar Chart */}
      <rect x="136" y="270" width="22" height="50" rx="6" fill="url(#dh_bar1)" />
      <rect x="172" y="240" width="22" height="80" rx="6" fill="url(#dh_bar1)" />
      <rect x="318" y="220" width="22" height="100" rx="6" fill="url(#dh_bar2)" />
      <rect x="354" y="180" width="22" height="140" rx="6" fill="url(#dh_bar2)" />

      {/* 4. Prominent BDT Currency Symbol (৳) in Center Gold Glow */}
      <g filter="url(#dh_gold_glow)">
        {/* Bengali Taka (৳) Loop & Stem Geometry */}
        {/* Top Arc & Loop */}
        <path
          d="M228 170 C210 150, 180 160, 180 186 C180 210, 205 218, 236 220"
          stroke="url(#dh_bdt_gold)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Vertical Main Stem */}
        <path
          d="M236 140 V 330"
          stroke="url(#dh_bdt_gold)"
          strokeWidth="30"
          strokeLinecap="round"
        />
        {/* Horizontal Taka Slash Accent */}
        <path
          d="M200 248 H 272"
          stroke="url(#dh_bdt_gold)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        {/* Bottom Curve Tail of BDT Symbol */}
        <path
          d="M236 330 C236 355, 275 355, 290 330"
          stroke="url(#dh_bdt_gold)"
          strokeWidth="26"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* 5. Ascending Growth Trend Arrow (Sweeping Up & Right) */}
      <path
        d="M110 330 Q 230 260, 390 120"
        stroke="url(#dh_growth_grad)"
        strokeWidth="32"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <path
        d="M320 120 H 390 V 190"
        stroke="url(#dh_growth_grad)"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Sparkling Financial Nodes */}
      <circle cx="390" cy="120" r="16" fill="#FDE047" />
      <circle cx="270" cy="235" r="10" fill="#38BDF8" />
      <circle cx="170" cy="295" r="8" fill="#34D399" />
    </svg>
  );

  if (variant === 'icon-only') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        {LogoIcon}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-xl backdrop-blur-md select-none transition-all hover:scale-[1.02] ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        {LogoIcon}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
              Daily<span className="text-blue-600 dark:text-blue-400">Hishab</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-blue-600 text-white shadow-sm">
              PRO
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Smart Ledger & Accounting
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div
        onClick={onClick}
        className={`flex flex-col items-center text-center select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="mb-3">{LogoIcon}</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Daily<span className="text-blue-600 dark:text-blue-400">Hishab</span>
        </h1>
        {showTagline && (
          <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            Personal & Business Financial Ledger
          </p>
        )}
      </div>
    );
  }

  // Default 'full' horizontal logo
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {LogoIcon}
      <div className="flex flex-col min-w-0">
        <span className="text-lg sm:text-2xl font-black tracking-tight leading-tight text-gray-900 dark:text-white truncate">
          Daily<span className="text-blue-600 dark:text-blue-400">Hishab</span>
        </span>
        {showTagline && (
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate tracking-wide">
            Daily Ledger & Accounts
          </span>
        )}
      </div>
    </div>
  );
};
