import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());

// Persistent token storage path
const TOKEN_FILE_PATH = path.join(process.cwd(), '.drive_session.json');

interface DriveSession {
  tokens: any;
  user: {
    email: string;
    name: string;
    picture?: string;
  };
  lastSync?: string;
  autoSync?: boolean;
}

let driveSession: DriveSession | null = null;

// Load firebase config fallback for OAuth Client ID if present
let firebaseConfig: any = null;
try {
  const fbPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(fbPath, 'utf-8'));
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

// Load existing session if saved on disk
try {
  if (fs.existsSync(TOKEN_FILE_PATH)) {
    const raw = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
    driveSession = JSON.parse(raw);
  }
} catch (err) {
  console.error('Failed to load drive session from disk:', err);
}

function saveDriveSession(session: DriveSession | null) {
  driveSession = session;
  if (!session) {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
    }
  } else {
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(session, null, 2));
  }
}

// Get Google OAuth2 Client
function getOAuth2Client(req?: express.Request) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID ||
    firebaseConfig?.oAuthClientId;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    '';

  let redirectUri = process.env.APP_URL
    ? `${process.env.APP_URL.replace(/\/$/, '')}/api/auth/google/callback`
    : 'http://localhost:3000/api/auth/google/callback';

  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    if (host) {
      redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    }
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Get authenticated Drive instance
function getDriveClient(oauth2Client: any) {
  if (driveSession?.tokens) {
    oauth2Client.setCredentials(driveSession.tokens);
    oauth2Client.on('tokens', (tokens: any) => {
      if (driveSession) {
        driveSession.tokens = { ...driveSession.tokens, ...tokens };
        saveDriveSession(driveSession);
      }
    });
  }
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// --- API ROUTES ---

// Endpoint for direct client-side Google Drive token connection (Firebase Auth)
app.post('/api/drive/connect-token', (req, res) => {
  try {
    const { accessToken, user } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token missing' });
    }

    const session: DriveSession = {
      tokens: { access_token: accessToken },
      user: {
        email: user?.email || 'user@gmail.com',
        name: user?.displayName || user?.name || 'Google User',
        picture: user?.photoURL || user?.picture || undefined,
      },
      autoSync: true,
    };

    saveDriveSession(session);
    res.json({ success: true, connected: true, user: session.user });
  } catch (err: any) {
    console.error('Error connecting token to drive session:', err);
    res.status(500).json({ error: err.message || 'Failed to connect Drive token' });
  }
});

// 1. Get Google OAuth Authorization URL
app.get('/api/auth/google/url', (req, res) => {
  try {
    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    res.json({ url });
  } catch (err: any) {
    console.error('Error generating Google OAuth URL:', err);
    res.status(500).json({ error: err.message || 'Failed to generate OAuth URL' });
  }
});

// 2. OAuth Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, '*');
              window.close();
            } else {
              window.location.href = '/?auth_error=${error}';
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const session: DriveSession = {
      tokens,
      user: {
        email: userInfo.data.email || 'user@gmail.com',
        name: userInfo.data.name || 'Google User',
        picture: userInfo.data.picture || undefined,
      },
      autoSync: true,
    };

    saveDriveSession(session);

    // Send success HTML that closes popup and notifies opener or redirects
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Authentication</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; margin: 0; }
            .card { text-align: center; padding: 2rem; background: #1e293b; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { margin-bottom: 0.5rem; color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connected to Google Drive!</h2>
            <p>Your Gmail (${userInfo.data.email}) is linked successfully.</p>
            <p>Closing this window...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', email: '${userInfo.data.email}' }, '*');
              setTimeout(() => window.close(), 1200);
            } else {
              setTimeout(() => { window.location.href = '/'; }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// 3. Status check
app.get('/api/drive/status', (req, res) => {
  if (!driveSession) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    user: driveSession.user,
    lastSync: driveSession.lastSync || null,
    autoSync: driveSession.autoSync !== false,
  });
});

// 4. Disconnect Google Drive
app.post('/api/drive/disconnect', (req, res) => {
  saveDriveSession(null);
  res.json({ success: true, message: 'Google Drive disconnected' });
});

