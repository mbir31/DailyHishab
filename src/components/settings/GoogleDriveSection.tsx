import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { createBackupObject, restoreFromBackupObject, hashPin } from '../../utils/storage';
import { googleSignIn } from '../../lib/firebaseAuth';
import {
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  FileJson,
  X,
  Sparkles,
} from 'lucide-react';

interface DriveUser {
  email: string;
  name: string;
  picture?: string;
}

interface BackupFileItem {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export const GoogleDriveSection: React.FC = () => {
  const { userProfile, reloadState, t } = useApp();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(true);

  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [backupFiles, setBackupFiles] = useState<BackupFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Check Drive Connection Status
  const checkDriveStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/drive/status');
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        setDriveUser(data.user);
        setLastSync(data.lastSync);
        setAutoSync(data.autoSync);
      } else {
        setIsConnected(false);
        setDriveUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch Drive status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkDriveStatus();
  }, [checkDriveStatus]);

  // Listen for popup auth message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        checkDriveStatus();
        setStatusMsg({
          text: `Connected to ${event.data.email}`,
          type: 'success',
        });
        setTimeout(() => setStatusMsg(null), 4000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkDriveStatus]);

  // Initiate Google OAuth Connection via Firebase Sign-In popup with fallback to URL endpoint
  const handleConnectGoogle = async () => {
    try {
      setStatusMsg(null);
      // Attempt Firebase Google Sign-In popup with Drive scopes first
      try {
        const { user, accessToken } = await googleSignIn();
        if (accessToken) {
          const res = await fetch('/api/drive/connect-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken,
              user: {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              },
            }),
          });
          const data = await res.json();
          if (data.success) {
            checkDriveStatus();
            setStatusMsg({
              text: `Connected to ${user.email}`,
              type: 'success',
            });
            setTimeout(() => setStatusMsg(null), 4000);
            return;
          }
        }
      } catch (firebaseErr: any) {
        console.warn('Firebase sign-in popup bypassed or failed, trying server OAuth url:', firebaseErr);
      }

      // Fallback: Server-side OAuth redirect popup
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        const width = 520;
        const height = 650;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          data.url,
          'google_drive_auth',
          `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
        );
      } else {
        setStatusMsg({ text: data.error || 'Failed to connect to Google Drive', type: 'error' });
      }
    } catch (err: any) {
      console.error('Failed to initiate Google OAuth:', err);
      setStatusMsg({ text: 'Failed to connect to Google Drive', type: 'error' });
    }
  };

  // Disconnect Google Drive
  const handleDisconnect = async () => {
    try {
      await fetch('/api/drive/disconnect', { method: 'POST' });
      setIsConnected(false);
      setDriveUser(null);
      setStatusMsg({ text: 'Google Drive disconnected', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Failed to disconnect Drive:', err);
    }
  };

  // Manual Backup to Google Drive
  const handleBackupNow = async () => {
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const backupData = createBackupObject();
      const res = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastSync(data.modifiedTime);
        setStatusMsg({ text: t.settings.drive.syncSuccess, type: 'success' });
      } else {
        setStatusMsg({ text: data.error || t.settings.drive.syncing, type: 'error' });
      }
    } catch (err) {
      console.error('Drive backup failed:', err);
      setStatusMsg({ text: 'Backup failed. Check network connection.', type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // Fetch list of files for Restore Modal
  const handleOpenRestoreModal = async () => {
    setIsRestoreModalOpen(true);
    setIsLoadingFiles(true);
    setPinError(null);
    setConfirmPinInput('');
    setSelectedFileId(null);

    try {
      const res = await fetch('/api/drive/backups');
      const data = await res.json();
      if (data.files) {
        setBackupFiles(data.files);
        if (data.files.length > 0) {
          setSelectedFileId(data.files[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch backup files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Execute Restore from Drive with PIN
  const handleConfirmRestore = async () => {
    setPinError(null);
    const inputHash = await hashPin(confirmPinInput);
    if (inputHash !== userProfile.pinHash) {
      setPinError(t.auth.invalidPin);
      return;
    }

    try {
      setIsSyncing(true);
      const res = await fetch('/api/drive/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selectedFileId }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const ok = restoreFromBackupObject(data.data);
        if (ok) {
          reloadState();
          setIsRestoreModalOpen(false);
          setStatusMsg({ text: t.settings.drive.restoreSuccess, type: 'success' });
        } else {
          setPinError(t.settings.backup.invalidBackup);
        }
      } else {
        setPinError(data.error || 'Failed to download backup file');
      }
    } catch (err) {
      console.error('Failed to restore from Drive:', err);
      setPinError('Error restoring backup file');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Auto Sync
  const handleToggleAutoSync = async () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    try {
      await fetch('/api/drive/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSync: nextVal }),
      });
    } catch (err) {
      console.error('Failed to toggle auto sync:', err);
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <span>{t.settings.drive.title}</span>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {t.settings.drive.subtitle}
            </p>
          </div>
        </div>

        {isConnected && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active</span>
          </span>
        )}
      </div>

      {/* Status Notification Toast */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold animate-fade-in flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoadingStatus ? (
        <div className="flex items-center justify-center py-6 text-gray-400 gap-2 text-xs font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking Google Drive connection...</span>
        </div>
      ) : isConnected && driveUser ? (
        /* CONNECTED STATE */
        <div className="space-y-4">
          {/* Linked Account Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              {driveUser.picture ? (
                <img
                  src={driveUser.picture}
                  alt={driveUser.name}
                  className="w-10 h-10 rounded-full border-2 border-white/80 dark:border-gray-700 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {driveUser.name ? driveUser.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div>
                <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t.settings.drive.connectedAs}
                </span>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">
                  {driveUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title={t.settings.drive.disconnectBtn}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Sync Information */}
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center justify-between px-1">
            <span>{t.settings.drive.lastSyncLabel}</span>
            <span className="font-bold text-gray-900 dark:text-gray-200">
              {lastSync ? new Date(lastSync).toLocaleString() : t.settings.drive.neverSynced}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleBackupNow}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>{isSyncing ? t.settings.drive.syncing : t.settings.drive.backupNowBtn}</span>
            </button>

            <button
              onClick={handleOpenRestoreModal}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50"
            >
              <CloudDownload className="w-4 h-4" />
              <span>{t.settings.drive.restoreDriveBtn}</span>
            </button>
          </div>

          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mt-2">
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">
                {t.settings.drive.autoSyncTitle}
              </span>
              <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {t.settings.drive.autoSyncDesc}
              </span>
            </div>

            <button
              onClick={handleToggleAutoSync}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                autoSync ? 'bg-blue-600 justify-end' : 'bg-gray-300 dark:bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>
      ) : (
        /* DISCONNECTED STATE */
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <Cloud className="w-7 h-7" />
          </div>

          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {t.settings.drive.subtitle}
          </p>

          <button
            onClick={handleConnectGoogle}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.settings.drive.connectBtn}</span>
          </button>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl rounded-3xl space-y-4 border border-white/50 dark:border-white/10 relative">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <CloudDownload className="w-5 h-5 text-indigo-500" />
              <span>{t.settings.drive.selectBackupToRestore}</span>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                {pinError}
              </div>
            )}

            {isLoadingFiles ? (
              <div className="py-8 text-center text-gray-400 text-xs font-semibold flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Searching Google Drive for DailyHishab backups...</span>
              </div>
            ) : backupFiles.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-xs font-semibold">
                {t.settings.drive.noBackups}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {backupFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedFileId === file.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30'
                        : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-800 dark:text-gray-200 hover:bg-black/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileJson className="w-4 h-4 shrink-0 text-blue-500" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate">{file.name}</span>
                        <span className="block text-[10px] font-medium opacity-70">
                          {new Date(file.modifiedTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {backupFiles.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {t.settings.backup.confirmClear}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-center font-bold tracking-widest text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmRestore}
                    disabled={isSyncing || !selectedFileId}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSyncing ? t.common.loading : t.settings.drive.restoreDriveBtn}
                  </button>
                  <button
                    onClick={() => setIsRestoreModalOpen(false)}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm rounded-xl active:scale-95 transition-all"
                  >
                    {t.common.close}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
