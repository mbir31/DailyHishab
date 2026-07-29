export type Language = 'en' | 'bn';
export type ThemeMode = 'light' | 'dark' | 'system';
export type BackupMode = 'both' | 'cloud' | 'local' | 'online' | 'offline';
export type BackupStorageMode = 'cloud' | 'local' | 'both';

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
  userId: string; // 11-digit numeric User ID (phone number or auto ID e.g. 01712345678)
  pin: string; // 4-digit security PIN (default '1234')
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
  backupMode?: BackupMode; // 'both' | 'cloud' | 'local'
  backupStorageMode?: BackupStorageMode; // 'cloud' | 'local' | 'both'
  offlineAutoBackup?: boolean; // default true
  onlineAutoBackup?: boolean; // default true
  pendingCloudSync?: boolean; // flags unsynced changes when offline
  lastOfflineAutoBackupTime?: string;
  lastCloudBackupTime?: string | null;
  recoveryKey?: string; // 16-character master security recovery key (e.g. DH-8A92-4F10-99E1)
  logoVariant?: 'full' | 'badge' | 'stacked' | 'icon-only';
}

export interface BackupData {
  timestamp: string;
  version: string;
  profile: Partial<UserProfile>;
  entries: Array<import('./entry.types').Entry>;
  notes: Array<import('./entry.types').UserNote>;
}
