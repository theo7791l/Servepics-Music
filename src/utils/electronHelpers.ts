
/**
 * Helper functions for Electron integration
 * Note: We are not using the register-scheme package due to installation issues
 */

/**
 * Check if we're in an Electron environment
 */
export const isElectronEnvironment = (): boolean => {
  return typeof window !== 'undefined' && window.electron !== undefined;
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
 * Open external URL safely in both Electron and browser environments
 */
export const openExternalUrl = (url: string): void => {
  if (isElectronEnvironment() && window.electron?.openExternal) {
    window.electron.openExternal(url);
  } else {
    // Fallback for browsers
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Get platform information (safely works in both Electron and browser)
 */
export const getPlatform = async (): Promise<string> => {
  if (isElectronEnvironment() && window.electron?.getPlatform) {
    return window.electron.getPlatform();
  }
  // Fallback for browsers - try to detect platform from user agent
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('windows')) return 'win32';
  if (ua.includes('macintosh')) return 'darwin';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
};

/**
 * Window control helpers that safely fallback in browser environments
 */
export const minimizeWindow = (): void => {
  if (isElectronEnvironment() && window.electron?.minimize) {
    window.electron.minimize();
  }
};

export const maximizeWindow = (): void => {
  if (isElectronEnvironment() && window.electron?.maximize) {
    window.electron.maximize();
  }
};

export const closeWindow = (): void => {
  if (isElectronEnvironment() && window.electron?.close) {
    window.electron.close();
  }
};

