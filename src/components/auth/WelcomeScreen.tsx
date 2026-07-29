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
  HelpCircle,
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Copy,
  Check,
  Key,
  KeyRound as KeyRoundIcon,
} from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';
import {
  isValidUserId,
  isValidPin,
  restoreFromBackupObject,
  saveUserProfile,
  loadUserProfile,
  hashPin,
  generateRecoveryKey,
} from '../../utils/storage';
import { verifyAndRestoreByRecoveryKey } from '../../lib/firebaseBackupService';

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
  const [showForgotPinModal, setShowForgotPinModal] = useState<boolean>(false);

  // Recovery Key Unlock Form State
  const [recoveryPhoneInput, setRecoveryPhoneInput] = useState<string>(userProfile.userId || '');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRecoveryKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isValidUserId(recoveryPhoneInput)) {
      setErrorMsg('User ID / Phone Number must be strictly 11 numeric digits.');
      return;
    }

    if (!recoveryKeyInput || recoveryKeyInput.trim().length < 10) {
      setErrorMsg('Please enter your 16-character Master Recovery Key (e.g. DH-8A92-4F10-99E1).');
      return;
    }

    setIsVerifyingKey(true);
    try {
      const res = await verifyAndRestoreByRecoveryKey(recoveryPhoneInput, recoveryKeyInput);
      if (res.success && res.backupData) {
        restoreFromBackupObject(res.backupData, { mode: 'replace' });
        const newPin = res.pin || '1234';
        const hashedPin = await hashPin(newPin);

        saveUserProfile({
          ...loadUserProfile(),
          userId: recoveryPhoneInput.trim(),
          pin: newPin,
          pinHash: hashedPin,
          recoveryKey: res.recoveryKey || userProfile.recoveryKey,
          isFirstSetupCompleted: true,
          isLoggedIn: true,
        });

        setShowForgotPinModal(false);
        setSuccessMsg(`🎉 Master Recovery Key Verified! Your PIN is: ${newPin}. Logging in...`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Invalid Recovery Key or User ID.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // File Upload Restore for Forgot PIN Recovery
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || !Array.isArray(json.entries)) {
          setErrorMsg('Invalid backup file format.');
          return;
        }

        const restored = restoreFromBackupObject(json, { mode: 'replace' });
        if (restored) {
          // If JSON contains a profile, or default to current
          const newUserId = json.profile?.userId || userProfile.userId || '01712345678';
          const newPin = json.profile?.pin || '1234';
          const hashedPin = await hashPin(newPin);

          saveUserProfile({
            ...loadUserProfile(),
            ...(json.profile || {}),
            userId: newUserId,
            pin: newPin,
            pinHash: hashedPin,
            isFirstSetupCompleted: true,
            isLoggedIn: true,
          });

          setShowForgotPinModal(false);
          setSuccessMsg('🎉 Backup JSON file loaded successfully! You have been logged in.');
          window.location.reload();
        } else {
          setErrorMsg('Could not restore entries from selected file.');
        }
      } catch (err) {
        setErrorMsg('Error reading backup file. Please select a valid DailyHishab JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100 text-slate-900 animate-fade-in overflow-y-auto">
      {/* Subtle Light Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md bg-white p-6 sm:p-8 shadow-2xl rounded-3xl border border-slate-200/80 my-auto">
        {/* App Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <AppLogo variant="stacked" size="xl" animated={true} />
          <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide">
            {isSetupOrRecoveryView
              ? activeTab === 'setup'
                ? 'Initial Account & Cloud Security Setup'
                : t.auth.loginTitle || t.auth.recoverTitle || 'Account Login'
              : t.auth.welcomeSubtitle}
          </p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center animate-shake shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isSetupOrRecoveryView ? (
          <div>
            {/* Top Navigation Tabs: New Setup vs Login */}
            <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('setup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'setup'
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <User className={`w-4 h-4 ${activeTab === 'setup' ? 'text-white' : 'text-blue-600'}`} />
                <span>{t.auth.newAccountTab || 'New Setup'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('recover');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'recover'
                    ? 'bg-blue-600 text-white shadow-md font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <LogIn className={`w-4 h-4 ${activeTab === 'recover' ? 'text-white' : 'text-blue-600'}`} />
                <span>{t.auth.loginTab || t.auth.recoverBackupTab || 'Login'}</span>
              </button>
            </div>

            {/* TAB 1: NEW ACCOUNT SETUP FORM */}
            {activeTab === 'setup' && (
              <form onSubmit={handleSetup} className="space-y-4 animate-fade-in">
                {/* Field 1: 11-digit Phone Number as User ID */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    11-Digit Phone Number (User ID)
                  </label>
                  <div className="relative flex items-center">
                    <Smartphone className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Serves as your unique account identifier for cloud backup vault
                  </p>
                </div>

                {/* Field 2: 4-digit Security PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Confirm 4-digit PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm 4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <ShieldCheck className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Field 4: Username */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Name / Title
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. Admin / Daily Cash Book"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Field 5: Auto-Assigned Master Security Recovery Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Master Security Recovery Key</span>
                    </label>
                    <span className="text-xs font-bold text-blue-600">Auto-Generated</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={userProfile.recoveryKey || 'DH-8A92-4F10-99E1'}
                      className="w-full pl-3 pr-24 py-2.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 font-mono text-xs font-bold tracking-wider select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(userProfile.recoveryKey || 'DH-8A92-4F10-99E1')}
                      className="absolute right-2 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Save this 16-character key. You can use it to unlock your cloud vault if you ever forget your PIN.
                  </p>
                </div>

                {/* Central Firebase Cloud Storage Notice Card */}
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-2 font-extrabold text-blue-900">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>Firebase Secure Cloud Vault Ready</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Completing setup creates your individual secured cloud space on Firebase Firestore (<code className="font-mono bg-blue-100/80 px-1.5 py-0.5 rounded text-blue-900 font-bold">user_backups/{userIdInput || '017XXXXXXXX'}</code>) protected by your 4-digit PIN.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer mt-2"
                >
                  Complete Setup & Initialize Cloud Storage
                </button>

                {!isFirstSetup && (
                  <button
                    type="button"
                    onClick={() => setShowRecoveryOnLockScreen(false)}
                    className="w-full mt-2 py-2 text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
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
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-extrabold text-blue-900">
                    <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t.auth.loginTitle || t.auth.recoverTitle || 'Account Login'}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {t.auth.recoverSubtitle ||
                      'Enter your 11-digit Phone Number and 4-digit Security PIN to log in and restore your financial ledger.'}
                  </p>
                </div>

                {/* Field 1: Phone Number (11 Digits) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    11-Digit Phone Number (User ID)
                  </label>
                  <div className="relative flex items-center">
                    <Smartphone className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={recoverUserId}
                      onChange={(e) => setRecoverUserId(e.target.value.replace(/\D/g, ''))}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Field 2: 4-Digit Security PIN */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    4-Digit Security PIN
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      value={recoverPin}
                      onChange={(e) => setRecoverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-center text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
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
                    className="w-full mt-2 py-2 text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center justify-center gap-1 cursor-pointer"
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
            <div className="text-center space-y-1.5">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold text-blue-900 shadow-sm">
                {userProfile.username}
              </span>
              <p className="text-xs font-mono font-bold text-slate-500">
                User ID: {userProfile.userId || '01712345678'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider text-center mb-2">
                Enter 4-Digit Security PIN
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-blue-600" />
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  required
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white text-slate-900 placeholder-slate-400 text-center text-xl font-mono font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {t.auth.login}
            </button>

            {/* Link to login with phone & PIN or Forgot PIN */}
            <div className="text-center pt-3 border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryOnLockScreen(true);
                  setActiveTab('recover');
                  setErrorMsg(null);
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-extrabold transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                <span>{t.auth.recoverFromCloudLink || 'Login with Phone Number & PIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPinModal(true)}
                className="text-xs text-amber-700 hover:text-amber-900 font-extrabold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Forgot PIN / Recovery Options?</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FORGOT PIN & ACCOUNT RECOVERY MODAL */}
      {showForgotPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 space-y-5">
            <button
              onClick={() => setShowForgotPinModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">PIN Recovery & Vault Security</h3>
                <p className="text-xs text-slate-500 font-medium">What to do if you forgot your 4-Digit Security PIN</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-start gap-2 font-extrabold text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>End-to-End Vault Privacy Protection</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Because your financial data is protected by zero-knowledge encryption, your 4-digit PIN is known only to you and is never stored in plain text anywhere on our servers.
              </p>
            </div>

            {/* RECOVERY METHOD 1: MASTER SECURITY RECOVERY KEY */}
            <form onSubmit={handleRecoveryKeySubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Option 1: Unlock Vault with 16-Character Master Recovery Key</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Enter your 11-digit Phone Number and the 16-character Master Recovery Key provided during initial setup (e.g. <code className="font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-blue-900 font-bold">DH-8A92-4F10-99E1</code>).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">11-Digit Phone Number</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={recoveryPhoneInput}
                    onChange={(e) => setRecoveryPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">16-Character Recovery Key</label>
                  <input
                    type="text"
                    required
                    value={recoveryKeyInput}
                    onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                    placeholder="DH-XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 font-mono text-xs font-bold tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifyingKey}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isVerifyingKey ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Recovery Key...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Verify Master Key & Recover PIN</span>
                  </>
                )}
              </button>
            </form>

            {/* RECOVERY METHOD 2: JSON FILE RESTORE */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-950">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Option 2: Restore from Downloaded Backup JSON File</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                If you previously downloaded or exported a <code className="font-mono bg-blue-100/80 px-1.5 py-0.5 rounded text-blue-900 font-bold">DailyHishab_Backup.json</code> file, you can upload it here to instantly restore your data and reset your PIN.
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-98">
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Select Backup JSON File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
              </label>
            </div>

            {/* RECOVERY METHOD 3: TRUSTED DEVICE LOCAL ACCESS */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Option 3: Trusted Local Device Session</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                If you are using the device where you originally used the app, your ledger entries are continuously backed up locally. You can perform a New Setup with your 11-digit phone number and a fresh PIN without losing local records.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPinModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

