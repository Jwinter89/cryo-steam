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

  // ── Achievements (fire-and-forget — no renderer blocking) ──
  activateAchievement: (name) => ipcRenderer.send('steam:activateAchievement', name),
  clearAchievement: (name) => ipcRenderer.send('steam:clearAchievement', name),
  isAchievementActivated: (name) => ipcRenderer.sendSync('steam:isAchievementActivated', name),

  // ── Cloud Saves (writes are fire-and-forget, reads need return value) ──
  writeCloudFile: (filename, data) => ipcRenderer.send('steam:writeCloudFile', filename, data),
  readCloudFile: (filename) => ipcRenderer.sendSync('steam:readCloudFile', filename),
  isCloudEnabled: () => ipcRenderer.sendSync('steam:isCloudEnabled'),

  // ── Overlay ──
  activateOverlay: (dialog) => ipcRenderer.send('steam:activateOverlay', dialog),

  // ── Platform Detection ──
  isElectron: true,
  isSteamDeck: () => ipcRenderer.sendSync('steam:isSteamDeck'),

  // ── Window Controls ──
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
});
