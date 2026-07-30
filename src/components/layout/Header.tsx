import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Wifi, WifiOff, Sun, Moon, Share2, Check, RefreshCw, CloudCheck } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { shareAppUrl } from '../../utils/shareApp';

export const Header: React.FC = () => {
  const { userProfile, lockApp, isOnline, isSyncing, triggerManualSync, updateUserProfile, t } = useApp();
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

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

  const handleManualSyncClick = async () => {
    if (isSyncing) return;
    const res = await triggerManualSync();
    if (res.message) {
      setSyncToast(res.message);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header rounded-b-[24px] px-3 py-2.5 sm:px-6 sm:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: User Profile Photo / Default App Icon & Custom Title */}
        <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.username || 'Profile'}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-blue-500/30 dark:border-blue-400/30 shadow-sm shrink-0"
            />
          ) : (
            <AppLogo variant={userProfile.logoVariant || 'icon-only'} size="md" animated={true} />
          )}

          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-2xl font-black text-gray-900 dark:text-white truncate tracking-tight leading-tight">
              {userProfile.mainTitle || (userProfile.language === 'bn' ? t.app.name : 'DailyHishab')}
            </h1>
            <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
              {userProfile.subtitle || (userProfile.language === 'bn' ? t.app.subtitleDefault : 'Personal & Business Ledger')}
            </p>
          </div>
        </div>

        {/* Right: Quick Controls, Network Status & Manual Sync */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Network Status Indicator (Visible on all devices) */}
          <div
            className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
            title={
              isOnline
                ? userProfile.language === 'bn'
                  ? 'ইন্টারনেট সংযুক্ত: ক্লাউড ভল্ট সিঙ্ক সচল'
                  : 'Connected to Internet: Cloud Sync Active'
                : userProfile.language === 'bn'
                  ? 'অফলাইন মোড: সমস্ত হিসাব স্থানীয় ডিভাইসে নিরাপদ'
                  : 'Offline Mode: Ledger saved locally'
            }
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            {isOnline ? <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? t.header.online : t.header.offline}</span>
          </div>

          {/* Dedicated Manual Cloud Sync Button */}
          {userProfile.isLoggedIn && (
            <button
              onClick={handleManualSyncClick}
              disabled={isSyncing}
              className={`relative p-2 sm:p-2.5 rounded-full transition-all active:scale-95 border flex items-center gap-1 text-xs font-bold cursor-pointer ${
                isSyncing
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : isOnline
                  ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20 opacity-60'
              }`}
              title={
                userProfile.language === 'bn'
                  ? 'ম্যানুয়াল ক্লাউড ভল্ট সিঙ্ক করুন'
                  : 'Manual Cloud Vault Sync'
              }
              aria-label="Manual Cloud Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden md:inline">
                {isSyncing
                  ? userProfile.language === 'bn'
                    ? 'সিঙ্ক হচ্ছে...'
                    : 'Syncing...'
                  : userProfile.language === 'bn'
                  ? 'ক্লাউড সিঙ্ক'
                  : 'Cloud Sync'}
              </span>
            </button>
          )}

          {/* Quick Share App Button */}
          <button
            onClick={handleShareApp}
            className="relative p-2 sm:p-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all active:scale-95 border border-blue-500/20 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title={userProfile.language === 'bn' ? 'লাইভ অ্যাপ শেয়ার' : 'Share Live PWA Link'}
            aria-label="Share App Link"
          >
            {shareToast ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
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
              <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          {/* Lock App Button */}
          {userProfile.isLoggedIn && (
            <button
              onClick={lockApp}
              className="p-2 sm:p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all active:scale-95 border border-red-500/20 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title={t.header.lockApp}
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">{t.header.lockApp}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Notification Toast Banner */}
      {syncToast && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-xl bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce z-50 pointer-events-none">
          <CloudCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{syncToast}</span>
        </div>
      )}
    </header>
  );
};
