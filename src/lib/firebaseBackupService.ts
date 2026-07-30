import { db, doc, setDoc, getDoc, deleteDoc } from './firebase';
import { mergeEntries, mergeNotes } from '../utils/storage';

export interface FirebaseBackupRecord {
  id: string;
  userId: string;
  pin: string;
  recoveryKey?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  totalIncome: number;
  totalExpense: number;
  payload: any;
}

// Helper validator for 11-digit User ID
export function isValid11DigitUserId(id: string): boolean {
  if (!id) return false;
  return /^\d{11}$/.test(id.trim());
}

// 1. Save or update user backup in Firebase Firestore
export async function saveUserBackupToFirebase(
  userId: string,
  pin: string,
  backupName: string,
  payload: any
): Promise<{ success: boolean; lastSync?: string; error?: string }> {
  try {
    const cleanUserId = (userId || '').trim();
    if (!isValid11DigitUserId(cleanUserId)) {
      return { success: false, error: 'User ID must be strictly 11 numeric digits (e.g. 017XXXXXXXX)' };
    }

    if (!payload || !Array.isArray(payload.entries)) {
      return { success: false, error: 'Invalid backup payload structure' };
    }

    const timestamp = new Date().toISOString();
    const backupId = `backup_${cleanUserId}`;
    const cleanPin = (pin || '1234').trim();
    const cleanRecoveryKey = (payload?.profile?.recoveryKey || '').trim();
    const docRef = doc(db, 'user_backups', cleanUserId);

    let finalPayload = payload;

    // Security Check & Smart Non-Destructive Merge:
    // If vault already exists, enforce PIN match & merge existing cloud entries/notes with incoming
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existingData = docSnap.data() as FirebaseBackupRecord;
      const expectedPin = (existingData.pin || existingData.payload?.profile?.pin || '').trim();
      if (expectedPin && expectedPin !== cleanPin) {
        return {
          success: false,
          error: 'Security authorization failed: Incorrect 4-digit PIN for this 11-digit User ID vault.',
        };
      }

      const existingPayload = existingData.payload || {};
      const mergedEntriesList = mergeEntries(existingPayload.entries || [], payload.entries || []);
      const mergedNotesList = mergeNotes(existingPayload.notes || [], payload.notes || []);

      finalPayload = {
        ...existingPayload,
        ...payload,
        profile: {
          ...(existingPayload.profile || {}),
          ...(payload.profile || {}),
        },
        entries: mergedEntriesList,
        notes: mergedNotesList,
      };
    }

    const entryCount = finalPayload.entries.length;
    let totalIncome = 0;
    let totalExpense = 0;
    finalPayload.entries.forEach((e: any) => {
      if (e.type === 'income') totalIncome += Number(e.amount || 0);
      else if (e.type === 'expense') totalExpense += Number(e.amount || 0);
    });

    const backupRecord: FirebaseBackupRecord = {
      id: backupId,
      userId: cleanUserId,
      pin: cleanPin,
      recoveryKey: cleanRecoveryKey || docSnap.data()?.recoveryKey || '',
      name: backupName || `Cloud Backup (${new Date().toLocaleDateString('bn-BD')})`,
      createdAt: docSnap.exists() && docSnap.data()?.createdAt ? docSnap.data()?.createdAt : timestamp,
      updatedAt: timestamp,
      entryCount,
      totalIncome,
      totalExpense,
      payload: finalPayload,
    };

    await setDoc(docRef, backupRecord);

    return {
      success: true,
      lastSync: timestamp,
    };
  } catch (err: any) {
    console.error('Firebase save backup error:', err);
    return { success: false, error: err?.message || 'Failed to save backup to Firebase Cloud' };
  }
}

