
// Utilitaires pour la gestion audio multi-environnement avec codes d'erreur

import { ErrorCode, createError, logError } from './errorCodes';

interface AudioSource {
  url: string;
  type: 'direct' | 'proxy' | 'fallback';
}

interface AudioPlayerError extends Error {
  code: ErrorCode;
  details?: string;
}

/**
 * Détecte si nous sommes dans un environnement Electron ou navigateur
 */
export const isElectronEnvironment = (): boolean => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

/**
 * Détecte si nous sommes en mode développement
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Obtient une URL audio compatible avec l'environnement actuel
 */
export const getCompatibleAudioUrl = async (videoId: string): Promise<AudioSource | null> => {
  const invidiousInstances = [
    'https://invidious.fdn.fr',
    'https://y.com.sb',
    'https://invidious.slipfox.xyz',
    'https://invidious.privacydev.net',
    'https://vid.puffyan.us',
    'https://inv.namazso.eu',
    'https://yt.artemislena.eu'
  ];

  try {
    // Dans Electron, on peut utiliser les URLs directement
    if (isElectronEnvironment()) {
      console.log(`[AUDIO] Environment: Electron, trying direct access for video ${videoId}`);
      return await getDirectAudioUrl(videoId, invidiousInstances);
    }

    // Dans le navigateur, essayer différentes approches
    console.log(`[AUDIO] Environment: Browser, trying browser-compatible methods for video ${videoId}`);
    return await getBrowserCompatibleUrl(videoId, invidiousInstances);
  } catch (error) {
    const appError = createError(
      ErrorCode.AUDIO_SOURCE_UNAVAILABLE,
      'Impossible de récupérer une source audio compatible',
      error instanceof Error ? error.message : 'Unknown error',
      { videoId, environment: isElectronEnvironment() ? 'electron' : 'browser' }
    );
    logError(appError);
    return null;
  }
};

/**
 * Récupère l'URL audio directe pour Electron
 */
const getDirectAudioUrl = async (videoId: string, instances: string[]): Promise<AudioSource | null> => {
  for (const instance of instances) {
    try {
      console.log(`[AUDIO] Trying direct access from ${instance} for video ${videoId}`);
      const url = `${instance}/api/v1/videos/${videoId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'MusicApp/1.0'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      const audioFormats = data.adaptiveFormats
        ?.filter((format: any) => format.type?.startsWith('audio/'))
        ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      
      if (audioFormats && audioFormats.length > 0) {
        console.log(`[AUDIO] Direct audio URL found from ${instance}`);
        return {
          url: audioFormats[0].url,
          type: 'direct'
        };
      }
    } catch (error) {
      console.warn(`[AUDIO] Failed to get audio from ${instance}:`, error);
      const appError = createError(
        ErrorCode.API_INVIDIOUS_UNAVAILABLE,
        `Instance ${instance} unavailable`,
        error instanceof Error ? error.message : 'Unknown error',
        { instance, videoId }
      );
      logError(appError);
    }
  }
  
  return null;
};

/**
 * Récupère une URL compatible navigateur
 */
const getBrowserCompatibleUrl = async (videoId: string, instances: string[]): Promise<AudioSource | null> => {
  // Méthode 1: Essayer les instances directement (certaines ont CORS activé)
  for (const instance of instances) {
    try {
      console.log(`[AUDIO] Trying direct browser access from ${instance}`);
      const url = `${instance}/api/v1/videos/${videoId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const audioFormats = data.adaptiveFormats
          ?.filter((format: any) => format.type?.startsWith('audio/'))
          ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
        
        if (audioFormats && audioFormats.length > 0) {
          console.log(`[AUDIO] Browser-compatible URL found from ${instance}`);
          return {
            url: audioFormats[0].url,
            type: 'direct'
          };
        }
      }
    } catch (error) {
      console.warn(`[AUDIO] Browser access failed for ${instance}:`, error);
      
      // Si c'est une erreur CORS, on le note spécifiquement
      if (error instanceof Error && error.message.includes('CORS')) {
        const appError = createError(
          ErrorCode.AUDIO_CORS_BLOCKED,
          'CORS blocked browser access',
          error.message,
          { instance, videoId }
        );
        logError(appError);
      }
    }
  }

  // Méthode 2: Essayer avec un proxy CORS (dernière option)
  try {
    console.log(`[AUDIO] Trying CORS proxy for video ${videoId}`);
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const invidiousUrl = `https://y.com.sb/api/v1/videos/${videoId}`;
    const proxiedUrl = corsProxy + encodeURIComponent(invidiousUrl);
    
    const response = await fetch(proxiedUrl);
    if (response.ok) {
      const data = await response.json();
      const audioFormats = data.adaptiveFormats
        ?.filter((format: any) => format.type?.startsWith('audio/'))
        ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      
      if (audioFormats && audioFormats.length > 0) {
        console.log(`[AUDIO] Proxy URL found for video ${videoId}`);
        return {
          url: corsProxy + encodeURIComponent(audioFormats[0].url),
          type: 'proxy'
        };
      }
    }
  } catch (error) {
    console.warn('[AUDIO] Proxy method failed:', error);
    const appError = createError(
      ErrorCode.AUDIO_NETWORK_ERROR,
      'Proxy method failed',
      error instanceof Error ? error.message : 'Unknown error',
      { videoId }
    );
    logError(appError);
  }

  // Aucune méthode n'a fonctionné
  const appError = createError(
    ErrorCode.BROWSER_COMPATIBILITY,
    'No compatible audio source found for browser environment',
    'All methods failed to retrieve audio URL',
    { videoId, environment: 'browser' }
  );
  logError(appError);
  
  return null;
};

/**
 * Teste si une URL audio est accessible
 */
export const testAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    return response.ok;
  } catch (error) {
    console.warn('[AUDIO] URL test failed:', error);
    return false;
  }
};
