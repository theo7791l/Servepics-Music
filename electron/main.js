
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { setupDiscordRPC } = require('./discord-presence');

// Keep a global reference of the window object
let mainWindow;

// Setup logs directory
const userDataPath = app.getPath('userData');
const logsPath = path.join(userDataPath, 'logs');

if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const logFile = path.join(logsPath, `servepics-music-${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(logMessage);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Load the app - production build or dev server
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null;
    logStream.end();
  });

  // Setup Discord RPC
  setupDiscordRPC();
}

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logStream.end();
    app.quit();
  }
});

// IPC handling
ipcMain.on('audio-log', (event, message) => {
  log(`[AUDIO] ${message}`);
});

ipcMain.on('update-discord-presence', (event, data) => {
  log(`[DISCORD] Updating presence: ${data.title} - ${data.artist}`);
  if (global.updateDiscordPresence) {
    global.updateDiscordPresence(data);
  }
});

// Handle URL opening requests from renderer
ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url).catch(err => {
    log(`Error opening URL: ${err}`);
  });
});

// Add window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
    log('[WINDOW] Minimized window');
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      log('[WINDOW] Unmaximized window');
    } else {
      mainWindow.maximize();
      log('[WINDOW] Maximized window');
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
    log('[WINDOW] Closed window');
  }
});
