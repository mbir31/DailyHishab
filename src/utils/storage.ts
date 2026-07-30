import { Entry, EntryType, UserNote } from '../types/entry.types';
import { UserProfile, BackupData } from '../types/user.types';
import { saveUserBackupToFirebase } from '../lib/firebaseBackupService';

const STORAGE_KEYS = {
  PROFILE: 'dailyhishab_user_profile',
  ENTRIES: 'dailyhishab_entries_db',
  NOTES: 'dailyhishab_notes_db',
  CONTINUOUS_BACKUP: 'dailyhishab_continuous_offline_backup',
};

export const DEFAULT_PROFILE: UserProfile = {
  username: 'Admin',
  pinHash: '', // Set on first welcome screen
  userId: '01712345678', // Default 11-digit User ID
  pin: '1234', // Default 4-digit PIN
  mainTitle: 'DailyHishab',
  subtitle: 'Personal & Business Ledger',
  photoURL: null,
  theme: 'light',
  language: 'en',
  currency: '₹',
  customLabels: {
    entryPlus: 'Income',
    entryMinus: 'Expense',
    accounts: 'Accounts',
    settings: 'Settings',
  },
  isLoggedIn: false,
  isFirstSetupCompleted: false,
  autoLockMinutes: 15,
  lastActiveTimestamp: Date.now(),
  backupMode: 'both',
  backupStorageMode: 'both',
  offlineAutoBackup: true,
  onlineAutoBackup: true,
  lastCloudBackupTime: null,
  logoVariant: 'full',
};

// Strict Validation Helpers
export function isValidUserId(id: string): boolean {
  if (!id) return false;
  return /^\d{11}$/.test(id.trim());
}

export function isValidPin(pin: string): boolean {
  if (!pin) return false;
  return /^\d{4}$/.test(pin.trim());
}

// Generate 16-character Master Recovery Key (e.g. DH-78F2-901B-32A4)
export function generateRecoveryKey(): string {
  const chars = '0123456789ABCDEF';
  const chunk = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DH-${chunk()}-${chunk()}-${chunk()}`;
}

// Simple cryptographic PIN hash function using Web Crypto API
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`dailyhishab_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// IndexedDB Helper with LocalStorage fallback for maximum stability & offline reliability
const DB_NAME = 'DailyHishabIndexedDB';
const DB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (evt: any) => {
      const db = evt.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Merging helper functions to ensure no entries or notes are lost across sessions or devices
export function mergeEntries(existingEntries: Entry[] = [], incomingEntries: Entry[] = []): Entry[] {
  const entryMap = new Map<string, Entry>();

  if (Array.isArray(existingEntries)) {
    existingEntries.forEach((e) => {
      if (e && e.id) {
        entryMap.set(e.id, e);
      }
    });
  }

  if (Array.isArray(incomingEntries)) {
    incomingEntries.forEach((r) => {
      if (!r) return;
      if (r.id && entryMap.has(r.id)) {
        const cur = entryMap.get(r.id)!;
        if ((r.updatedAt || 0) >= (cur.updatedAt || 0)) {
          entryMap.set(r.id, r);
        }
      } else {
        const existingList = Array.from(entryMap.values());
        const dup = existingList.find(
          (e) =>
            e.date === r.date &&
            e.type === r.type &&
            Number(e.amount) === Number(r.amount) &&
            (e.description || '').trim() === (r.description || '').trim()
        );
        if (!dup && r.id) {
          entryMap.set(r.id, r);
        } else if (dup && (r.updatedAt || 0) > (dup.updatedAt || 0)) {
          entryMap.set(dup.id, { ...dup, ...r });
        }
      }
    });
  }

  return Array.from(entryMap.values());
}

export function mergeNotes(existingNotes: UserNote[] = [], incomingNotes: UserNote[] = []): UserNote[] {
  const noteMap = new Map<string, UserNote>();

  if (Array.isArray(existingNotes)) {
    existingNotes.forEach((n) => {
      if (n) noteMap.set(`${n.dateFrom}_${n.dateTo}`, n);
    });
  }

  if (Array.isArray(incomingNotes)) {
    incomingNotes.forEach((rn) => {
      if (!rn) return;
      const key = `${rn.dateFrom}_${rn.dateTo}`;
      if (!noteMap.has(key)) {
        noteMap.set(key, rn);
      } else {
        const cur = noteMap.get(key)!;
        if ((rn.updatedAt || 0) >= (cur.updatedAt || 0)) {
          noteMap.set(key, rn);
        }
      }
    });
  }

  return Array.from(noteMap.values());
}

// Synchronize LocalStorage with IndexedDB for zero-loss offline cache
export async function syncEntriesWithIDB(): Promise<Entry[]> {
  try {
    const localEntries = loadAllEntriesSync();
    const idb = await openIDB();
    const tx = idb.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const idbEntries = await new Promise<Entry[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (idbEntries.length === 0 && localEntries.length > 0) {
      const writeTx = idb.transaction('entries', 'readwrite');
      const writeStore = writeTx.objectStore('entries');
      localEntries.forEach((e) => writeStore.put(e));
      return localEntries;
    }

    if (idbEntries.length > 0) {
      const merged = mergeEntries(localEntries, idbEntries);
      if (merged.length !== localEntries.length) {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(merged));
      }
      return merged;
    }

    return localEntries;
  } catch (err) {
    console.warn('IDB sync warning:', err);
    return loadAllEntriesSync();
  }
}

// User Profile Local Storage
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    if (!parsed.userId || !/^\d{11}$/.test(String(parsed.userId).trim())) {
      parsed.userId = '01712345678';
    }
    if (!parsed.pin || !/^\d{4}$/.test(String(parsed.pin).trim())) {
      parsed.pin = '1234';
    }
    if (!parsed.recoveryKey) {
      parsed.recoveryKey = generateRecoveryKey();
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed));
      } catch {}
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load profile', err);
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

