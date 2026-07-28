import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Wifi, WifiOff, Sun, Moon, Share2, Check } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { shareAppUrl } from '../../utils/shareApp';

export const Header: React.FC = () => {
  const { userProfile, lockApp, isOnline, updateUserProfile, t } = useApp();
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleToggleTheme = () => {
    const nextTheme = userProfile.theme === 'dark' ? 'light' : 'dark';
    updateUserProfile({ theme: nextTheme });
  };

  const handleShareApp = async () => {
    const res = await shareAppUrl(userProfile.mainTitle || 'DailyHishab');
    if (res.success) {
      if (res.method === 'clipboard') {
        setShareToast('PWA App Link Copied!');
      } else {
        setShareToast('Share Drawer Opened');
      }
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header rounded-b-[24px] px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand AppLogo & Custom Title */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          {userProfile.logoVariant === 'badge' ? (
            <AppLogo variant="badge" size="sm" showTagline={true} />
          ) : userProfile.logoVariant === 'full' ? (
            <AppLogo variant="full" size="sm" showTagline={false} />
          ) : (
            <>
              <AppLogo variant={userProfile.logoVariant || 'icon-only'} size="md" animated={true} />
              <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate tracking-tight leading-tight">
                  {userProfile.mainTitle || (userProfile.language === 'bn' ? t.app.name : 'DailyHishab')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                  {userProfile.subtitle || (userProfile.language === 'bn' ? t.app.subtitleDefault : 'Personal & Business Ledger')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right: Quick Controls & Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Online/Offline status badge */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? t.header.online : t.header.offline}</span>
          </div>

          {/* Quick Share App Button */}
          <button
            onClick={handleShareApp}
            className="relative p-2 sm:p-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all active:scale-95 border border-blue-500/20 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title={userProfile.language === 'bn' ? 'লাইভ অ্যাপ শেয়ার' : 'Share Live PWA Link'}
            aria-label="Share App Link"
          >
            {shareToast ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden lg:inline">
              {shareToast || (userProfile.language === 'bn' ? 'শেয়ার অ্যাপ' : 'Share App')}
            </span>
          </button>

          {/* Theme Quick Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2 sm:p-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-all active:scale-95 cursor-pointer"
            title={userProfile.theme === 'dark' ? t.settings.appearance.light : t.settings.appearance.dark}
            aria-label="Toggle Theme"
          >
            {userProfile.theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          {/* Lock App Button */}
          {userProfile.isLoggedIn && (
            <button
              onClick={lockApp}
              className="p-2 sm:p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all active:scale-95 border border-red-500/20 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title={t.header.lockApp}
            >
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">{t.header.lockApp}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
