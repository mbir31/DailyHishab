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