// Entries Management (using both IndexedDB and LocalStorage mirror for zero-loss offline cache)
export function loadAllEntriesSync(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading entries from localStorage', err);
    return [];
  }
}

export function getAllEntries(): Entry[] {
  return loadAllEntriesSync();
}

export function saveAllEntriesSync(entries: Entry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    // Also update IDB asynchronously
    openIDB().then(db => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      store.clear();
      entries.forEach(e => store.put(e));
    }).catch(e => console.warn('IDB update warning:', e));
    // Trigger continuous backup (offline snapshot & online Drive sync)
    triggerAutoBackupSequence();
  } catch (err) {
    console.error('Error saving entries', err);
  }
}

export function getEntriesForDate(dateStr: string, type: EntryType): Entry[] {
  const all = loadAllEntriesSync();
  return all
    .filter(e => e.date === dateStr && e.type === type)
    .sort((a, b) => a.serial - b.serial);
}

export function saveEntriesForDate(dateStr: string, type: EntryType, entriesForDate: Entry[]): void {
  const all = loadAllEntriesSync();
  // Filter out existing entries for this date & type
  const remaining = all.filter(e => !(e.date === dateStr && e.type === type));
  
  // Filter out empty placeholder rows before saving to database
  const validEntries = entriesForDate.filter(
    e => (e.description && e.description.trim() !== '') || Number(e.amount || 0) !== 0
  );

  // Re-assign exact serial numbers starting from 1
  const sanitized = validEntries.map((e, idx) => ({
    ...e,
    date: dateStr,
    type,
    serial: idx + 1,
    updatedAt: Date.now(),
  }));
  
  const updatedAll = [...remaining, ...sanitized];
  saveAllEntriesSync(updatedAll);
}

export function getEntriesForRange(fromDate: string, toDate: string): Entry[] {
  const all = loadAllEntriesSync();
  return all.filter(e => e.date >= fromDate && e.date <= toDate);
}

// Notes Management
export function loadAllNotesSync(): UserNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading notes', err);
    return [];
  }
}

