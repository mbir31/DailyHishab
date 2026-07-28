import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
  CloudDownload,
  RotateCw,
  ArrowLeft,
  LogIn,
} from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import { isValidUserId, isValidPin } from '../../utils/storage';

export const WelcomeScreen: React.FC = () => {
  const { userProfile, loginWithPin, setupNewUser, recoverCloudBackup, t } = useApp();

  const isFirstSetup = !userProfile.isFirstSetupCompleted || !userProfile.pinHash;

  // Active Setup/Recovery Tab Mode
  const [activeTab, setActiveTab] = useState<'setup' | 'recover'>('setup');
  const [showRecoveryOnLockScreen, setShowRecoveryOnLockScreen] = useState<boolean>(false);

  // New Setup Form State
  const [usernameInput, setUsernameInput] = useState<string>('Admin');
  const [userIdInput, setUserIdInput] = useState<string>(userProfile.userId || '01712345678');
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');

  // Recover Backup Form State
  const [recoverUserId, setRecoverUserId] = useState<string>('');
  const [recoverPin, setRecoverPin] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Common UI State
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Handle New Account Setup
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUserId = userIdInput.trim();
    const cleanPin = pinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!isValidUserId(cleanUserId)) {
      setErrorMsg('User ID / Phone Number must be strictly 11 numeric digits (e.g. 01712345678)');
      return;
    }

    if (!isValidPin(cleanPin)) {
      setErrorMsg('PIN must be strictly 4 numeric digits (e.g. 1234)');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setErrorMsg(t.auth.pinMismatch || 'PINs do not match.');
      return;
    }

    await setupNewUser(usernameInput.trim() || 'Admin', cleanUserId, cleanPin);
  };

  // Handle Cloud Backup Recovery by Phone Number & PIN
  const handleCloudRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUserId = recoverUserId.trim();
    const cleanPin = recoverPin.trim();

    if (!isValidUserId(cleanUserId)) {
      setErrorMsg('Phone Number must be strictly 11 numeric digits (e.g. 017XXXXXXXX)');
      return;
    }

    if (!isValidPin(cleanPin)) {
      setErrorMsg('Security PIN must be strictly 4 numeric digits (e.g. 1234)');
      return;
    }

    setIsRecovering(true);
    try {
      const result = await recoverCloudBackup(cleanUserId, cleanPin);

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to recover cloud backup.');
      } else {
        setSuccessMsg(
          `🎉 ${t.auth.recoverSuccess || 'Cloud backup restored successfully!'} (${result.entryCount || 0} entries loaded)`
        );
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to Cloud Vault. Please check internet connection.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Handle Returning User Local Lock Screen Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setErrorMsg(null);

    if (!isValidPin(pinInput.trim())) {
      setErrorMsg('Please enter your 4-digit PIN.');
      return;
    }

    const success = await loginWithPin(pinInput.trim());
    if (!success) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPinInput('');

      if (nextAttempts >= 5) {
        setIsLockedOut(true);
        setErrorMsg(t.auth.lockedOut);
        setTimeout(() => {
          setIsLockedOut(false);
          setFailedAttempts(0);
        }, 15 * 60 * 1000);
      } else {
        setErrorMsg(`${t.auth.invalidPin} (${5 - nextAttempts} attempts left)`);
      }
    }
  };

  // Determine view mode
  const isSetupOrRecoveryView = isFirstSetup || showRecoveryOnLockScreen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 text-white animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 shadow-2xl rounded-3xl border border-white/20 backdrop-blur-2xl my-auto">
        {/* App Logo & Header */}
        <div className="text-center space-y-2 mb-5">
          <AppLogo variant="stacked" size="xl" animated={true} />
          <p className="text-xs sm:text-sm font-semibold text-blue-200/80">
            {isSetupOrRecoveryView
              ? activeTab === 'setup'
                ? 'Initial Account & Cloud Security Setup'
                : t.auth.loginTitle || t.auth.recoverTitle || 'Account Login'
              : t.auth.welcomeSubtitle}
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isSetupOrRecoveryView ? (
          <div>
            {/* Top Navigation Tabs: New Setup vs Login */}
            <div className="grid grid-cols-2 p-1 mb-5 rounded-2xl bg-white/10 border border-white/15 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('setup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'setup'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.auth.newAccountTab || 'New Setup'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('recover');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'recover'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200/70 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.auth.loginTab || t.auth.recoverBackupTab || 'Login'}</span>
              </button>
            </div>

            {/* TAB 1: NEW ACCOUNT SETUP FORM */}
            {activeTab === 'setup' && (
              <form onSubmit={handleSetup} className="space-y-4 animate-fade-in">
                {/* Field 1: 11-digit Phone Number as User ID */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    11-Digit Phone Number (User ID)
                  </label>
                  <div className="relative flex items-center">
                    <Smartphone className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-blue-200/70 mt-1">
                    Serves as your unique account identifier for cloud backup vault
                  </p>
                </div>

                {/* Field 2: 4-digit Security PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 p-1 text-blue-300 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Confirm 4-digit PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    Confirm 4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <ShieldCheck className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Field 4: Username */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    Account Name / Title
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. Admin / Daily Cash Book"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                {/* Central Cloud Storage Notice Card */}
                <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-400/25 text-xs text-blue-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-200">
                    <Cloud className="w-4 h-4 text-cyan-300" />
                    <span>Centralized Cloud Backup Ready</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-200/80">
                    Completing setup automatically creates your cloud backup folder on Google Drive (<code className="font-mono bg-black/30 px-1 py-0.5 rounded text-cyan-200">DailyHishab_Central_Backups/{userIdInput || '017XXXXXXXX'}</code>).
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-500 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 active:scale-98 transition-all cursor-pointer mt-2"
                >
                  Complete Setup & Initialize Cloud Storage
                </button>

                {!isFirstSetup && (
                  <button
                    type="button"
                    onClick={() => setShowRecoveryOnLockScreen(false)}
                    className="w-full mt-2 py-2 text-xs text-blue-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to PIN Unlock</span>
                  </button>
                )}
              </form>
            )}

            {/* TAB 2: LOGIN WITH PHONE & PIN */}
            {activeTab === 'recover' && (
              <form onSubmit={handleCloudRecovery} className="space-y-4 animate-fade-in">
                {/* Information Callout */}
                <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-xs text-indigo-100 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-200">
                    <LogIn className="w-4 h-4 text-cyan-300 shrink-0" />
                    <span>{t.auth.loginTitle || t.auth.recoverTitle || 'Account Login'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-indigo-200/90">
                    {t.auth.recoverSubtitle ||
                      'Enter your 11-digit Phone Number and 4-digit Security PIN to log in and restore your financial ledger.'}
                  </p>
                </div>

                {/* Field 1: Phone Number (11 Digits) */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    11-Digit Phone Number (User ID)
                  </label>
                  <div className="relative flex items-center">
                    <Smartphone className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={recoverUserId}
                      onChange={(e) => setRecoverUserId(e.target.value.replace(/\D/g, ''))}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>

                {/* Field 2: 4-Digit Security PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-blue-100 uppercase tracking-wider mb-1">
                    4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-blue-300" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={recoverPin}
                      onChange={(e) => setRecoverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 p-1 text-blue-300 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isRecovering ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>{t.auth.recovering || 'Logging in...'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-white" />
                      <span>{t.auth.loginBtn || t.auth.recoverBtn || 'Login & Restore Ledger'}</span>
                    </>
                  )}
                </button>

                {!isFirstSetup && (
                  <button
                    type="button"
                    onClick={() => setShowRecoveryOnLockScreen(false)}
                    className="w-full mt-2 py-2 text-xs text-blue-300 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to PIN Unlock</span>
                  </button>
                )}
              </form>
            )}
          </div>
        ) : (
          /* Returning User Unlock Form */
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-center space-y-1">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-200">
                {userProfile.username}
              </span>
              <p className="text-[11px] font-mono font-bold text-blue-300/80">
                User ID: {userProfile.userId || '01712345678'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider text-center mb-2">
                Enter 4-Digit Security PIN
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-blue-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  required
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-xl font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 p-1 text-blue-300 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {t.auth.login}
            </button>

            {/* Link to login with phone & PIN from cloud if user wants to switch account/device */}
            <div className="text-center pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryOnLockScreen(true);
                  setActiveTab('recover');
                  setErrorMsg(null);
                }}
                className="text-xs text-cyan-300 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t.auth.recoverFromCloudLink || 'Login with Phone Number & PIN'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
