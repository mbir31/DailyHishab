import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { hashPin } from '../../utils/storage';
import { ShieldCheck, KeyRound, UserCheck, X } from 'lucide-react';

interface AuthSettingsModalProps {
  type: 'username' | 'pin' | null;
  onClose: () => void;
}

export const AuthSettingsModal: React.FC<AuthSettingsModalProps> = ({ type, onClose }) => {
  const { userProfile, updateUserProfile, t } = useApp();

  const [usernameInput, setUsernameInput] = useState<string>(userProfile.username);
  
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!type) return null;

  const handleSaveUsername = () => {
    if (!usernameInput.trim()) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    updateUserProfile({ username: usernameInput.trim() });
    setSuccessMsg('Username updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSavePin = async () => {
    setErrorMsg(null);
    const oldHashed = await hashPin(oldPin);
    if (oldHashed !== userProfile.pinHash) {
      setErrorMsg('Current PIN is incorrect.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setErrorMsg('New PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg(t.auth.pinMismatch);
      return;
    }

    const newHashed = await hashPin(newPin);
    updateUserProfile({ pinHash: newHashed });
    setSuccessMsg('PIN code changed successfully!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel p-6 shadow-2xl rounded-3xl relative border border-white/50 dark:border-white/10 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          {type === 'username' ? (
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <KeyRound className="w-5 h-5 text-amber-500" />
          )}
          <span>
            {type === 'username' ? t.auth.changeUsernameTitle : t.auth.changePinTitle}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {type === 'username' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                {t.auth.username}
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleSaveUsername}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-md mt-2 cursor-pointer"
            >
              {t.auth.saveChanges}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                {t.auth.oldPin}
              </label>
              <input
                type="password"
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white tracking-widest text-center focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                {t.auth.newPin}
              </label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white tracking-widest text-center focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                {t.auth.confirmPin}
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white tracking-widest text-center focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleSavePin}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-md mt-2 cursor-pointer"
            >
              {t.auth.saveChanges}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
