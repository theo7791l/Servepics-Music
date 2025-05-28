
// Système de codes d'erreur centralisé pour l'application

export enum ErrorCode {
  // Erreurs audio (1000-1099)
  AUDIO_CORS_BLOCKED = 'A1001',
  AUDIO_SOURCE_UNAVAILABLE = 'A1002',
  AUDIO_PLAYBACK_FAILED = 'A1003',
  AUDIO_LOADING_TIMEOUT = 'A1004',
  AUDIO_FORMAT_UNSUPPORTED = 'A1005',
  AUDIO_NETWORK_ERROR = 'A1006',
  
  // Erreurs API (2000-2099)
  API_INVIDIOUS_UNAVAILABLE = 'A2001',
  API_SEARCH_FAILED = 'A2002',
  API_VIDEO_NOT_FOUND = 'A2003',
  API_RATE_LIMITED = 'A2004',
  API_INVALID_RESPONSE = 'A2005',
  
  // Erreurs navigateur (3000-3099)
  BROWSER_COMPATIBILITY = 'B3001',
  BROWSER_AUTOPLAY_BLOCKED = 'B3002',
  BROWSER_PERMISSIONS_DENIED = 'B3003',
  
  // Erreurs utilisateur (4000-4099)
  USER_NOT_AUTHENTICATED = 'U4001',
  USER_INVALID_CREDENTIALS = 'U4002',
  USER_PLAYLIST_NOT_FOUND = 'U4003',
  
  // Erreurs génériques (9000-9099)
  UNKNOWN_ERROR = 'G9001',
  NETWORK_OFFLINE = 'G9002',
  TIMEOUT = 'G9003'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export const createError = (
  code: ErrorCode, 
  message: string, 
  details?: string, 
  context?: Record<string, any>
): AppError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  context
});

export const getErrorMessage = (code: ErrorCode): string => {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.AUDIO_CORS_BLOCKED]: "Lecture bloquée par les restrictions CORS du navigateur",
    [ErrorCode.AUDIO_SOURCE_UNAVAILABLE]: "Source audio indisponible",
    [ErrorCode.AUDIO_PLAYBACK_FAILED]: "Échec de la lecture audio",
    [ErrorCode.AUDIO_LOADING_TIMEOUT]: "Timeout lors du chargement audio",
    [ErrorCode.AUDIO_FORMAT_UNSUPPORTED]: "Format audio non supporté",
    [ErrorCode.AUDIO_NETWORK_ERROR]: "Erreur réseau lors du chargement audio",
    
    [ErrorCode.API_INVIDIOUS_UNAVAILABLE]: "Toutes les instances Invidious sont indisponibles",
    [ErrorCode.API_SEARCH_FAILED]: "Échec de la recherche",
    [ErrorCode.API_VIDEO_NOT_FOUND]: "Vidéo non trouvée",
    [ErrorCode.API_RATE_LIMITED]: "Trop de requêtes, veuillez patienter",
    [ErrorCode.API_INVALID_RESPONSE]: "Réponse API invalide",
    
    [ErrorCode.BROWSER_COMPATIBILITY]: "Navigateur non compatible",
    [ErrorCode.BROWSER_AUTOPLAY_BLOCKED]: "Autoplay bloqué par le navigateur",
    [ErrorCode.BROWSER_PERMISSIONS_DENIED]: "Permissions refusées",
    
    [ErrorCode.USER_NOT_AUTHENTICATED]: "Utilisateur non authentifié",
    [ErrorCode.USER_INVALID_CREDENTIALS]: "Identifiants invalides",
    [ErrorCode.USER_PLAYLIST_NOT_FOUND]: "Playlist non trouvée",
    
    [ErrorCode.UNKNOWN_ERROR]: "Erreur inconnue",
    [ErrorCode.NETWORK_OFFLINE]: "Connexion réseau indisponible",
    [ErrorCode.TIMEOUT]: "Délai d'attente dépassé"
  };
  
  return messages[code] || "Erreur inconnue";
};

export const logError = (error: AppError): void => {
  console.error(`[${error.code}] ${error.message}`, {
    details: error.details,
    timestamp: error.timestamp,
    context: error.context
  });
};
