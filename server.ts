import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());

// --- CENTRAL DEVELOPER CLOUD VAULT STORAGE ---
const VAULT_DIR = path.join(process.cwd(), '.cloud_vault');
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// Central Cloud Vault Status
app.get('/api/cloud-vault/status', (req, res) => {
  res.json({
    available: true,
    mode: 'Firebase & Central Storage Vault',
    storage: 'Firebase Firestore & Central Storage Vault',
  });
});

// Central Cloud Vault Backup
app.post('/api/cloud-vault/backup', (req, res) => {
  try {
    const { backupData, userIdentifier } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: 'No backup data provided' });
    }

    const key = (userIdentifier || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `backup_${key}.json`;
    const filepath = path.join(VAULT_DIR, filename);

    const metadata = {
      userIdentifier: key,
      modifiedTime: new Date().toISOString(),
      backupData,
    };

    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      message: 'Successfully backed up to Central Cloud Storage Vault',
      lastSync: metadata.modifiedTime,
      filename,
    });
  } catch (err: any) {
    console.error('Cloud Vault backup error:', err);
    res.status(500).json({ error: err.message || 'Failed to save to Central Cloud Vault' });
  }
});

// Central Cloud Vault List Backups
app.get('/api/cloud-vault/backups', (req, res) => {
  try {
    const files = fs.readdirSync(VAULT_DIR);
    const backupList: Array<{ id: string; name: string; modifiedTime: string; size: string }> = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const fullPath = path.join(VAULT_DIR, file);
        const stats = fs.statSync(fullPath);
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          backupList.push({
            id: file,
            name: `Central Cloud Backup (${parsed.userIdentifier || 'Ledger Data'})`,
            modifiedTime: parsed.modifiedTime || stats.mtime.toISOString(),
            size: `${(stats.size / 1024).toFixed(1)} KB`,
          });
        } catch (e) {
          backupList.push({
            id: file,
            name: file,
            modifiedTime: stats.mtime.toISOString(),
            size: `${(stats.size / 1024).toFixed(1)} KB`,
          });
        }
      }
    }

    backupList.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());

    res.json({ files: backupList });
  } catch (err: any) {
    console.error('Cloud Vault list error:', err);
    res.status(500).json({ error: err.message || 'Failed to list Central Vault backups' });
  }
});

// Central Cloud Vault Restore
app.post('/api/cloud-vault/restore', (req, res) => {
  try {
    const { fileId, userIdentifier } = req.body;
    let targetFile = fileId;

    if (!targetFile) {
      const key = (userIdentifier || 'default_user').replace(/[^a-zA-Z0-9_-]/g, '_');
      targetFile = `backup_${key}.json`;
    }

    const filepath = path.join(VAULT_DIR, targetFile);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'No backup found in Central Cloud Vault' });
    }

    const raw = fs.readFileSync(filepath, 'utf-8');
    const parsed = JSON.parse(raw);

    res.json({
      success: true,
      data: parsed.backupData || parsed,
      modifiedTime: parsed.modifiedTime,
    });
  } catch (err: any) {
    console.error('Cloud Vault restore error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore from Central Cloud Vault' });
  }
});