export function saveNoteForRange(dateFrom: string, dateTo: string, content: string): void {
  const notes = loadAllNotesSync();
  const key = `${dateFrom}_${dateTo}`;
  const existingIdx = notes.findIndex(n => `${n.dateFrom}_${n.dateTo}` === key);
  
  if (existingIdx >= 0) {
    notes[existingIdx].content = content;
    notes[existingIdx].updatedAt = Date.now();
  } else {
    notes.push({
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dateFrom,
      dateTo,
      content,
      updatedAt: Date.now(),
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  triggerAutoBackupSequence();
}

export function getNoteForRange(dateFrom: string, dateTo: string): string {
  const notes = loadAllNotesSync();
  const key = `${dateFrom}_${dateTo}`;
  const match = notes.find(n => `${n.dateFrom}_${n.dateTo}` === key);
  return match ? match.content : '';
}

// Backup & Restore
export function createBackupObject(): BackupData {
  const profile = loadUserProfile();
  // Strip PIN Hash for export safety or retain if user chooses
  const safeProfile = { ...profile, isLoggedIn: false };
  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    profile: safeProfile,
    entries: loadAllEntriesSync(),
    notes: loadAllNotesSync(),
  };
}

export function restoreFromBackupObject(
  backup: BackupData,
  options: { mode?: 'replace' | 'merge' } = { mode: 'replace' }
): boolean {
  if (!backup || !Array.isArray(backup.entries)) {
    return false;
  }

  const mode = options.mode || 'replace';

  if (backup.profile) {
    const currentProfile = loadUserProfile();
    saveUserProfile({
      ...currentProfile,
      ...backup.profile,
      userId: currentProfile.userId, // preserve current device user ID unless empty
      pin: currentProfile.pin, // preserve current user PIN
      pinHash: currentProfile.pinHash,
    });
  }

  if (mode === 'replace') {
    saveAllEntriesSync(backup.entries);
    if (Array.isArray(backup.notes)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(backup.notes));
    }
  } else {
    // Merge mode
    const existingEntries = loadAllEntriesSync();
    const entryMap = new Map<string, Entry>();

    existingEntries.forEach((e) => entryMap.set(e.id, e));

    backup.entries.forEach((r) => {
      if (entryMap.has(r.id)) {
        const cur = entryMap.get(r.id)!;
        if ((r.updatedAt || 0) > (cur.updatedAt || 0)) {
          entryMap.set(r.id, r);
        }
      } else {
        // Check duplicate matching entry
        const dup = existingEntries.find(
          (e) =>
            e.date === r.date &&
            e.type === r.type &&
            Number(e.amount) === Number(r.amount) &&
            e.description.trim() === r.description.trim()
        );
        if (!dup) {
          entryMap.set(r.id, r);
        }
      }
    });

    const mergedEntries = Array.from(entryMap.values());
    saveAllEntriesSync(mergedEntries);

    // Merge notes
    if (Array.isArray(backup.notes)) {
      const existingNotes = loadAllNotesSync();
      const noteMap = new Map<string, UserNote>();
      existingNotes.forEach((n) => noteMap.set(`${n.dateFrom}_${n.dateTo}`, n));

      backup.notes.forEach((rn) => {
        const key = `${rn.dateFrom}_${rn.dateTo}`;
        if (!noteMap.has(key)) {
          noteMap.set(key, rn);
        } else {
          const cur = noteMap.get(key)!;
          if ((rn.updatedAt || 0) > (cur.updatedAt || 0)) {
            noteMap.set(key, rn);
          }
        }
      });

      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(Array.from(noteMap.values())));
    }
  }

  return true;
}

export function clearAllAppData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.NOTES);
  localStorage.removeItem(STORAGE_KEYS.CONTINUOUS_BACKUP);
  openIDB().then(db => {
    const tx = db.transaction(['entries', 'notes'], 'readwrite');
    tx.objectStore('entries').clear();
    tx.objectStore('notes').clear();
  }).catch(() => {});
}

// Continuous Offline Auto-Backup Helpers
export function performContinuousOfflineBackup(): string | null {
  try {
    const backupObj = createBackupObject();
    const nowIso = new Date().toISOString();
    const payload = { ...backupObj, autoBackupTimestamp: nowIso };
    localStorage.setItem(STORAGE_KEYS.CONTINUOUS_BACKUP, JSON.stringify(payload));
    return nowIso;
  } catch (err) {
    console.error('Failed to create continuous offline auto-backup', err);
    return null;
  }
}

