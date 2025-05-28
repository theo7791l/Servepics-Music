
// Discord RPC integration (disabled due to dependency issues)
// This file provides a fallback when discord-rpc is not available

let connected = false;

// Setup Discord RPC (fallback implementation)
function setupDiscordRPC() {
  console.log('Discord RPC is disabled due to dependency conflicts');
  console.log('To enable Discord RPC, manually install discord-rpc package');
  
  // Setup global handlers for RPC updates (no-op implementation)
  global.updateDiscordPresence = (data) => {
    console.log('Discord presence update (disabled):', data);
  };
}

// Set Discord activity (no-op implementation)
function setActivity(data = {}) {
  console.log('Discord activity set (disabled):', data);
}

module.exports = { setupDiscordRPC };
