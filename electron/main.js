const { app, BrowserWindow, protocol, session, ipcMain } = require('electron');
const path = require('path');

// ── Steamworks SDK ──────────────────────────────────────────────
// Requires a valid App ID in electron/steam_appid.txt for dev,
// or hardcoded below for production builds.
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
// Preload uses IPC to relay Steam calls to main process where
// steamClient is initialized. steamworks.js native module state
// is not shared across Electron processes.
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

  ipcMain.on('steam:isSteamDeck', (e) => {
    try {
      e.returnValue = typeof steamClient?.utils?.isSteamRunningOnSteamDeck === 'function'
        ? steamClient.utils.isSteamRunningOnSteamDeck()
        : false;
    } catch (_) { e.returnValue = false; }
  });
}

// ── Custom Protocol ─────────────────────────────────────────────
// Registers app:// so CSP 'self' works and Firebase CDN loads fine.
const appRoot = path.resolve(__dirname, '..');

function registerAppProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const rawUrl = request.url.slice('app://'.length);
    const safePath = path.normalize(decodeURIComponent(rawUrl));

    // Block path traversal attempts
    if (safePath.startsWith('..') || path.isAbsolute(safePath)) {
      callback({ error: -6 }); // NET::ERR_FILE_NOT_FOUND
      return;
    }

    const filePath = path.join(appRoot, safePath);
    if (!filePath.startsWith(appRoot + path.sep) && filePath !== appRoot) {
      callback({ error: -6 });
      return;
    }

    callback({ path: filePath });
  });
}

// ── Window ──────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Safe now — preload uses IPC, no native modules needed
    },
    title: 'Cold Creek — Gas Plant Simulator',
    icon: path.join(__dirname, '..', 'icon-512.png'),
    show: false, // Show after ready-to-show to avoid white flash
  });

  // Load via custom protocol so CSP and relative paths work
  mainWindow.loadURL('app://index.html');

  // Show when ready (no white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove menu bar in production
  if (app.isPackaged) {
    mainWindow.setMenu(null);
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
  if (steamClient) {
    try { steamClient.shutdown(); } catch (_) {}
    steamClient = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── Steam Callback Pump ─────────────────────────────────────────
// Steam overlay and achievements require periodic callback pumping
setInterval(() => {
  if (steamClient) {
    try { steamClient.runCallbacks(); } catch (_) {}
  }
}, 100);