// 5. Backup data to Google Drive
app.post('/api/drive/backup', async (req, res) => {
  if (!driveSession || !driveSession.tokens) {
    return res.status(401).json({ error: 'Google Drive is not linked' });
  }

  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: 'No backup data provided' });
    }

    const oauth2Client = getOAuth2Client(req);
    const drive = getDriveClient(oauth2Client);

    const fileName = 'DailyHishab_Backup.json';
    const fileContent = JSON.stringify(backupData, null, 2);

    // Search for existing file
    const searchRes = await drive.files.list({
      q: `name = '${fileName}' and trashed = false`,
      fields: 'files(id, name, modifiedTime, size)',
      spaces: 'drive',
    });

    let fileId: string;
    let modifiedTime: string;

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      // Update existing file
      fileId = searchRes.data.files[0].id!;
      const updateRes = await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
        fields: 'id, name, modifiedTime, size',
      });
      modifiedTime = updateRes.data.modifiedTime || new Date().toISOString();
    } else {
      // Create new file
      const createRes = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/json',
          description: 'DailyHishab Financial Ledger Cloud Backup',
        },
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
        fields: 'id, name, modifiedTime, size',
      });
      fileId = createRes.data.id!;
      modifiedTime = createRes.data.modifiedTime || new Date().toISOString();
    }

    // Update session lastSync
    driveSession.lastSync = modifiedTime;
    saveDriveSession(driveSession);

    res.json({
      success: true,
      fileId,
      fileName,
      modifiedTime,
      lastSync: modifiedTime,
    });
  } catch (err: any) {
    console.error('Error backing up to Google Drive:', err);
    res.status(500).json({ error: err.message || 'Failed to backup to Google Drive' });
  }
});

// 6. List available backups in Google Drive
app.get('/api/drive/backups', async (req, res) => {
  if (!driveSession || !driveSession.tokens) {
    return res.status(401).json({ error: 'Google Drive is not linked' });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const drive = getDriveClient(oauth2Client);

    const listRes = await drive.files.list({
      q: "name contains 'DailyHishab' and trashed = false",
      fields: 'files(id, name, modifiedTime, size)',
      orderBy: 'modifiedTime desc',
    });

    res.json({
      files: listRes.data.files || [],
    });
  } catch (err: any) {
    console.error('Error listing backups from Google Drive:', err);
    res.status(500).json({ error: err.message || 'Failed to list backups' });
  }
});

