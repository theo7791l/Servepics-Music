const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Garde une référence globale de l'objet window, sinon la fenêtre sera
// fermée automatiquement quand l'objet JavaScript sera collecté par le GC.
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Pour un design plus moderne
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#121212', // Couleur de fond sombre pour correspondre au thème
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // et charger le fichier index.html de l'application.
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Ouvrir les DevTools en mode développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Émis lorsque la fenêtre est fermée.
  mainWindow.on('closed', function () {
    // Dé-référence l'objet window, habituellement vous stockeriez les fenêtres
    // dans un tableau si votre application supporte le multi-fenêtre. C'est le moment
    // où vous devez supprimer l'élément correspondant.
    mainWindow = null;
  });
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigateur.
// Certaines APIs peuvent être utilisées uniquement après cet événement.
app.whenReady().then(createWindow);

// Quitter quand toutes les fenêtres sont fermées.
app.on('window-all-closed', function () {
  // Sur macOS, il est commun pour une application et leur barre de menu
  // de rester active tant que l'utilisateur ne quitte pas explicitement avec Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // Sur macOS, il est commun de re-créer une fenêtre de l'application quand
  // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes.
  if (mainWindow === null) createWindow();
});

// Dans ce fichier, vous pouvez inclure le reste du code spécifique au processus principal de
// votre application. Vous pouvez également le mettre dans des fichiers séparés et les inclure ici.

// Gérer l'intégration Discord Rich Presence
let discordRPC;
try {
  discordRPC = require('discord-rpc');
} catch (e) {
  console.log('Discord RPC non disponible');
}

if (discordRPC) {
  const clientId = '1234567890123456789'; // Remplacez par votre ID client Discord
  
  // Initialiser Discord Rich Presence
  const rpc = new discordRPC.Client({ transport: 'ipc' });
  
  rpc.on('ready', () => {
    console.log('Discord RPC connecté');
    
    // Mettre à jour la présence
    rpc.setActivity({
      details: 'NeonWave Music Player',
      state: 'En écoute',
      largeImageKey: 'app_logo',
      largeImageText: 'NeonWave Music',
      smallImageKey: 'playing_icon',
      smallImageText: 'Écoute de la musique',
      instance: false,
    });
  });

  // Connexion à Discord
  rpc.login({ clientId }).catch(console.error);
  
  // Mettre à jour la présence lorsqu'une piste est jouée
  ipcMain.on('update-presence', (event, trackInfo) => {
    if (rpc) {
      rpc.setActivity({
        details: trackInfo.title || 'NeonWave Music Player',
        state: `Par ${trackInfo.artist || 'Artiste inconnu'}`,
        largeImageKey: 'app_logo',
        largeImageText: 'NeonWave Music',
        smallImageKey: 'playing_icon',
        smallImageText: 'En écoute',
        instance: false,
      });
    }
  });
}

// Fonctions spécifiques pour l'application desktop
ipcMain.on('app-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('app-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('app-close', () => {
  if (mainWindow) mainWindow.close();
});