// 2. Verify PIN & Restore Backup from Firebase
export async function verifyAndRestoreUserBackupFromFirebase(
  userId: string,
  pin: string
): Promise<{
  success: boolean;
  backupData?: any;
  lastSync?: string;
  entryCount?: number;
  totalIncome?: number;
  totalExpense?: number;
  notFound?: boolean;
  invalidPin?: boolean;
  error?: string;
}> {
  try {
    const cleanUserId = (userId || '').trim();
    const cleanPin = (pin || '').trim();

    if (!isValid11DigitUserId(cleanUserId)) {
      return { success: false, error: 'User ID must be strictly 11 numeric digits' };
    }

    const docRef = doc(db, 'user_backups', cleanUserId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        notFound: true,
        error: `No cloud backup found for Phone Number ${cleanUserId}. Please check your 11-digit phone number.`,
      };
    }

    const record = docSnap.data() as FirebaseBackupRecord;

    const expectedPin = (record.pin || record.payload?.profile?.pin || '').trim();
    if (expectedPin && expectedPin !== cleanPin) {
      return {
        success: false,
        invalidPin: true,
        error: 'Incorrect 4-digit Security PIN for this account.',
      };
    }

    return {
      success: true,
      backupData: record.payload,
      lastSync: record.updatedAt || record.createdAt,
      entryCount: record.entryCount,
      totalIncome: record.totalIncome,
      totalExpense: record.totalExpense,
    };
  } catch (err: any) {
    console.error('Firebase restore backup error:', err);
    return { success: false, error: err?.message || 'Failed to restore backup from Firebase Cloud' };
  }
}

// 3. Rename/Migrate User ID in Firebase
export async function changeUserIdInFirebase(
  oldUserId: string,
  newUserId: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanOld = (oldUserId || '').trim();
    const cleanNew = (newUserId || '').trim();

    if (!isValid11DigitUserId(cleanNew)) {
      return { success: false, error: 'New User ID must be 11 numeric digits' };
    }

    if (cleanOld && cleanOld !== cleanNew) {
      const oldDocRef = doc(db, 'user_backups', cleanOld);
      const oldSnap = await getDoc(oldDocRef);

      if (oldSnap.exists()) {
        const data = oldSnap.data() as FirebaseBackupRecord;
        data.userId = cleanNew;
        data.pin = (pin || data.pin).trim();
        data.updatedAt = new Date().toISOString();

        const newDocRef = doc(db, 'user_backups', cleanNew);
        await setDoc(newDocRef, data);
        await deleteDoc(oldDocRef);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Firebase change User ID error:', err);
    return { success: false, error: err?.message || 'Failed to migrate User ID in Firebase' };
  }
}

// 4. Verify Master Recovery Key & Restore Account
export async function verifyAndRestoreByRecoveryKey(
  userId: string,
  recoveryKey: string
): Promise<{
  success: boolean;
  backupData?: any;
  pin?: string;
  recoveryKey?: string;
  lastSync?: string;
  error?: string;
}> {
  try {
    const cleanUserId = (userId || '').trim();
    const cleanKey = (recoveryKey || '').trim().toUpperCase();

    if (!isValid11DigitUserId(cleanUserId)) {
      return { success: false, error: 'User ID must be strictly 11 numeric digits (e.g. 017XXXXXXXX)' };
    }

    if (!cleanKey) {
      return { success: false, error: 'Please enter your 16-character Master Recovery Key.' };
    }

    const docRef = doc(db, 'user_backups', cleanUserId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: `No cloud backup vault found for User ID / Phone Number ${cleanUserId}.` };
    }

    const record = docSnap.data() as FirebaseBackupRecord;
    const storedKey = (record.recoveryKey || record.payload?.profile?.recoveryKey || '').trim().toUpperCase();

    if (!storedKey || storedKey !== cleanKey) {
      return { success: false, error: 'Invalid Master Recovery Key. Please check the 16-character key you received during setup.' };
    }

    return {
      success: true,
      backupData: record.payload,
      pin: record.pin || record.payload?.profile?.pin || '1234',
      recoveryKey: storedKey,
      lastSync: record.updatedAt || record.createdAt,
    };
  } catch (err: any) {
    console.error('Firebase recovery key restore error:', err);
    return { success: false, error: err?.message || 'Failed to verify Master Recovery Key' };
  }
}
