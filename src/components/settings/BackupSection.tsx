import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  createBackupObject,
  restoreFromBackupObject,
  hashPin,
  getContinuousOfflineBackup,
  triggerAutoBackupSequence,
  isValidUserId,
  isValidPin,
} from '../../utils/storage';
import {
  Download,
  Upload,
  Trash2,
  Database,
  ShieldAlert,
  Cloud,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  HardDriveDownload,
  Activity,
  Smartphone,
  KeyRound,
  UserCheck,
  Edit3,
  Lock,
  ArrowRight,
  GitMerge,
  RotateCcw,
} from 'lucide-react';
import { BackupStorageMode } from '../../types/user.types';

export const BackupSection: React.FC = () => {
  const { userProfile, updateUserProfile, clearAllData, reloadState, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [pinConfirmInput, setPinConfirmInput] = useState<string>('');
  const [clearErrorMsg, setClearErrorMsg] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // User ID edit state
  const [isEditingUserId, setIsEditingUserId] = useState<boolean>(false);
  const [newUserIdInput, setNewUserIdInput] = useState<string>(userProfile.userId || '01712345678');
  const [userIdError, setUserIdError] = useState<string | null>(null);
  const [isSavingUserId, setIsSavingUserId] = useState<boolean>(false);

  // PIN edit state
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>(userProfile.pin || '1234');
  const [pinError, setPinError] = useState<string | null>(null);

  // Cross-device Sync state
  const [syncUserIdInput, setSyncUserIdInput] = useState<string>(userProfile.userId || '01712345678');
  const [syncPinInput, setSyncPinInput] = useState<string>(userProfile.pin || '1234');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const currentStorageMode: BackupStorageMode = userProfile.backupStorageMode || 'both';
  const continuousBackupSnapshot = getContinuousOfflineBackup();

  const handleSelectMode = (mode: BackupStorageMode) => {
    updateUserProfile({ backupStorageMode: mode, backupMode: mode });
    setStatusMsg({ text: `Backup mode updated to ${mode.toUpperCase()}`, type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
    triggerAutoBackupSequence({ ...userProfile, backupStorageMode: mode });
  };

  // Change 11-digit User ID and rename backend folder
  const handleSaveUserId = async () => {
    setUserIdError(null);
    const trimmed = newUserIdInput.trim();

    if (!isValidUserId(trimmed)) {
      setUserIdError('User ID must be strictly 11 numeric digits (e.g. 01712345678)');
      return;
    }

    setIsSavingUserId(true);
    try {
      const oldUserId = userProfile.userId || '01712345678';
      const res = await fetch('/api/central-backup/change-userid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUserId,
          newUserId: trimmed,
          pin: userProfile.pin || '1234',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateUserProfile({ userId: trimmed });
        setIsEditingUserId(false);
        setStatusMsg({ text: 'User ID updated & backend cloud folder renamed successfully!', type: 'success' });
        setTimeout(() => setStatusMsg(null), 4000);
        // Trigger backup to new folder
        triggerAutoBackupSequence({ ...userProfile, userId: trimmed });
      } else {
        setUserIdError(data.error || 'Failed to update User ID on backend');
      }
    } catch (err: any) {
      setUserIdError('Network error while renaming backend folder.');
    } finally {
      setIsSavingUserId(false);
    }
  };

  // Change 4-digit Security PIN
  const handleSavePin = () => {
    setPinError(null);
    const trimmed = newPinInput.trim();

    if (!isValidPin(trimmed)) {
      setPinError('PIN must be strictly 4 numeric digits (e.g. 1234)');
      return;
    }

    updateUserProfile({ pin: trimmed });
    setIsEditingPin(false);
    setStatusMsg({ text: '4-Digit Security PIN updated successfully!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
    triggerAutoBackupSequence({ ...userProfile, pin: trimmed });
  };

  // Cross-device Restore (Replace vs Merge)
  const handleCrossDeviceRestore = async (restoreMode: 'replace' | 'merge') => {
    setSyncError(null);
    const cleanId = syncUserIdInput.trim();
    const cleanPin = syncPinInput.trim();

    if (!isValidUserId(cleanId)) {
      setSyncError('User ID must be strictly 11 numeric digits (e.g. 017XXXXXXXX)');
      return;
    }

    if (!isValidPin(cleanPin)) {
      setSyncError('Security PIN must be strictly 4 numeric digits (e.g. 1234)');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/central-backup/verify-and-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanId, pin: cleanPin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSyncError(data.error || 'Failed to verify or restore cloud backup');
        return;
      }

      if (data.backupData) {
        const ok = restoreFromBackupObject(data.backupData, { mode: restoreMode });
        if (ok) {
          updateUserProfile({ userId: cleanId, pin: cleanPin });
          reloadState();
          setStatusMsg({
            text: `Successfully restored cloud data (${restoreMode === 'merge' ? 'Merged with local entries' : 'Replaced local ledger'})!`,
            type: 'success',
          });
          setTimeout(() => setStatusMsg(null), 4000);
        } else {
          setSyncError('Cloud backup payload structure was invalid.');
        }
      }
    } catch (err: any) {
      setSyncError('Network error connecting to Cloud Storage Vault.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Immediate Manual Sync
  const handleTriggerManualBackup = () => {
    triggerAutoBackupSequence(userProfile);
    setStatusMsg({ text: 'Cloud & Local Auto-Backup triggered successfully!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Download JSON Backup File to Device Storage
  const handleDownloadBackup = () => {
    const backupObj = createBackupObject();
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `DailyHishab_Backup_${userProfile.userId || '01712345678'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMsg({ text: 'Downloaded backup file to device storage!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Restore JSON Backup File from Device
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const ok = restoreFromBackupObject(parsed, { mode: 'replace' });
        if (ok) {
          reloadState();
          setStatusMsg({ text: 'Successfully restored data from JSON backup file!', type: 'success' });
          setTimeout(() => setStatusMsg(null), 3500);
        } else {
          alert('Invalid backup file structure.');
        }
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Clear All Data with PIN
  const handleConfirmClearAll = async () => {
    setClearErrorMsg(null);
    const inputHash = await hashPin(pinConfirmInput);
    if (inputHash !== userProfile.pinHash) {
      setClearErrorMsg('Incorrect PIN entered.');
      return;
    }

    clearAllData();
    setIsClearModalOpen(false);
    setPinConfirmInput('');
    alert('All data has been wiped successfully.');
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2>Cloud & Local Storage Backup</h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Automatic simultaneous data backup per 11-digit User ID
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerManualBackup}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Trigger immediate backup sync"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Backup Now</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold animate-fade-in flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Part 1: Backup Storage Mode Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Storage & Backup Destination Mode
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Choice A: Both Cloud + Local */}
          <button
            type="button"
            onClick={() => handleSelectMode('both')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentStorageMode === 'both'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">Both (Cloud + Local)</span>
              </div>
              {currentStorageMode === 'both' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              Simultaneous automatic backup to central cloud storage & offline local device storage.
            </p>
          </button>

          {/* Choice B: Cloud Storage Only */}
          <button
            type="button"
            onClick={() => handleSelectMode('cloud')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentStorageMode === 'cloud'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-600 text-white">
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">Cloud Storage Only</span>
              </div>
              {currentStorageMode === 'cloud' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              Automatic backup to central cloud folder designated for your 11-digit User ID.
            </p>
          </button>

          {/* Choice C: Local Device Storage Only */}
          <button
            type="button"
            onClick={() => handleSelectMode('local')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentStorageMode === 'local'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">Local Device Only</span>
              </div>
              {currentStorageMode === 'local' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              Keep ledger data strictly on this device without network transmission.
            </p>
          </button>
        </div>
      </div>

      {/* Part 2: 11-Digit User ID & 4-Digit Security PIN Credentials */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-teal-500/10 border border-blue-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Cloud Backup Credentials
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Identifies your unique cloud backup folder across all your devices
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
            Strict 11-Digit ID & PIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: 11-Digit User ID / Phone Number */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                11-Digit User ID / Phone
              </span>
              {!isEditingUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setNewUserIdInput(userProfile.userId || '01712345678');
                    setIsEditingUserId(true);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              )}
            </div>

            {!isEditingUserId ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-black text-gray-900 dark:text-white tracking-widest">
                  {userProfile.userId || '01712345678'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Verified 11-Digit
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  maxLength={11}
                  value={newUserIdInput}
                  onChange={(e) => setNewUserIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-500 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none"
                />
                {userIdError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{userIdError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveUserId}
                    disabled={isSavingUserId}
                    className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow cursor-pointer disabled:opacity-50"
                  >
                    {isSavingUserId ? 'Renaming Folder...' : 'Save & Rename Folder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUserId(false);
                      setUserIdError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card B: 4-Digit Security PIN */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Default 4-Digit Security PIN
              </span>
              {!isEditingPin && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPinInput(userProfile.pin || '1234');
                    setIsEditingPin(true);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change PIN</span>
                </button>
              )}
            </div>

            {!isEditingPin ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-black text-gray-900 dark:text-white tracking-widest">
                  {userProfile.pin || '1234'}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Default 1234
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none"
                />
                {pinError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{pinError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow cursor-pointer"
                  >
                    Save PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPin(false);
                      setPinError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
          💡 <strong>Backend Folder Management:</strong> On the developer's server, a folder named with your 11-digit User ID (e.g. <code className="font-mono bg-white/60 dark:bg-slate-900/60 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-700">{userProfile.userId || '01712345678'}</code>) is maintained. Changing your User ID automatically updates and renames the folder on the cloud server.
        </p>
      </div>

      {/* Part 3: Cross-Device Sync & Restore */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-4 border border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Use App on Different Devices (Seamless Sync)
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Enter your 11-digit User ID and PIN on any phone or laptop to sync your ledger data.
            </p>
          </div>
        </div>

        {syncError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {syncError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1">
              11-Digit User ID / Phone Number
            </label>
            <input
              type="text"
              maxLength={11}
              value={syncUserIdInput}
              onChange={(e) => setSyncUserIdInput(e.target.value.replace(/\D/g, ''))}
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1">
              4-Digit Security PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={syncPinInput}
              onChange={(e) => setSyncPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Default Restore & Replace */}
          <button
            type="button"
            onClick={() => handleCrossDeviceRestore('replace')}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isSyncing ? 'Verifying & Syncing...' : 'Restore & Replace Local Ledger (Default)'}</span>
          </button>

          {/* Offer Merge Option */}
          <button
            type="button"
            onClick={() => handleCrossDeviceRestore('merge')}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <GitMerge className="w-4 h-4" />
            <span>{isSyncing ? 'Syncing...' : 'Restore & Merge with Existing Entries'}</span>
          </button>
        </div>
      </div>

      {/* Part 4: Auto-Backup Status & Device File Actions */}
      <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Continuous Auto-Backup Safety Status</span>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
          ⚡ <strong>Auto-Trigger Active:</strong> Cloud backup is automatically sent to your 11-digit User ID folder every time you add, edit, or delete an income or expense entry.
        </div>

        {userProfile.lastCloudBackupTime && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Last Cloud Backup: {new Date(userProfile.lastCloudBackupTime).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Device JSON Export / Import */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Device Storage Backup File (.JSON)
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>Download .JSON to Phone / PC</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleRestoreFile}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import .JSON File</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear All Data */}
      <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Wipe All Local App Data</span>
        </button>
      </div>

      {/* Clear Data PIN Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel p-6 shadow-2xl rounded-3xl space-y-4 border border-rose-500/30">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <span>Wipe All Local App Data</span>
            </div>

            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 leading-relaxed">
              This action will delete all local transactions, entries, and settings on this device. Enter your PIN to confirm.
            </p>

            {clearErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                {clearErrorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Security PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinConfirmInput}
                onChange={(e) => setPinConfirmInput(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-center font-bold tracking-widest text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsClearModalOpen(false);
                  setPinConfirmInput('');
                  setClearErrorMsg(null);
                }}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-sm rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
