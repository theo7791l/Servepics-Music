
/**
 * Helper functions for Electron integration
 */

/**
 * Check if we're in an Electron environment
 */
export const isElectronEnvironment = (): boolean => {
  return window.electron !== undefined;
};

/**
 * Log audio-related messages
 */
export const logAudio = (message: string): void => {
  console.log(`[AUDIO] ${message}`);
  if (isElectronEnvironment() && window.electron?.logAudio) {
    window.electron.logAudio(message);
  }
};

/**
 * Update Discord Rich Presence if available
 */
export const updateDiscordPresence = (title: string, artist: string): void => {
  if (isElectronEnvironment() && window.electron?.updateDiscordPresence) {
    window.electron.updateDiscordPresence({
      title,
      artist
    });
    logAudio(`Updating Discord presence for: ${title} - ${artist}`);
  }
};

/**
 * Open external URL if in Electron environment
 */
export const openExternalUrl = (url: string): void => {
  if (isElectronEnvironment() && window.electron?.openExternal) {
    window.electron.openExternal(url);
  } else {
    // Fallback for browsers
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