// --- CENTRALIZED DEVELOPER CLOUD BACKUP SYSTEM ---
const CENTRAL_BACKUP_DIR = path.join(process.cwd(), 'central_cloud_backups');
if (!fs.existsSync(CENTRAL_BACKUP_DIR)) {
  try {
    fs.mkdirSync(CENTRAL_BACKUP_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create central_cloud_backups dir:', e);
  }
}

// Helper validator for 11-digit User ID
function isValid11DigitUserId(id: string): boolean {
  if (!id) return false;
  const clean = id.trim();
  return /^\d{11}$/.test(clean);
}

// Helper validator for 4-digit PIN
function isValid4DigitPin(pin: string): boolean {
  if (!pin) return false;
  const clean = pin.trim();
  return /^\d{4}$/.test(clean);
}

// Server-side entry & note merging helpers
function mergeEntriesServer(existingEntries: any[] = [], incomingEntries: any[] = []): any[] {
  const entryMap = new Map<string, any>();
  if (Array.isArray(existingEntries)) {
    existingEntries.forEach((e) => {
      if (e && e.id) entryMap.set(e.id, e);
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

function mergeNotesServer(existingNotes: any[] = [], incomingNotes: any[] = []): any[] {
  const noteMap = new Map<string, any>();
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

// Save backup to central developer cloud store
app.post('/api/central-backup/save', async (req, res) => {
  try {
    const { userId, pin, backupName, payload } = req.body;
    if (!payload || !payload.entries) {
      return res.status(400).json({ error: 'Invalid backup payload structure' });
    }

    const cleanUserId = (userId || '').trim();
    if (!isValid11DigitUserId(cleanUserId)) {
      return res.status(400).json({ error: 'User ID must be strictly 11 numeric digits (e.g. 017XXXXXXXX)' });
    }

    const userBackupDir = path.join(CENTRAL_BACKUP_DIR, cleanUserId);
    if (!fs.existsSync(userBackupDir)) {
      fs.mkdirSync(userBackupDir, { recursive: true });
    }

    const latestPath = path.join(userBackupDir, 'latest.json');
    let finalPayload = payload;

    if (fs.existsSync(latestPath)) {
      try {
        const raw = fs.readFileSync(latestPath, 'utf-8');
        const existingRecord = JSON.parse(raw);
        const expectedPin = (existingRecord.pin || existingRecord.payload?.profile?.pin || '').trim();
        if (expectedPin && expectedPin !== (pin || '1234').trim()) {
          return res.status(401).json({ error: 'Security authorization failed: Incorrect 4-digit PIN for this User ID.' });
        }

        const existingPayload = existingRecord.payload || {};
        const mergedEntriesList = mergeEntriesServer(existingPayload.entries || [], payload.entries || []);
        const mergedNotesList = mergeNotesServer(existingPayload.notes || [], payload.notes || []);

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
      } catch (e) {
        // proceed with incoming payload fallback
      }
    }

    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    const entryCount = Array.isArray(finalPayload.entries) ? finalPayload.entries.length : 0;
    
    // Calculate summary statistics for backup overview
    let totalIncome = 0;
    let totalExpense = 0;
    if (Array.isArray(finalPayload.entries)) {
      finalPayload.entries.forEach((e: any) => {
        if (e.type === 'income') totalIncome += Number(e.amount || 0);
        else if (e.type === 'expense') totalExpense += Number(e.amount || 0);
      });
    }

    const backupRecord = {
      id: backupId,
      userId: cleanUserId,
      pin: pin || '1234',
      name: backupName || `Auto Backup (${new Date().toLocaleDateString('bn-BD')})`,
      createdAt: timestamp,
      updatedAt: timestamp,
      entryCount,
      totalIncome,
      totalExpense,
      payload: finalPayload,
    };

    const filePath = path.join(userBackupDir, `${backupId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(backupRecord, null, 2));

    // Also update latest pointer
    fs.writeFileSync(path.join(userBackupDir, 'latest.json'), JSON.stringify(backupRecord, null, 2));

    res.json({
      success: true,
      message: 'Successfully backed up to Central Cloud Storage',
      lastSync: timestamp,
      backup: {
        id: backupId,
        createdAt: timestamp,
        entryCount,
        totalIncome,
        totalExpense,
        name: backupRecord.name,
      },
    });
  } catch (err: any) {
    console.error('Central backup save error:', err);
    res.status(500).json({ error: err?.message || 'Failed to save to central cloud' });
  }
});

// Rename / Migrate User ID folder on backend
app.post('/api/central-backup/change-userid', async (req, res) => {
  try {
    const { oldUserId, newUserId, pin } = req.body;
    const cleanOld = (oldUserId || '').trim();
    const cleanNew = (newUserId || '').trim();

    if (!isValid11DigitUserId(cleanNew)) {
      return res.status(400).json({ error: 'New User ID must be strictly 11 numeric digits (e.g. 017XXXXXXXX)' });
    }

    const oldDir = path.join(CENTRAL_BACKUP_DIR, cleanOld);
    const newDir = path.join(CENTRAL_BACKUP_DIR, cleanNew);

    if (fs.existsSync(oldDir) && cleanOld !== cleanNew) {
      // Rename existing folder
      if (fs.existsSync(newDir)) {
        // If target exists, merge or overwrite
        const files = fs.readdirSync(oldDir);
        for (const f of files) {
          const oldFile = path.join(oldDir, f);
          const newFile = path.join(newDir, f);
          fs.copyFileSync(oldFile, newFile);
        }
        fs.rmSync(oldDir, { recursive: true, force: true });
      } else {
        fs.renameSync(oldDir, newDir);
      }

      // Update contents of latest.json with new User ID and PIN
      const latestPath = path.join(newDir, 'latest.json');
      if (fs.existsSync(latestPath)) {
        try {
          const raw = fs.readFileSync(latestPath, 'utf-8');
          const parsed = JSON.parse(raw);
          parsed.userId = cleanNew;
          if (pin) parsed.pin = pin;
          fs.writeFileSync(latestPath, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.warn('Failed to update latest.json on folder rename', e);
        }
      }
    } else {
      // Ensure target directory exists
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
    }

    res.json({
      success: true,
      message: 'Cloud backup folder successfully updated to new 11-digit User ID',
      newUserId: cleanNew,
    });
  } catch (err: any) {
    console.error('Change User ID error:', err);
    res.status(500).json({ error: err?.message || 'Failed to update User ID on backend' });
  }
});

// Verify & Restore Cloud Backup by 11-digit User ID & PIN
app.post('/api/central-backup/verify-and-restore', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const cleanUserId = (userId || '').trim();
    const cleanPin = (pin || '').trim();

    if (!isValid11DigitUserId(cleanUserId)) {
      return res.status(400).json({ error: 'User ID must be strictly 11 numeric digits' });
    }

    const userDir = path.join(CENTRAL_BACKUP_DIR, cleanUserId);
    const latestPath = path.join(userDir, 'latest.json');

    let record: any = null;

    if (fs.existsSync(latestPath)) {
      try {
        const raw = fs.readFileSync(latestPath, 'utf-8');
        record = JSON.parse(raw);
      } catch (e) {
        record = null;
      }
    }

    // Fallback: check most recent backup file in user folder
    if (!record && fs.existsSync(userDir)) {
      try {
        const files = fs.readdirSync(userDir).filter((f) => f.endsWith('.json') && f !== 'latest.json');
        if (files.length > 0) {
          files.sort((a, b) => b.localeCompare(a)); // newest timestamp first
          const raw = fs.readFileSync(path.join(userDir, files[0]), 'utf-8');
          record = JSON.parse(raw);
        }
      } catch (e) {
        record = null;
      }
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        notFound: true,
        error: `No central cloud backup found for User ID ${cleanUserId}. Please check your 11-digit phone number or perform a backup first.`,
      });
    }

    // Verify PIN if stored
    const expectedPin = record.pin || record.payload?.profile?.pin;
    if (expectedPin && expectedPin !== cleanPin) {
      return res.status(401).json({
        success: false,
        invalidPin: true,
        error: 'Incorrect 4-digit Security PIN for this User ID.',
      });
    }

    res.json({
      success: true,
      backupData: record.payload,
      lastSync: record.updatedAt || record.createdAt,
      entryCount: record.entryCount,
      totalIncome: record.totalIncome,
      totalExpense: record.totalExpense,
    });
  } catch (err: any) {
    console.error('Verify and restore error:', err);
    res.status(500).json({ error: err?.message || 'Failed to restore backup from Central Cloud' });
  }
});

// List all central cloud backups for a user ID
app.get('/api/central-backup/list', (req, res) => {
  try {
    const userId = ((req.query.userId as string) || '').trim();
    if (!isValid11DigitUserId(userId)) {
      return res.json({ success: true, backups: [] });
    }

    const userBackupDir = path.join(CENTRAL_BACKUP_DIR, userId);
    if (!fs.existsSync(userBackupDir)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(userBackupDir).filter(f => f.endsWith('.json') && f !== 'latest.json');
    const backups = files.map(file => {
      try {
        const raw = fs.readFileSync(path.join(userBackupDir, file), 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          id: parsed.id,
          name: parsed.name,
          createdAt: parsed.createdAt,
          entryCount: parsed.entryCount,
          totalIncome: parsed.totalIncome,
          totalExpense: parsed.totalExpense,
          sizeKb: Math.round(raw.length / 1024 * 10) / 10,
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Sort newest first
    backups.sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());

    res.json({ success: true, backups });
  } catch (err: any) {
    console.error('Central backup list error:', err);
    res.status(500).json({ error: 'Failed to retrieve backups from central cloud' });
  }
});

// Get & restore a specific central cloud backup
app.get('/api/central-backup/get/:backupId', (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = ((req.query.userId as string) || '').trim();
    const targetFile = path.join(CENTRAL_BACKUP_DIR, userId, `${backupId}.json`);

    if (!fs.existsSync(targetFile)) {
      return res.status(404).json({ error: 'Backup not found in central cloud' });
    }

    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw);
    res.json({ success: true, backup: parsed });
  } catch (err: any) {
    console.error('Central backup get error:', err);
    res.status(500).json({ error: 'Failed to retrieve backup' });
  }
});

// Delete a central cloud backup
app.delete('/api/central-backup/:backupId', (req, res) => {
  try {
    const { backupId } = req.params;
    const userId = ((req.query.userId as string) || '').trim();
    const targetFile = path.join(CENTRAL_BACKUP_DIR, userId, `${backupId}.json`);

    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
    res.json({ success: true, message: 'Backup deleted from central cloud' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// --- VITE / STATIC SERVING ---
async function startServer() {
  // Global Express error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // SPA fallback for dev server
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DailyHishab full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
