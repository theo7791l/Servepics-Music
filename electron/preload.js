
const { contextBridge, ipcRenderer, shell } = require('electron');
const os = require('os');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  logAudio: (message) => {
    ipcRenderer.send('audio-log', message);
  },
  updateDiscordPresence: (data) => {
    ipcRenderer.send('update-discord-presence', data);
  },
  openExternal: (url) => {
    shell.openExternal(url);
  },
  getPlatform: () => {
    return Promise.resolve(process.platform);
  }
});
