
const { ipcRenderer } = require('electron');

// Fonction pour mettre à jour la présence Discord
function updateDiscordPresence(trackInfo) {
  ipcRenderer.send('update-presence', trackInfo);
}

// Rendre la fonction disponible globalement
window.updateDiscordPresence = updateDiscordPresence;

// Écouter les événements de lecture
document.addEventListener('DOMContentLoaded', () => {
  // Observer les changements dans le titre de la page pour détecter les changements de piste
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && document.title.includes('-')) {
        const [artist, title] = document.title.split(' - ');
        updateDiscordPresence({ title, artist });
      }
    }
  });

  observer.observe(document.querySelector('title'), {
    childList: true
  });
});
