export type Language = 'en' | 'bn';
export type ThemeMode = 'light' | 'dark' | 'system';
export type BackupMode = 'both' | 'online' | 'offline';

export interface CustomNavLabels {
  entryPlus?: string;
  entryMinus?: string;
  accounts?: string;
  settings?: string;
  incomeColumnHeader?: string;
  expenseColumnHeader?: string;
  amountColumnHeader?: string;
  slNoColumnHeader?: string;
  descriptionPlaceholder?: string;
  addRowBtn?: string;
  totalIncomeLabel?: string;
  totalExpenseLabel?: string;
}

export interface UserProfile {
  username: string;
  pinHash: string; // Hashed or encoded local PIN
  mainTitle: string;
  subtitle: string;
  photoURL: string | null;
  theme: ThemeMode;
  language: Language;
  currency: string; // e.g. '₹' or '৳'
  customLabels: CustomNavLabels;
  isLoggedIn: boolean;
  isFirstSetupCompleted: boolean;
  autoLockMinutes: number; // default 15
  lastActiveTimestamp: number;
  backupMode?: BackupMode; // 'both' | 'online' | 'offline' (default 'both')
  offlineAutoBackup?: boolean; // default true
  onlineAutoBackup?: boolean; // default true
  lastOfflineAutoBackupTime?: string;
  logoVariant?: 'full' | 'badge' | 'stacked' | 'icon-only';
}

export interface BackupData {
  timestamp: string;
  version: string;
  profile: Partial<UserProfile>;
  entries: Array<import('./entry.types').Entry>;
  notes: Array<import('./entry.types').UserNote>;
}
