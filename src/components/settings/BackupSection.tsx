import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  createBackupObject,
  restoreFromBackupObject,
  hashPin,
  getContinuousOfflineBackup,
  restoreFromBackupObject as restoreSnapshot,
  triggerAutoBackupSequence,
} from '../../utils/storage';
import {
  Download,
  Upload,
  Trash2,
  Database,
  ShieldAlert,
  Cloud,
  HardDrive,
  CloudOff,
  CheckCircle2,
  RefreshCw,
  HardDriveDownload,
  Activity,
} from 'lucide-react';
import { BackupMode } from '../../types/user.types';

export const BackupSection: React.FC = () => {
  const { userProfile, updateUserProfile, clearAllData, reloadState, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [pinConfirmInput, setPinConfirmInput] = useState<string>('');
  const [clearErrorMsg, setClearErrorMsg] = useState<string | null>(null);

  const [restoreStatusMsg, setRestoreStatusMsg] = useState<string | null>(null);

  const currentMode: BackupMode = userProfile.backupMode || 'both';
  const offlineAutoBackup = userProfile.offlineAutoBackup !== false;
  const onlineAutoBackup = userProfile.onlineAutoBackup !== false;

  const continuousBackupSnapshot = getContinuousOfflineBackup();

  const handleSelectMode = (mode: BackupMode) => {
    updateUserProfile({ backupMode: mode });
  };

  const handleToggleOfflineAutoBackup = () => {
    updateUserProfile({ offlineAutoBackup: !offlineAutoBackup });
  };

  const handleToggleOnlineAutoBackup = () => {
    updateUserProfile({ onlineAutoBackup: !onlineAutoBackup });
  };

  // Download JSON Backup File to Device Storage
  const handleDownloadBackup = () => {
    const backupObj = createBackupObject();
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `DailyHishab_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setRestoreStatusMsg(t.settings.backup.backupSuccess);
    setTimeout(() => setRestoreStatusMsg(null), 3500);
  };

  // Restore JSON Backup File from Device
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const ok = restoreFromBackupObject(parsed);
        if (ok) {
          reloadState();
          setRestoreStatusMsg(t.settings.backup.restoredSuccess);
          setTimeout(() => setRestoreStatusMsg(null), 3500);
        } else {
          alert(t.settings.backup.invalidBackup);
        }
      } catch (err) {
        alert(t.settings.backup.invalidBackup);
      }
    };
    reader.readAsText(file);
  };

  // Restore from Continuous Offline Local Snapshot
  const handleRestoreSnapshot = () => {
    if (!continuousBackupSnapshot) return;
    if (window.confirm('Restore ledger data from the latest continuous local snapshot?')) {
      const ok = restoreFromBackupObject(continuousBackupSnapshot);
      if (ok) {
        reloadState();
        setRestoreStatusMsg(t.settings.backup.restoredSuccess);
        setTimeout(() => setRestoreStatusMsg(null), 3500);
      }
    }
  };

  // Force trigger manual backup refresh
  const handleTriggerManualBackup = () => {
    triggerAutoBackupSequence(userProfile);
    setRestoreStatusMsg('Continuous backup triggered successfully!');
    setTimeout(() => setRestoreStatusMsg(null), 3000);
  };

  // Confirm Clear All Data with PIN
  const handleConfirmClearAll = async () => {
    setClearErrorMsg(null);
    const inputHash = await hashPin(pinConfirmInput);
    if (inputHash !== userProfile.pinHash) {
      setClearErrorMsg(t.auth.invalidPin);
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
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2>{t.settings.backup.title}</h2>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {t.settings.backup.modeSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTriggerManualBackup}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Trigger immediate continuous backup"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Now</span>
        </button>
      </div>

      {restoreStatusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{restoreStatusMsg}</span>
        </div>
      )}

      {/* Part 1: Backup Facility Mode Selector Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          {t.settings.backup.modeTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option A: Both Online & Offline */}
          <button
            type="button"
            onClick={() => handleSelectMode('both')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentMode === 'both'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">{t.settings.backup.modeBoth}</span>
              </div>
              {currentMode === 'both' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              {t.settings.backup.modeBothDesc}
            </p>
          </button>

          {/* Option B: Online Only (Google Drive) */}
          <button
            type="button"
            onClick={() => handleSelectMode('online')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentMode === 'online'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-600 text-white">
                  <Cloud className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">{t.settings.backup.modeOnline}</span>
              </div>
              {currentMode === 'online' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              {t.settings.backup.modeOnlineDesc}
            </p>
          </button>

          {/* Option C: Offline Only (Device Storage) */}
          <button
            type="button"
            onClick={() => handleSelectMode('offline')}
            className={`p-4 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer relative ${
              currentMode === 'offline'
                ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30 font-bold shadow-md'
                : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-sm font-extrabold">{t.settings.backup.modeOffline}</span>
              </div>
              {currentMode === 'offline' && (
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] font-normal leading-relaxed opacity-80">
              {t.settings.backup.modeOfflineDesc}
            </p>
          </button>
        </div>
      </div>

      {/* Part 2: Continuous Auto-Backup Toggles */}
      <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>Continuous Auto-Backup Safety Settings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Offline Continuous Toggle */}
          {(currentMode === 'both' || currentMode === 'offline') && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800">
              <div>
                <span className="block text-xs font-bold text-gray-900 dark:text-white">
                  {t.settings.backup.continuousOfflineTitle}
                </span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Save snapshot on every entry change
                </span>
              </div>
              <input
                type="checkbox"
                checked={offlineAutoBackup}
                onChange={handleToggleOfflineAutoBackup}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>
          )}

          {/* Online Continuous Toggle */}
          {(currentMode === 'both' || currentMode === 'online') && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800">
              <div>
                <span className="block text-xs font-bold text-gray-900 dark:text-white">
                  Google Drive Auto-Sync
                </span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Sync cloud backup on every entry input
                </span>
              </div>
              <input
                type="checkbox"
                checked={onlineAutoBackup}
                onChange={handleToggleOnlineAutoBackup}
                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
              />
            </div>
          )}
        </div>

        {/* Snapshot Status Banner */}
        {continuousBackupSnapshot && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {t.settings.backup.lastOfflineSnapshot}{' '}
                {new Date(
                  continuousBackupSnapshot.autoBackupTimestamp || continuousBackupSnapshot.timestamp
                ).toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRestoreSnapshot}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] active:scale-95 transition-all shadow cursor-pointer"
            >
              {t.settings.backup.restoreSnapshotBtn}
            </button>
          </div>
        )}
      </div>

      {/* Part 3: Device Storage File Export / Import Actions */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          Device Storage Backup File (.JSON)
        </h3>

        <div className="flex flex-wrap gap-3">
          {/* Export to Device Storage */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>{t.settings.backup.exportDeviceBtn}</span>
          </button>

          {/* Import from Device Storage */}
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
            <span>{t.settings.backup.importDeviceBtn}</span>
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
          <span>{t.settings.backup.clearAllData}</span>
        </button>
      </div>

      {/* Clear Data PIN Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel p-6 shadow-2xl rounded-3xl space-y-4 border border-rose-500/30">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <span>{t.settings.backup.clearAllData}</span>
            </div>

            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 leading-relaxed">
              {t.settings.backup.clearWarning}
            </p>

            {clearErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                {clearErrorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                {t.settings.backup.confirmClear}
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
                {t.common.delete}
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
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
