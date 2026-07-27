import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, User, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react';
import { AppLogo } from '../brand/AppLogo';

export const WelcomeScreen: React.FC = () => {
  const { userProfile, loginWithPin, setupNewUser, t } = useApp();

  const isFirstSetup = !userProfile.isFirstSetupCompleted || !userProfile.pinHash;

  const [usernameInput, setUsernameInput] = useState<string>('Admin');
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!usernameInput.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }
    if (pinInput.length < 4 || pinInput.length > 6 || !/^\d+$/.test(pinInput)) {
      setErrorMsg('PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setErrorMsg(t.auth.pinMismatch);
      return;
    }

    await setupNewUser(usernameInput.trim(), pinInput);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setErrorMsg(null);

    if (pinInput.length < 4) {
      setErrorMsg(t.auth.invalidPin);
      return;
    }

    const success = await loginWithPin(pinInput);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 text-white animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 shadow-2xl rounded-3xl border border-white/20 backdrop-blur-2xl my-auto">
        {/* App Logo & Header */}
        <div className="text-center space-y-2 mb-8">
          <AppLogo variant="stacked" size="xl" animated={true} />
          <p className="text-xs sm:text-sm font-semibold text-blue-200/80">
            {t.auth.welcomeSubtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {isFirstSetup ? (
          /* First Time Account Setup Form */
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                {t.auth.username}
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-blue-300" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                {t.auth.pin}
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-blue-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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

            <div>
              <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                {t.auth.confirmPin}
              </label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3.5 w-4 h-4 text-blue-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 active:scale-98 transition-all cursor-pointer mt-2"
            >
              {t.auth.createAccount}
            </button>
          </form>
        ) : (
          /* Returning User Unlock Form */
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-200 mb-3">
                {userProfile.username}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider text-center mb-2">
                {t.auth.enterPin}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-blue-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  required
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
          </form>
        )}
      </div>
    </div>
  );
};
