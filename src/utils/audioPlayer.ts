
// Utilitaires pour la gestion audio multi-environnement

interface AudioSource {
  url: string;
  type: 'direct' | 'proxy' | 'fallback';
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

  // Dans Electron, on peut utiliser les URLs directement
  if (isElectronEnvironment()) {
    return await getDirectAudioUrl(videoId, invidiousInstances);
  }

  // Dans le navigateur, on doit utiliser des alternatives
  return await getBrowserCompatibleUrl(videoId);
};

/**
 * Récupère l'URL audio directe pour Electron
 */
const getDirectAudioUrl = async (videoId: string, instances: string[]): Promise<AudioSource | null> => {
  for (const instance of instances) {
    try {
      const url = `${instance}/api/v1/videos/${videoId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      const audioFormats = data.adaptiveFormats
        .filter((format: any) => format.type.startsWith('audio/'))
        .sort((a: any, b: any) => b.bitrate - a.bitrate);
      
      if (audioFormats.length > 0) {
        return {
          url: audioFormats[0].url,
          type: 'direct'
        };
      }
    } catch (error) {
      console.warn(`Failed to get audio from ${instance}:`, error);
    }
  }
  
  return null;
};

/**
 * Récupère une URL compatible navigateur (avec proxy ou fallback)
 */
const getBrowserCompatibleUrl = async (videoId: string): Promise<AudioSource | null> => {
  // Option 1: Essayer avec un proxy CORS
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const invidiousUrl = `https://invidious.fdn.fr/api/v1/videos/${videoId}`;
    const proxiedUrl = corsProxy + encodeURIComponent(invidiousUrl);
    
    const response = await fetch(proxiedUrl);
    if (response.ok) {
      const data = await response.json();
      const audioFormats = data.adaptiveFormats
        .filter((format: any) => format.type.startsWith('audio/'))
        .sort((a: any, b: any) => b.bitrate - a.bitrate);
      
      if (audioFormats.length > 0) {
        return {
          url: corsProxy + encodeURIComponent(audioFormats[0].url),
          type: 'proxy'
        };
      }
    }
  } catch (error) {
    console.warn('Proxy method failed:', error);
  }

  // Option 2: Fallback avec un service alternatif ou message d'erreur
  console.warn('No compatible audio source found for browser environment');
  return null;
};

/**
 * Teste si une URL audio est accessible
 */
export const testAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
