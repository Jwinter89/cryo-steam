const { contextBridge, ipcRenderer } = require('electron');

// ── Steam API Bridge ────────────────────────────────────────────
// Exposes Steam functionality to the renderer (game) via window.steam.
// All calls relay to the main process via IPC where steamworks.js
// is initialized. The preload never loads native modules directly.

contextBridge.exposeInMainWorld('steam', {
  // ── Status ──
  isAvailable: () => ipcRenderer.sendSync('steam:isAvailable'),

  // ── Player Info ──
  getSteamId: () => ipcRenderer.sendSync('steam:getSteamId'),
  getPersonaName: () => ipcRenderer.sendSync('steam:getPersonaName'),

  // ── Achievements ──
  activateAchievement: (name) => ipcRenderer.sendSync('steam:activateAchievement', name),
  clearAchievement: (name) => ipcRenderer.sendSync('steam:clearAchievement', name),
  isAchievementActivated: (name) => ipcRenderer.sendSync('steam:isAchievementActivated', name),

  // ── Cloud Saves ──
  writeCloudFile: (filename, data) => ipcRenderer.sendSync('steam:writeCloudFile', filename, data),
  readCloudFile: (filename) => ipcRenderer.sendSync('steam:readCloudFile', filename),
  isCloudEnabled: () => ipcRenderer.sendSync('steam:isCloudEnabled'),

  // ── Overlay ──
  activateOverlay: (dialog) => ipcRenderer.send('steam:activateOverlay', dialog),

  // ── Platform Detection ──
  isElectron: true,
  isSteamDeck: () => ipcRenderer.sendSync('steam:isSteamDeck'),
});
