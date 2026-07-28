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
} from '../utils/storage';
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
  lockApp: () => void;
  
  // Entries for selected date
  currentIncomeEntries: Entry[];
  currentExpenseEntries: Entry[];
  saveCurrentDateEntries: (type: EntryType, entries: Entry[]) => void;
  
  // Helpers
  isOnline: boolean;
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
  
  const [currentIncomeEntries, setCurrentIncomeEntries] = useState<Entry[]>([]);
  const [currentExpenseEntries, setCurrentExpenseEntries] = useState<Entry[]>([]);

  // PWA deferred prompt
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Network online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    let themeToApply = userProfile.theme;
    if (themeToApply === 'system') {
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', themeToApply);
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [userProfile.theme]);

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
      return true;
    }
    return false;
  };

  const setupNewUser = async (username: string, userId: string, pin: string): Promise<boolean> => {
    const hashed = await hashPin(pin);
    const cleanUserId = userId.trim() || '01712345678';
    const cleanPin = pin.trim() || '1234';
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
        lockApp,
        currentIncomeEntries,
        currentExpenseEntries,
        saveCurrentDateEntries,
        isOnline,
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
