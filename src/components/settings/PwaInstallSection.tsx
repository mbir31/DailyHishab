import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  MessageSquare,
  PlusCircle,
  ExternalLink,
  Sparkles,
  Monitor,
  Info,
  X,
  Zap,
} from 'lucide-react';
import { getAppUrl, shareAppUrl, shareAppToWhatsApp, copyAppUrlToClipboard } from '../../utils/shareApp';

export const PwaInstallSection: React.FC = () => {
  const { userProfile, deferredPwaPrompt, installPwa, isPwaInstalled, t } = useApp();
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  const liveAppUrl = getAppUrl();

  const handleInstallClick = () => {
    if (deferredPwaPrompt) {
      installPwa();
    } else {
      setShowManualGuide(true);
    }
  };

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
    <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-3xl shadow-2xl border-2 border-emerald-500/30 dark:border-emerald-400/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-blue-500/5 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-blue-950/30 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Title */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 dark:border-emerald-400/15">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Install & Add Shortcut to Home Screen</span>
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Access DailyHishab in 1-tap directly from your phone's home screen or PC launcher
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30">
          <Zap className="w-3.5 h-3.5" /> 1-Tap Access
        </span>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-500/30 shadow-md space-y-3">
        {isPwaInstalled ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />
              <div>
                <span className="block font-black text-base text-gray-900 dark:text-white">DailyHishab App Installed!</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  App shortcut is active on your device home screen.
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowManualGuide(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span>Installation Details</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  🚀 Recommended Action
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Tap below to add DailyHishab directly to your mobile home screen without opening your browser menu.
                </p>
              </div>

              <button
                onClick={handleInstallClick}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Add Shortcut / Install App</span>
              </button>
            </div>

            {!deferredPwaPrompt && (
              <div className="pt-2 border-t border-gray-200/50 dark:border-slate-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Manual shortcut guide available for iOS Safari & Android Chrome</span>
                </span>
                <button
                  onClick={() => setShowManualGuide(true)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View Step Guide →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Quick Instructions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Android Chrome */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>Android Chrome</span>
          </div>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
            Tap <strong>"Add Shortcut"</strong> button above, or tap <strong>3-dots (⋮)</strong> ➔ <strong>"Add to Home screen"</strong>.
          </p>
        </div>

        {/* iPhone / iPad */}
        <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/20 space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs text-blue-800 dark:text-blue-300 uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <span>iPhone / iPad (Safari)</span>
          </div>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
            Tap Safari <strong>Share (↑)</strong> button ➔ Scroll down & tap <strong>"Add to Home Screen (➕)"</strong>.
          </p>
        </div>

        {/* PC / Laptop */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 space-y-1.5">
          <div className="flex items-center gap-2 font-black text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
            <Monitor className="w-4 h-4 text-indigo-500" />
            <span>PC Desktop</span>
          </div>
          <p className="text-[11px] text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
            Click <strong>Install icon (🖥️ / ➕)</strong> in Chrome/Edge URL address bar to install as desktop window app.
          </p>
        </div>
      </div>

      {/* Share Live HTTPS Link Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 text-white border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-300">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Share HTTPS App Link to Install on Phone:</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Live HTTPS PWA
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono font-bold text-cyan-200 truncate select-all">
            {liveAppUrl}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => shareAppToWhatsApp(userProfile.mainTitle || 'DailyHishab')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Share to WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              title="More Options"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {shareMsg && (
          <div className="text-[11px] font-bold text-emerald-400 animate-fade-in flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{shareMsg}</span>
          </div>
        )}
      </div>

      {/* Manual Installation Modal */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-gray-900 dark:text-white relative">
            <button
              onClick={() => setShowManualGuide(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-lg font-black text-emerald-600 dark:text-emerald-400">
              <PlusCircle className="w-6 h-6" />
              <span>How to Add Shortcut to Home Screen</span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              If your browser did not automatically open the 1-tap install prompt, follow these quick steps:
            </p>

            <div className="space-y-3 pt-1">
              {/* Android Chrome */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/20 space-y-1">
                <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 block">🤖 Android (Google Chrome)</span>
                <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Tap the <strong>3 dots (⋮)</strong> menu icon in Chrome's top-right corner.</li>
                  <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
                  <li>Confirm by tapping <strong>Add</strong>. DailyHishab will appear on your app launcher!</li>
                </ol>
              </div>

              {/* iOS Safari */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/50 border border-blue-500/20 space-y-1">
                <span className="font-extrabold text-xs text-blue-800 dark:text-blue-300 block">🍏 iPhone / iPad (Apple Safari)</span>
                <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Tap the <strong>Share button (↑)</strong> at the bottom of Safari.</li>
                  <li>Scroll down the share sheet options.</li>
                  <li>Tap <strong>"Add to Home Screen (➕)"</strong> and confirm.</li>
                </ol>
              </div>

              {/* PC Chrome / Edge */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/50 border border-indigo-500/20 space-y-1">
                <span className="font-extrabold text-xs text-indigo-800 dark:text-indigo-300 block">💻 PC Desktop (Chrome / Edge)</span>
                <ol className="list-decimal list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Look at the right side of the URL address bar.</li>
                  <li>Click the <strong>Install icon (🖥️ or ➕)</strong>.</li>
                  <li>Click <strong>Install</strong> to launch DailyHishab as a desktop application!</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowManualGuide(false)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
