import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Entry, EntryType } from '../types/entry.types';
import { UserProfile, Language, ThemeMode } from '../types/user.types';
import {
  loadUserProfile,
  saveUserProfile,
  hashPin,
  getEntriesForDate,
  saveEntriesForDate,
  clearAllAppData,
  loadAllEntriesSync,
  triggerAutoBackupSequence,
  restoreFromBackupObject,
  syncEntriesWithIDB,
} from '../utils/storage';
import { verifyAndRestoreUserBackupFromFirebase } from '../lib/firebaseBackupService';
import { getTodayDateString, shiftDateString } from '../utils/dateHelpers';
import { getTranslation } from '../i18n/translations';

export type ActiveTab = 'income' | 'expense' | 'accounts' | 'settings';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  shiftSelectedDate: (offsetDays: number) => void;
  
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
  // Auth
  loginWithPin: (pin: string) => Promise<boolean>;
  setupNewUser: (username: string, userId: string, pin: string) => Promise<boolean>;
  recoverCloudBackup: (userId: string, pin: string) => Promise<{ success: boolean; error?: string; entryCount?: number }>;
  lockApp: () => void;
  
  // Entries for selected date
  currentIncomeEntries: Entry[];
  currentExpenseEntries: Entry[];
  saveCurrentDateEntries: (type: EntryType, entries: Entry[]) => void;
  
  // Helpers
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedTime: number | null;
  triggerManualSync: (customUserId?: string, customPin?: string) => Promise<{ success: boolean; message?: string }>;
  t: ReturnType<typeof getTranslation>;
  reloadState: () => void;
  clearAllData: () => void;
  
  // PWA Prompt
  deferredPwaPrompt: any;
  installPwa: () => void;
  isPwaInstalled: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());
  const [activeTab, setActiveTab] = useState<ActiveTab>('income');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(null);
  
  const [currentIncomeEntries, setCurrentIncomeEntries] = useState<Entry[]>([]);
  const [currentExpenseEntries, setCurrentExpenseEntries] = useState<Entry[]>([]);

  // PWA deferred prompt
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Load entries when selected date or active tab changes
  const refreshEntriesForSelectedDate = useCallback(() => {
    const incomes = getEntriesForDate(selectedDate, 'income');
    const expenses = getEntriesForDate(selectedDate, 'expense');
    setCurrentIncomeEntries(incomes);
    setCurrentExpenseEntries(expenses);
  }, [selectedDate]);

  useEffect(() => {
    refreshEntriesForSelectedDate();
  }, [refreshEntriesForSelectedDate]);

  // Comprehensive Two-Way Instant Cloud Vault Synchronization Engine
  const syncCloudVault = useCallback(async (customUserId?: string, customPin?: string) => {
    const targetUserId = (customUserId || userProfile.userId || '').trim();
    const targetPin = (customPin || userProfile.pin || '').trim();

    if (!targetUserId || !targetPin || !userProfile.isFirstSetupCompleted) {
      return;
    }

    if (!navigator.onLine) {
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Fetch cloud vault backup from Firebase Firestore
      let cloudResult = await verifyAndRestoreUserBackupFromFirebase(targetUserId, targetPin);

      // 2. Fallback to Central Cloud Server endpoint if Firestore doc is not found or fails
      if (!cloudResult.success || !cloudResult.backupData) {
        try {
          const res = await fetch('/api/central-backup/verify-and-restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId, pin: targetPin }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.backupData) {
              cloudResult = { success: true, backupData: data.backupData };
            }
          }
        } catch (e) {
          // silent fallback
        }
      }

      if (cloudResult.success && cloudResult.backupData) {
        // Merge fetched cloud vault entries & notes into local device storage
        const didMerge = restoreFromBackupObject(cloudResult.backupData, { mode: 'merge' });
        if (didMerge) {
          refreshEntriesForSelectedDate();
        }
      }

      // Trigger push of local state (which is now merged with cloud) up to cloud vault
      triggerAutoBackupSequence(userProfile);
      setLastSyncedTime(Date.now());
    } catch (err) {
      console.warn('Instant cloud sync fetch warning:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [userProfile, refreshEntriesForSelectedDate]);

  const triggerManualSync = useCallback(async (customUserId?: string, customPin?: string): Promise<{ success: boolean; message?: string }> => {
    if (!navigator.onLine) {
      return {
        success: false,
        message: userProfile.language === 'bn' ? 'অফলাইন! সিঙ্ক করতে ইন্টারনেট সংযোগ চালু করুন।' : 'Offline! Please connect to internet to sync.',
      };
    }
    const idToUse = (customUserId || userProfile.userId || '').trim();
    const pinToUse = (customPin || userProfile.pin || '').trim();
    if (!idToUse || !pinToUse) {
      return {
        success: false,
        message: userProfile.language === 'bn' ? 'ইউজার আইডি বা পিন যুক্ত নেই।' : 'No User ID or PIN assigned.',
      };
    }

    await syncCloudVault(idToUse, pinToUse);
    return {
      success: true,
      message: userProfile.language === 'bn' ? 'ক্লাউড ভল্ট সিঙ্ক সফলভাবে সম্পন্ন হয়েছে!' : 'Cloud vault synced successfully!',
    };
  }, [navigator.onLine, userProfile, syncCloudVault]);

  // Network online listener & automatic cloud sync engine
  useEffect(() => {
    // Zero-loss sync: Check IndexedDB on mount to recover any local storage evictions
    syncEntriesWithIDB().then(() => {
      refreshEntriesForSelectedDate();
    });

    const handleSyncTrigger = () => {
      if (document.visibilityState === 'visible' && userProfile.isLoggedIn && userProfile.isFirstSetupCompleted && navigator.onLine) {
        syncCloudVault();
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Internet connection restored! Triggering instant cloud sync...');
      if (userProfile.isLoggedIn && userProfile.isFirstSetupCompleted) {
        syncCloudVault();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleSyncTrigger);
    document.addEventListener('visibilitychange', handleSyncTrigger);

    // Initial check on mount: If online and logged in, perform cloud backup sync
    if (navigator.onLine && userProfile.isLoggedIn && userProfile.isFirstSetupCompleted) {
      syncCloudVault();
    }

    // Continuous 20s background sync poll when online & logged in
    const syncInterval = setInterval(() => {
      if (userProfile.isLoggedIn && userProfile.isFirstSetupCompleted && navigator.onLine) {
        syncCloudVault();
      }
    }, 20000);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleSyncTrigger);
      document.removeEventListener('visibilitychange', handleSyncTrigger);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearInterval(syncInterval);
    };
  }, [userProfile.isLoggedIn, userProfile.isFirstSetupCompleted, syncCloudVault, refreshEntriesForSelectedDate]);

  // Ref for last activity timestamp to prevent re-rendering app on every click or keystroke
  const lastActiveRef = React.useRef<number>(userProfile.lastActiveTimestamp || Date.now());

  // Keep ref updated when profile loads
  useEffect(() => {
    if (userProfile.lastActiveTimestamp) {
      lastActiveRef.current = userProfile.lastActiveTimestamp;
    }
  }, [userProfile.lastActiveTimestamp]);

  // Auto-lock checker after inactivity
  useEffect(() => {
    const checkAutoLock = () => {
      if (!userProfile.isLoggedIn) return;
      const now = Date.now();
      const maxInactiveMs = (userProfile.autoLockMinutes || 15) * 60 * 1000;
      if (now - lastActiveRef.current > maxInactiveMs) {
        lockApp();
      }
    };

    const interval = setInterval(checkAutoLock, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [userProfile.isLoggedIn, userProfile.autoLockMinutes]);

  // Update last active activity timestamp in ref on user interactions (zero re-renders)
  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const next = { ...prev, ...updates };
      saveUserProfile(next);
      return next;
    });
  };

  const loginWithPin = async (pin: string): Promise<boolean> => {
    const hashed = await hashPin(pin);
    if (hashed === userProfile.pinHash) {
      updateUserProfile({
        isLoggedIn: true,
        lastActiveTimestamp: Date.now(),
      });
      syncCloudVault(userProfile.userId, pin).then(() => {
        refreshEntriesForSelectedDate();
      });
      return true;
    }
    return false;
  };

  const setupNewUser = async (username: string, userId: string, pin: string): Promise<boolean> => {
    const hashed = await hashPin(pin);
    const cleanUserId = userId.trim() || '01712345678';
    const cleanPin = pin.trim() || '1234';

    // Smart check: If user completes setup with an existing account ID, attempt to pull existing cloud vault entries first
    try {
      const fbCheck = await verifyAndRestoreUserBackupFromFirebase(cleanUserId, cleanPin);
      if (fbCheck.success && fbCheck.backupData) {
        restoreFromBackupObject(fbCheck.backupData, { mode: 'merge' });
      }
    } catch (e) {
      console.warn('Setup cloud check catch:', e);
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      username: username.trim() || 'Admin',
      userId: cleanUserId,
      pin: cleanPin,
      pinHash: hashed,
      isFirstSetupCompleted: true,
      isLoggedIn: true,
      lastActiveTimestamp: Date.now(),
    };
    updateUserProfile(updatedProfile);
    triggerAutoBackupSequence(updatedProfile);
    return true;
  };

  const recoverCloudBackup = async (
    userId: string,
    pin: string
  ): Promise<{ success: boolean; error?: string; entryCount?: number }> => {
    const cleanUserId = userId.trim();
    const cleanPin = pin.trim();

    try {
      // 1. Try Firebase Firestore direct restore first
      const fbResult = await verifyAndRestoreUserBackupFromFirebase(cleanUserId, cleanPin);
      if (fbResult.success && fbResult.backupData) {
        const hashed = await hashPin(cleanPin);

        const current = loadUserProfile();
        const updatedProfile: UserProfile = {
          ...current,
          ...(fbResult.backupData.profile || {}),
          userId: cleanUserId,
          pin: cleanPin,
          pinHash: hashed,
          isFirstSetupCompleted: true,
          isLoggedIn: true,
          username: fbResult.backupData.profile?.username || current.username || 'Admin',
          lastActiveTimestamp: Date.now(),
        };

        // Save profile first so credentials match active user
        saveUserProfile(updatedProfile);
        restoreFromBackupObject(fbResult.backupData, { mode: 'replace' });
        reloadState();

        return {
          success: true,
          entryCount: fbResult.entryCount || (fbResult.backupData.entries ? fbResult.backupData.entries.length : 0),
        };
      }

      if (fbResult.invalidPin) {
        return {
          success: false,
          error: fbResult.error || 'Incorrect 4-digit Security PIN for this User ID.',
        };
      }

      // 2. Fallback to Central Cloud Server endpoint
      const res = await fetch('/api/central-backup/verify-and-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cleanUserId, pin: cleanPin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || fbResult.error || 'Failed to verify or restore cloud backup',
        };
      }

      if (!data.backupData) {
        return { success: false, error: 'Cloud backup record was empty or invalid.' };
      }

      const hashed = await hashPin(cleanPin);

      const current = loadUserProfile();
      const updatedProfile: UserProfile = {
        ...current,
        ...(data.backupData.profile || {}),
        userId: cleanUserId,
        pin: cleanPin,
        pinHash: hashed,
        isFirstSetupCompleted: true,
        isLoggedIn: true,
        username: data.backupData.profile?.username || current.username || 'Admin',
        lastActiveTimestamp: Date.now(),
      };

      // Save profile first so credentials match active user
      saveUserProfile(updatedProfile);
      restoreFromBackupObject(data.backupData, { mode: 'replace' });
      reloadState();

      return {
        success: true,
        entryCount: data.entryCount || (data.backupData.entries ? data.backupData.entries.length : 0),
      };
    } catch (err: any) {
      console.error('Recover cloud backup error:', err);
      return {
        success: false,
        error: 'Network error connecting to Cloud Vault. Please check your internet connection.',
      };
    }
  };

  const lockApp = () => {
    updateUserProfile({ isLoggedIn: false });
  };

  const shiftSelectedDate = (offsetDays: number) => {
    setSelectedDate(prev => shiftDateString(prev, offsetDays));
  };

  const saveCurrentDateEntries = (type: EntryType, entries: Entry[]) => {
    saveEntriesForDate(selectedDate, type, entries);
    refreshEntriesForSelectedDate();
  };

  const reloadState = () => {
    const freshProfile = loadUserProfile();
    setUserProfile(freshProfile);
    refreshEntriesForSelectedDate();
  };

  const handleClearAllData = () => {
    clearAllAppData();
    reloadState();
  };

  const installPwa = () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsPwaInstalled(true);
        }
        setDeferredPwaPrompt(null);
      });
    }
  };

  const t = getTranslation(userProfile.language);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        shiftSelectedDate,
        userProfile,
        updateUserProfile,
        loginWithPin,
        setupNewUser,
        recoverCloudBackup,
        lockApp,
        currentIncomeEntries,
        currentExpenseEntries,
        saveCurrentDateEntries,
        isOnline,
        isSyncing,
        lastSyncedTime,
        triggerManualSync,
        t,
        reloadState,
        clearAllData: handleClearAllData,
        deferredPwaPrompt,
        installPwa,
        isPwaInstalled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
