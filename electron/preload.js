
const { ipcRenderer, contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('app-minimize'),
  maximize: () => ipcRenderer.send('app-maximize'),
  close: () => ipcRenderer.send('app-close'),
  updateDiscordPresence: (trackInfo) => ipcRenderer.send('update-presence', trackInfo),
  // Ajout de méthodes pour déboguer l'audio
  logAudio: (message) => ipcRenderer.send('log-audio', message)
});

// All of the Node.js APIs are available in the preload process.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
