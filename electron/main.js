const { app, BrowserWindow, protocol, net, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ── Steamworks SDK ──────────────────────────────────────────────
const STEAM_APP_ID = 0; // Replace with real App ID after Steam Direct
let steamClient = null;

function initSteam() {
  try {
    const steamworks = require('steamworks.js');
    steamClient = steamworks.init(STEAM_APP_ID);
    console.log('[Steam] Initialized — logged in as:', steamClient.localplayer.getName());
    return true;
  } catch (e) {
    console.warn('[Steam] Init failed (dev mode or Steam not running):', e.message);
    return false;
  }
}

// ── Steam IPC Handlers ──────────────────────────────────────────
function registerSteamIPC() {
  ipcMain.on('steam:isAvailable', (e) => {
    e.returnValue = !!steamClient;
  });

  ipcMain.on('steam:getPersonaName', (e) => {
    try { e.returnValue = steamClient?.localplayer?.getName() ?? null; }
    catch (_) { e.returnValue = null; }
  });

  ipcMain.on('steam:getSteamId', (e) => {
    try { e.returnValue = steamClient?.localplayer?.getSteamId()?.steamId64?.toString() ?? null; }
    catch (_) { e.returnValue = null; }
  });

  ipcMain.on('steam:activateAchievement', (e, name) => {
    try { steamClient?.achievement?.activate(name); e.returnValue = true; }
    catch (_) { e.returnValue = false; }
  });

  ipcMain.on('steam:clearAchievement', (e, name) => {
    if (app.isPackaged) { e.returnValue = false; return; }
    try { steamClient?.achievement?.clear(name); e.returnValue = true; }
    catch (_) { e.returnValue = false; }
  });

  ipcMain.on('steam:isAchievementActivated', (e, name) => {
    try { e.returnValue = steamClient?.achievement?.isActivated(name) ?? false; }
    catch (_) { e.returnValue = false; }
  });

  ipcMain.on('steam:writeCloudFile', (e, filename, data) => {
    try {
      const buffer = Buffer.from(data, 'utf-8');
      steamClient?.cloud?.writeFile(filename, buffer);
      e.returnValue = true;
    } catch (_) { e.returnValue = false; }
  });

  ipcMain.on('steam:readCloudFile', (e, filename) => {
    try {
      const buffer = steamClient?.cloud?.readFile(filename);
      e.returnValue = buffer ? buffer.toString('utf-8') : null;
    } catch (_) { e.returnValue = null; }
  });

  ipcMain.on('steam:isCloudEnabled', (e) => {
    try { e.returnValue = steamClient?.cloud?.isEnabledForApp() ?? false; }
    catch (_) { e.returnValue = false; }
  });

  ipcMain.on('steam:activateOverlay', (e, dialog) => {
    try { steamClient?.overlay?.activate(dialog || 'friends'); } catch (_) {}
  });

  // ── Window Controls ──
  ipcMain.on('win:minimize', () => { mainWindow?.minimize(); });
  ipcMain.on('win:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('win:close', () => { mainWindow?.close(); });

  ipcMain.on('steam:isSteamDeck', (e) => {
    try {
      e.returnValue = typeof steamClient?.utils?.isSteamRunningOnSteamDeck === 'function'
        ? steamClient.utils.isSteamRunningOnSteamDeck()
        : false;
    } catch (_) { e.returnValue = false; }
  });
}

// ── Custom Protocol ─────────────────────────────────────────────
// Register app:// as privileged BEFORE app ready (required by Electron 33+)
const appRoot = path.resolve(__dirname, '..');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: false,
  }
}]);

// MIME type lookup for common file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'text/xml',
};

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    let urlPath = new URL(request.url).pathname;

    // Default to index.html for root
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

    // Decode and normalize
    const decoded = decodeURIComponent(urlPath).replace(/^\//, '');
    const safePath = path.normalize(decoded);

    // Block path traversal
    if (safePath.startsWith('..') || path.isAbsolute(safePath)) {
      return new Response('Not Found', { status: 404 });
    }

    const filePath = path.join(appRoot, safePath);
    if (!filePath.startsWith(appRoot + path.sep) && filePath !== appRoot) {
      return new Response('Not Found', { status: 404 });
    }

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return new Response('Not Found', { status: 404 });
    }

    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Return file as response
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

// ── Window ──────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  const winOpts = {
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#1a1a1a',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: 'Cold Creek — Gas Plant Simulator',
    icon: path.join(__dirname, '..', 'icon-512.png'),
    show: false,
  };

  // Windows: use native titlebar overlay for min/max/close
  if (process.platform === 'win32') {
    winOpts.titleBarOverlay = { color: '#1a1a1a', symbolColor: '#808080', height: 32 };
  }

  mainWindow = new BrowserWindow(winOpts);

  // Load via custom protocol so relative paths and Firebase CDN work
  mainWindow.loadURL('app://coldcreek/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.setMenu(null);

  // Open DevTools in dev mode with workspace auto-save
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'bottom' });

    // Inject debug overlay (F2 crosshair + element inspector)
    mainWindow.webContents.on('did-finish-load', () => {
      const overlayCode = fs.readFileSync(path.join(__dirname, 'debug-overlay.js'), 'utf-8');
      mainWindow.webContents.executeJavaScript(overlayCode).catch(() => {});
    });

    // Watch style.css for changes from DevTools or external edits and hot-reload
    const cssPath = path.join(appRoot, 'style.css');
    fs.watch(cssPath, { persistent: false }, () => {
      mainWindow.webContents.executeJavaScript(`
        document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
          l.href = l.href.replace(/\\?.*|$/, '?r=' + Date.now());
        });
      `).catch(() => {});
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App Lifecycle ───────────────────────────────────────────────
app.whenReady().then(() => {
  registerAppProtocol();
  initSteam();
  registerSteamIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (steamCallbackInterval) {
    clearInterval(steamCallbackInterval);
    steamCallbackInterval = null;
  }
  if (steamClient) {
    try { steamClient.shutdown(); } catch (_) {}
    steamClient = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── Steam Callback Pump ─────────────────────────────────────────
let steamCallbackInterval = setInterval(() => {
  if (steamClient) {
    try { steamClient.runCallbacks(); } catch (_) {}
  }
}, 100);
