
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

let electronProcess = null;
let manualRestart = false;

function startElectron() {
  const electronPath = electron;
  const args = [
    '--inspect=5858',
    path.join(__dirname, 'electron/main.js')
  ];

  // Ajout de la variable d'environnement pour le mode développement
  const env = Object.assign({}, process.env, {
    NODE_ENV: 'development',
    ELECTRON_START_URL: 'http://localhost:8080'
  });

  electronProcess = spawn(electronPath, args, { stdio: 'inherit', env });

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit();
  });
}

console.log('Démarrage de l\'application Electron...');
startElectron();