export function getContinuousOfflineBackup(): (BackupData & { autoBackupTimestamp?: string }) | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTINUOUS_BACKUP);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// Sequence trigger invoked on data entries / notes changes
export function triggerAutoBackupSequence(profile?: UserProfile): void {
  const currentProfile = profile || loadUserProfile();

  // MANDATORY SECURITY & DATA INTEGRITY GUARD:
  // Do NOT execute cloud backups if user setup is incomplete or user is not logged in!
  if (!currentProfile.isFirstSetupCompleted || !currentProfile.isLoggedIn) {
    if (currentProfile.isFirstSetupCompleted) {
      const offlineTs = performContinuousOfflineBackup();
      if (offlineTs) {
        saveUserProfile({ ...currentProfile, lastOfflineAutoBackupTime: offlineTs });
      }
    }
    return;
  }

  const storageMode = currentProfile.backupStorageMode || (currentProfile.backupMode as any) || 'both';
  const isCloudEnabled = storageMode === 'both' || storageMode === 'cloud' || storageMode === 'online';

  // 1. MANDATE: Continuous Local Device & Offline Storage Auto-Backup
  // ALWAYS execute unconditionally on EVERY entry/note modification for zero-data-loss security.
  const offlineTs = performContinuousOfflineBackup();
  let updatedProfile: UserProfile = { ...currentProfile };
  if (offlineTs) {
    updatedProfile.lastOfflineAutoBackupTime = offlineTs;
    saveUserProfile(updatedProfile);
  }

  // 2. Continuous Online Cloud Auto-Backup
  if (isCloudEnabled && currentProfile.onlineAutoBackup !== false) {
    // If device is offline, mark pending sync immediately
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updatedProfile.pendingCloudSync = true;
      saveUserProfile(updatedProfile);
      console.log('📱 Device is currently offline. Entry saved locally & queued for cloud sync upon reconnection.');
      return;
    }

    try {
      const backupData = createBackupObject();
      const uId = currentProfile.userId && /^\d{11}$/.test(String(currentProfile.userId).trim())
        ? String(currentProfile.userId).trim()
        : '01712345678';
      const uPin = currentProfile.pin && /^\d{4}$/.test(String(currentProfile.pin).trim())
        ? String(currentProfile.pin).trim()
        : '1234';

      // Primary client-side Firebase Firestore auto-backup
      saveUserBackupToFirebase(uId, uPin, 'Continuous Cloud Auto-Backup', backupData)
        .then((fbRes) => {
          if (fbRes.success) {
            const fresh = loadUserProfile();
            saveUserProfile({
              ...fresh,
              pendingCloudSync: false,
              lastCloudBackupTime: fbRes.lastSync || new Date().toISOString(),
            });
            console.log('☁️ Continuous Cloud Auto-Backup successfully synced to Firebase Firestore.');
          } else {
            // If Firebase returns error or failed response, flag pending sync
            const fresh = loadUserProfile();
            saveUserProfile({ ...fresh, pendingCloudSync: true });
          }
        })
        .catch((err) => {
          console.warn('Firebase client auto-backup catch:', err);
          const fresh = loadUserProfile();
          saveUserProfile({ ...fresh, pendingCloudSync: true });
        });

      // Secondary server endpoint backup
      fetch('/api/central-backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uId,
          pin: uPin,
          payload: backupData,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            const fresh = loadUserProfile();
            saveUserProfile({
              ...fresh,
              pendingCloudSync: false,
              lastCloudBackupTime: data.lastSync || new Date().toISOString(),
            });
          }
        })
        .catch(() => {
          const fresh = loadUserProfile();
          saveUserProfile({ ...fresh, pendingCloudSync: true });
        });
    } catch (err) {
      console.warn('Failed to send cloud auto-backup:', err);
      const fresh = loadUserProfile();
      saveUserProfile({ ...fresh, pendingCloudSync: true });
    }
  }
}