// 7. Restore backup from Google Drive
app.post('/api/drive/restore', async (req, res) => {
  if (!driveSession || !driveSession.tokens) {
    return res.status(401).json({ error: 'Google Drive is not linked' });
  }

  try {
    const { fileId } = req.body;
    const oauth2Client = getOAuth2Client(req);
    const drive = getDriveClient(oauth2Client);

    let targetFileId = fileId;

    if (!targetFileId) {
      // Find latest DailyHishab_Backup.json
      const listRes = await drive.files.list({
        q: "name = 'DailyHishab_Backup.json' and trashed = false",
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      if (!listRes.data.files || listRes.data.files.length === 0) {
        return res.status(404).json({ error: 'No DailyHishab backup found in Google Drive' });
      }
      targetFileId = listRes.data.files[0].id!;
    }

    const fileContentRes = await drive.files.get(
      { fileId: targetFileId, alt: 'media' },
      { responseType: 'text' }
    );

    const parsedData = typeof fileContentRes.data === 'string'
      ? JSON.parse(fileContentRes.data)
      : fileContentRes.data;

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Error restoring backup from Google Drive:', err);
    res.status(500).json({ error: err.message || 'Failed to restore backup' });
  }
});

// 8. Toggle auto sync
app.post('/api/drive/auto-sync', (req, res) => {
  if (!driveSession) {
    return res.status(401).json({ error: 'Not connected' });
  }
  const { autoSync } = req.body;
  driveSession.autoSync = !!autoSync;
  saveDriveSession(driveSession);
  res.json({ success: true, autoSync: driveSession.autoSync });
});

// --- CENTRAL DEVELOPER CLOUD VAULT STORAGE ---
const VAULT_DIR = path.join(process.cwd(), '.cloud_vault');
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

// 9. Central Cloud Vault Status
app.get('/api/cloud-vault/status', (req, res) => {
  res.json({
    available: true,
    mode: 'Central Developer Cloud Vault',
    storage: 'Firebase & Central Storage Vault',
  });
});

// 10. Central Cloud Vault Backup
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

// 11. Central Cloud Vault List Backups
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

// 12. Central Cloud Vault Restore
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

// Ensure Central Master Folder in Developer Google Drive
async function ensureGoogleDriveMasterFolder(): Promise<string | null> {
  if (!driveSession || !driveSession.tokens) return null;
  try {
    const oauth2Client = getOAuth2Client();
    const drive = getDriveClient(oauth2Client);

    const masterRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='DailyHishab_Central_Backups' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (masterRes.data.files && masterRes.data.files.length > 0) {
      return masterRes.data.files[0].id || null;
    }

    const createMaster = await drive.files.create({
      requestBody: {
        name: 'DailyHishab_Central_Backups',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    return createMaster.data.id || null;
  } catch (err) {
    console.warn('Could not ensure Google Drive Master Folder:', err);
    return null;
  }
}

// Sync backup record to user subfolder in Developer Google Drive
async function syncToGoogleDriveUserFolder(userId: string, backupRecord: any) {
  if (!driveSession || !driveSession.tokens) return;
  try {
    const masterFolderId = await ensureGoogleDriveMasterFolder();
    if (!masterFolderId) return;

    const oauth2Client = getOAuth2Client();
    const drive = getDriveClient(oauth2Client);

    // Find or create user subfolder
    let userFolderId: string | null = null;
    const userFolderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${userId}' and '${masterFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (userFolderRes.data.files && userFolderRes.data.files.length > 0) {
      userFolderId = userFolderRes.data.files[0].id || null;
    } else {
      const createUserFolder = await drive.files.create({
        requestBody: {
          name: userId,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [masterFolderId],
        },
        fields: 'id',
      });
      userFolderId = createUserFolder.data.id || null;
    }

    if (!userFolderId) return;

    // Upload / update latest.json in Google Drive
    const fileName = 'latest.json';
    const existingFileRes = await drive.files.list({
      q: `name='${fileName}' and '${userFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const fileContent = JSON.stringify(backupRecord, null, 2);
    if (existingFileRes.data.files && existingFileRes.data.files.length > 0) {
      const fileId = existingFileRes.data.files[0].id!;
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
      });
    } else {
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [userFolderId],
        },
        media: {
          mimeType: 'application/json',
          body: fileContent,
        },
      });
    }
  } catch (err) {
    console.warn(`Error syncing User ID ${userId} backup to Google Drive:`, err);
  }
}

// Rename user subfolder in Developer Google Drive
async function renameGoogleDriveUserFolder(oldUserId: string, newUserId: string) {
  if (!driveSession || !driveSession.tokens) return;
  try {
    const masterFolderId = await ensureGoogleDriveMasterFolder();
    if (!masterFolderId) return;

    const oauth2Client = getOAuth2Client();
    const drive = getDriveClient(oauth2Client);

    const userFolderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${oldUserId}' and '${masterFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (userFolderRes.data.files && userFolderRes.data.files.length > 0) {
      const folderId = userFolderRes.data.files[0].id!;
      await drive.files.update({
        fileId: folderId,
        requestBody: {
          name: newUserId,
        },
      });
    }
  } catch (err) {
    console.warn(`Error renaming Google Drive user folder from ${oldUserId} to ${newUserId}:`, err);
  }
}

// Fetch backup from user subfolder in Developer Google Drive
async function fetchBackupFromGoogleDrive(userId: string): Promise<any | null> {
  if (!driveSession || !driveSession.tokens) return null;
  try {
    const masterFolderId = await ensureGoogleDriveMasterFolder();
    if (!masterFolderId) return null;

    const oauth2Client = getOAuth2Client();
    const drive = getDriveClient(oauth2Client);

    const userFolderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${userId}' and '${masterFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (!userFolderRes.data.files || userFolderRes.data.files.length === 0) {
      return null;
    }

    const userFolderId = userFolderRes.data.files[0].id!;

    const latestFileRes = await drive.files.list({
      q: `name='latest.json' and '${userFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (!latestFileRes.data.files || latestFileRes.data.files.length === 0) {
      return null;
    }

    const fileId = latestFileRes.data.files[0].id!;
    const fileContentRes = await drive.files.get({
      fileId,
      alt: 'media',
    });

    if (fileContentRes.data) {
      const record = typeof fileContentRes.data === 'string' ? JSON.parse(fileContentRes.data) : fileContentRes.data;
      return record;
    }
  } catch (err) {
    console.warn(`Could not fetch backup from Google Drive for ${userId}:`, err);
  }
  return null;
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

    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    const entryCount = Array.isArray(payload.entries) ? payload.entries.length : 0;
    
    // Calculate summary statistics for backup overview
    let totalIncome = 0;
    let totalExpense = 0;
    if (Array.isArray(payload.entries)) {
      payload.entries.forEach((e: any) => {
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
      payload,
    };

    const filePath = path.join(userBackupDir, `${backupId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(backupRecord, null, 2));

    // Also update latest pointer
    fs.writeFileSync(path.join(userBackupDir, 'latest.json'), JSON.stringify(backupRecord, null, 2));

    // Async sync to Google Drive Central Storage Folder if connected
    syncToGoogleDriveUserFolder(cleanUserId, backupRecord).catch((e) =>
      console.warn('Google Drive sync background catch:', e)
    );

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

    // Rename Google Drive User subfolder if connected
    if (cleanOld && cleanOld !== cleanNew) {
      renameGoogleDriveUserFolder(cleanOld, cleanNew).catch((e) =>
        console.warn('Google Drive folder rename background catch:', e)
      );
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

    // Fallback: check Google Drive if local record missing
    if (!record && driveSession && driveSession.tokens) {
      const driveRecord = await fetchBackupFromGoogleDrive(cleanUserId);
      if (driveRecord) {
        record = driveRecord;
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        fs.writeFileSync(latestPath, JSON.stringify(record, null, 2));
      }
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        notFound: true,
        error: `No central cloud backup found for User ID ${cleanUserId}. Please check your 11-digit ID or perform a backup first.`,
      });
    }

    // Verify PIN if stored
    if (record.pin && record.pin !== cleanPin) {
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

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
