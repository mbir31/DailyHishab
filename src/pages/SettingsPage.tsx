import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProfileSection } from '../components/settings/ProfileSection';
import { CurrencySection } from '../components/settings/CurrencySection';
import { NavLabelsSection } from '../components/settings/NavLabelsSection';
import { ThemeSelector } from '../components/settings/ThemeSelector';
import { LanguageSelector } from '../components/settings/LanguageSelector';
import { AuthSettingsModal } from '../components/settings/AuthSettingsModal';
import { BackupSection } from '../components/settings/BackupSection';
import { GoogleDriveSection } from '../components/settings/GoogleDriveSection';
import { BrandShowcaseSection } from '../components/settings/BrandShowcaseSection';
import { ShieldCheck, UserCheck, KeyRound, Lock, Smartphone, CheckCircle, Monitor, ExternalLink, Download, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { getAppUrl, shareAppUrl, shareAppToWhatsApp, copyAppUrlToClipboard } from '../utils/shareApp';

export const SettingsPage: React.FC = () => {
  const { userProfile, lockApp, deferredPwaPrompt, installPwa, isPwaInstalled, t } = useApp();

  const [authModalType, setAuthModalType] = useState<'username' | 'pin' | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const liveAppUrl = getAppUrl();

  const handleCopyLink = async () => {
    const success = await copyAppUrlToClipboard();
    if (success) {
      setCopiedLink(true);
      setShareMsg('Live HTTPS App Link copied to clipboard!');
      setTimeout(() => {
        setCopiedLink(false);
        setShareMsg(null);
      }, 3000);
    }
  };

  const handleNativeShare = async () => {
    const res = await shareAppUrl(userProfile.mainTitle || 'DailyHishab');
    if (res.success) {
      if (res.method === 'clipboard') {
        setCopiedLink(true);
        setShareMsg('App link copied to clipboard!');
        setTimeout(() => {
          setCopiedLink(false);
          setShareMsg(null);
        }, 3000);
      } else {
        setShareMsg('Share menu opened!');
        setTimeout(() => setShareMsg(null), 3000);
      }
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {t.settings.title}
        </h2>
      </div>

      {/* Section 1: Profile */}
      <ProfileSection />

      {/* Section 2: App Brand & Commercial Logo Showcase */}
      <BrandShowcaseSection />

      {/* Section 3: Currency Symbol Settings */}
      <CurrencySection />

      {/* Section 3: Google Drive Cloud Storage */}
      <GoogleDriveSection />

      {/* Section 4: Customizable Navigation & Table Labels */}
      <NavLabelsSection />

      {/* Section 3: Credentials & Security */}
      <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{t.settings.security.title}</span>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setAuthModalType('username')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-900 dark:text-white font-bold text-xs sm:text-sm active:scale-95 transition-all"
          >
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>{t.settings.security.changeUsername}</span>
          </button>

          <button
            onClick={() => setAuthModalType('pin')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-900 dark:text-white font-bold text-xs sm:text-sm active:scale-95 transition-all"
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>{t.settings.security.changePin}</span>
          </button>

          <button
            onClick={lockApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/20 active:scale-95 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{t.header.lockApp}</span>
          </button>
        </div>
      </div>

      {/* Section 4: Appearance / Theme */}
      <ThemeSelector />

      {/* Section 5: Language */}
      <LanguageSelector />

      {/* Section 6: Data Backup & Restore */}
      <BackupSection />

      {/* Section 7: Mobile App & PC Installation Guide */}
      <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
          <Smartphone className="w-5 h-5 text-blue-500" />
          <span>{t.settings.about.title} & Installation</span>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.settings.about.version} • DailyHishab Web & Mobile App
        </p>

        {deferredPwaPrompt && !isPwaInstalled && (
          <div className="pt-1">
            <button
              onClick={installPwa}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.settings.about.installPwa}</span>
            </button>
          </div>
        )}

        {isPwaInstalled && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
            <CheckCircle className="w-4 h-4" />
            <span>{t.settings.about.installed}</span>
          </div>
        )}

        {/* 🔗 Live PWA Link & Quick Share Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-teal-500/10 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
              <Share2 className="w-4 h-4 text-blue-500" />
              <span>Share Live PWA App Link:</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              HTTPS Verified
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300">
            Share this exact live web application URL with family, business partners, or accounting staff to open and install DailyHishab PWA on any device:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white/80 dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold text-gray-800 dark:text-gray-200 truncate select-all">
              {liveAppUrl}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={() => shareAppToWhatsApp(userProfile.mainTitle || 'DailyHishab')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Share to WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                title="More Share Options"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {shareMsg && (
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in flex items-center gap-1 pt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{shareMsg}</span>
            </div>
          )}
        </div>

        {/* 📱 Android Phone Installation */}
        <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
            <Smartphone className="w-4 h-4" />
            <span>How to Install on Android Phone:</span>
          </div>
          <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1 pl-1">
            <li>Open this app link in <strong>Google Chrome</strong> on your Android phone.</li>
            <li>Tap the <strong>3-dots menu (⋮)</strong> at the top right corner.</li>
            <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
            <li>DailyHishab will install as a native-feeling app on your Android launcher!</li>
          </ol>
          <div className="pt-1 text-[11px] text-gray-500 dark:text-gray-400">
            💡 <strong>Want a native .APK file?</strong> You can generate a standalone Android APK using{' '}
            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline font-bold inline-flex items-center gap-0.5"
            >
              PWABuilder.com <ExternalLink className="w-3 h-3" />
            </a>
            .
          </div>
        </div>

        {/* 💻 PC Browser Usage */}
        <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
            <Monitor className="w-4 h-4" />
            <span>How to Use on PC Browser:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1 pl-1">
            <li>Simply open the app link in any PC browser (Chrome, Edge, Firefox, Brave, Safari).</li>
            <li>In Chrome/Edge on PC, click the <strong>Install icon (🖥️ or ➕)</strong> in the address bar to install as a desktop windowed app.</li>
            <li>Bookmark the link for quick daily access alongside your mobile phone!</li>
          </ul>
        </div>
      </div>

      {/* Credentials Modal */}
      <AuthSettingsModal
        type={authModalType}
        onClose={() => setAuthModalType(null)}
      />
    </div>
  );
};
