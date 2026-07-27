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
        {/* Background Squircle Gradient */}
        <linearGradient id="dh_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        {/* Monogram 'D' Accent Gradient */}
        <linearGradient id="dh_accent_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Arrow Growth Gradient */}
        <linearGradient id="dh_arrow_grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Gold Coin / Currency Node Gradient */}
        <linearGradient id="dh_gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Premium Shadow Effect */}
        <filter id="dh_glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#2563EB" floodOpacity="0.35" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
        </filter>

        <filter id="dh_inner_shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* 1. Base Squircle Badge with Glow */}
      <rect
        x="16"
        y="16"
        width="480"
        height="480"
        rx="128"
        fill="url(#dh_bg_grad)"
        filter="url(#dh_glow)"
      />

      {/* Subtle Inner Glass Ring Border */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="120"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.2"
        strokeWidth="6"
      />

      {/* 2. Abstract Ledger Lines in Background */}
      <path
        d="M120 140 H392 M120 200 H392 M120 260 H300"
        stroke="#FFFFFF"
        strokeOpacity="0.12"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* 3. Interlocking 'D' Monogram Spine (Left Binding of Ledger) */}
      <path
        d="M140 120 V392"
        stroke="#FFFFFF"
        strokeWidth="44"
        strokeLinecap="round"
      />

      {/* 'D' Curved Loop */}
      <path
        d="M140 120 H250 C340 120, 380 180, 380 256 C380 332, 340 392, 250 392 H140"
        stroke="url(#dh_accent_grad)"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 4. Interlocking 'H' Right Pillar */}
      <path
        d="M320 160 V392"
        stroke="#FFFFFF"
        strokeWidth="36"
        strokeLinecap="round"
      />

      {/* 5. Central 'H' Crossbar & Rising Financial Growth Arrow (+45deg trend) */}
      <path
        d="M140 256 H270 L380 146"
        stroke="url(#dh_arrow_grad)"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Arrowhead Cap */}
      <path
        d="M310 146 H380 V216"
        stroke="url(#dh_arrow_grad)"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 6. Precision Golden Currency/Financial Balance Accent Circle */}
      <circle
        cx="236"
        cy="312"
        r="32"
        fill="url(#dh_gold_grad)"
        filter="url(#dh_inner_shadow)"
      />
      {/* Taka / Dollar Symbol overlay inside coin */}
      <path
        d="M236 294 V330 M224 304 H248 C252 304 252 312 236 312 C220 312 220 320 224 320 H248"
        stroke="#78350F"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
