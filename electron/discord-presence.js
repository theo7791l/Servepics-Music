
// Simple Discord RPC integration
const DiscordRPC = require('discord-rpc');

// Discord Application Client ID
const clientId = '1234567890123456789'; // Replace with your actual Discord application client ID

// Initialize RPC
let rpc = null;
let connected = false;

// Setup Discord RPC
function setupDiscordRPC() {
  try {
    // Create client
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    
    // Register event handlers
    rpc.on('ready', () => {
      console.log('Discord RPC connected');
      connected = true;
      
      // Set initial activity
      setActivity({
        title: "Music Player",
        artist: "Idle"
      });
    });
    
    // Connect to Discord
    rpc.login({ clientId }).catch(console.error);
    
    // Setup global handlers for RPC updates
    global.updateDiscordPresence = (data) => {
      setActivity(data);
    };
  } catch (error) {
    console.error('Failed to initialize Discord RPC:', error);
  }
}

// Set Discord activity
function setActivity(data = {}) {
  if (!connected || !rpc) return;
  
  try {
    const { title, artist } = data;
    
    rpc.setActivity({
      details: title || 'Idle',
      state: artist ? `by ${artist}` : 'Not playing',
      largeImageKey: 'app_logo',
      largeImageText: 'Music Player',
      smallImageKey: 'play',
      smallImageText: 'Playing',
      instance: false,
    }).catch(console.error);
  } catch (error) {
    console.error('Failed to set Discord activity:', error);
  }
}

module.exports = { setupDiscordRPC };
