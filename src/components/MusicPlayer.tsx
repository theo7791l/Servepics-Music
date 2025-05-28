import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { toast } from '@/hooks/use-toast';
import { getCompatibleAudioUrl, isElectronEnvironment } from '@/utils/audioPlayer';
import { ErrorCode, createError, logError, getErrorMessage } from '@/utils/errorCodes';
import BrowserCompatibilityWarning from './BrowserCompatibilityWarning';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  videoId?: string;
}

interface MusicPlayerProps {
  currentTrack: Track | null;
  onNext?: () => void;
  onPrevious?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  currentTrack, 
  onNext = () => {}, 
  onPrevious = () => {} 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(!isElectronEnvironment());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Envoyer les logs audio
  const logAudio = (message: string) => {
    console.log(`[AUDIO] ${message}`);
    if (isElectronEnvironment() && window.electron?.logAudio) {
      window.electron.logAudio(message);
    }
  };
  
  // Mettre à jour la présence Discord si disponible
  const updateDiscordPresence = (track: Track) => {
    if (isElectronEnvironment() && window.electron?.updateDiscordPresence) {
      window.electron.updateDiscordPresence({
        title: track.title,
        artist: track.artist
      });
      logAudio(`Updating Discord presence for: ${track.title} - ${track.artist}`);
    }
  };
  
  const handleAudioError = (code: ErrorCode, message: string, details?: string) => {
    const error = createError(code, message, details, { 
      track: currentTrack?.title,
      environment: isElectronEnvironment() ? 'electron' : 'browser'
    });
    logError(error);
    setErrorCode(code);
    setAudioError(`[${code}] ${getErrorMessage(code)}`);
    setIsPlaying(false);
    setAudioLoading(false);
  };

  const createAudioElement = (): HTMLAudioElement => {
    const audio = new Audio();
    
    audio.addEventListener('error', (e) => {
      const error = (e.target as HTMLAudioElement).error;
      const errorMessage = error?.message || 'Unknown audio error';
      logAudio(`Audio error event: ${error?.code} - ${errorMessage}`);
      
      // Mapper les codes d'erreur HTML5 vers nos codes
      let code = ErrorCode.AUDIO_PLAYBACK_FAILED;
      if (error?.code === MediaError.MEDIA_ERR_NETWORK) {
        code = ErrorCode.AUDIO_NETWORK_ERROR;
      } else if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        code = ErrorCode.AUDIO_FORMAT_UNSUPPORTED;
      }
      
      handleAudioError(code, 'Audio playback failed', errorMessage);
    });
    
    audio.addEventListener('loadstart', () => {
      logAudio('Audio loading started');
      setAudioLoading(true);
      setAudioError(null);
      setErrorCode(null);
    });
    
    audio.addEventListener('loadeddata', () => {
      logAudio('Audio data loaded successfully');
      setAudioLoading(false);
    });
    
    audio.addEventListener('canplay', () => {
      logAudio('Audio ready to play');
      setAudioLoading(false);
    });
    
    audio.addEventListener('loadedmetadata', () => {
      logAudio(`Audio metadata loaded - Duration: ${audio.duration}s`);
    });
    
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    return audio;
  };

  // Setup audio element when component mounts
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = createAudioElement();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (!currentTrack || !currentTrack.videoId || !audioRef.current) {
      return;
    }
    
    logAudio(`Setting new track: ${currentTrack.title} - Video ID: ${currentTrack.videoId}`);
    
    // Reset states
    setAudioError(null);
    setErrorCode(null);
    setAudioLoading(true);
    setProgress(0);
    
    // Récupérer l'URL audio compatible avec l'environnement
    const loadAudio = async () => {
      try {
        const audioSource = await getCompatibleAudioUrl(currentTrack.videoId!);
        
        if (!audioSource || !audioRef.current) {
          handleAudioError(
            ErrorCode.AUDIO_SOURCE_UNAVAILABLE,
            'No compatible audio source found',
            `Failed to get audio URL for video ${currentTrack.videoId}`
          );
          return;
        }
        
        logAudio(`Got compatible audio URL: ${audioSource.url} (type: ${audioSource.type})`);
        
        // Set audio source and options
        audioRef.current.src = audioSource.url;
        audioRef.current.volume = volume / 100;
        audioRef.current.crossOrigin = "anonymous";
        
        // Update Discord presence
        updateDiscordPresence(currentTrack);
        
        // Attempt to load and play
        audioRef.current.load();
        
        // Attendre que l'audio soit prêt avant de jouer
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              logAudio('Playback started successfully');
              setIsPlaying(true);
              setAudioError(null);
              setErrorCode(null);
              setAudioLoading(false);
            })
            .catch(error => {
              logAudio(`Playback failed: ${error.message}`);
              
              if (error.name === 'NotAllowedError') {
                handleAudioError(
                  ErrorCode.BROWSER_AUTOPLAY_BLOCKED,
                  'Autoplay blocked by browser',
                  error.message
                );
              } else if (!isElectronEnvironment()) {
                handleAudioError(
                  ErrorCode.BROWSER_COMPATIBILITY,
                  'Browser compatibility issue',
                  error.message
                );
              } else {
                handleAudioError(
                  ErrorCode.AUDIO_PLAYBACK_FAILED,
                  'Audio playback failed',
                  error.message
                );
              }
            });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logAudio(`Error getting compatible audio URL: ${errorMessage}`);
        handleAudioError(
          ErrorCode.AUDIO_SOURCE_UNAVAILABLE,
          'Failed to get audio source',
          errorMessage
        );
      }
    };
    
    loadAudio();
  }, [currentTrack, volume]);

  // Start/stop progress tracking based on play state
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(isNaN(currentProgress) ? 0 : currentProgress);
          
          // Handle track end
          if (audioRef.current.ended) {
            if (isRepeat) {
              audioRef.current.currentTime = 0;
              audioRef.current.play()
                .then(() => logAudio('Repeat: track restarted'))
                .catch(err => logAudio(`Repeat playback error: ${err.message}`));
            } else {
              setIsPlaying(false);
              logAudio('Track ended, playing next');
              onNext();
            }
          }
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isRepeat, onNext]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      logAudio(`Volume changed to ${volume}%`);
    }
  }, [volume]);

  const togglePlay = () => {
    if (!currentTrack || !currentTrack.videoId) {
      toast({
        title: "Erreur de lecture",
        description: `[${ErrorCode.AUDIO_SOURCE_UNAVAILABLE}] Aucun titre audio disponible`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (isPlaying) {
      logAudio('Playback paused by user');
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      logAudio('User attempting to play');
      
      if (!audioRef.current) {
        audioRef.current = createAudioElement();
      }
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logAudio('Manual play successful');
            setAudioError(null);
            setErrorCode(null);
            setIsPlaying(true);
          })
          .catch(error => {
            logAudio(`Manual play failed: ${error.message}`);
            
            if (error.name === 'NotAllowedError') {
              handleAudioError(
                ErrorCode.BROWSER_AUTOPLAY_BLOCKED,
                'User interaction required',
                error.message
              );
              toast({
                title: "Interaction requise",
                description: `[${ErrorCode.BROWSER_AUTOPLAY_BLOCKED}] Cliquez sur play pour activer le son`,
                duration: 5000,
              });
            } else {
              handleAudioError(
                ErrorCode.AUDIO_PLAYBACK_FAILED,
                'Playback failed',
                error.message
              );
            }
          });
      }
    }
  };

  const handleProgressChange = (values: number[]) => {
    if (!audioRef.current || !currentTrack) return;
    
    const newPosition = values[0];
    const newTime = (newPosition / 100) * (audioRef.current.duration || 0);
    
    logAudio(`Progress changed to ${newPosition}% (${newTime}s)`);
    audioRef.current.currentTime = newTime;
    setProgress(newPosition);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calculate current time from progress
  const currentTime = currentTrack 
    ? formatTime((progress / 100) * currentTrack.duration)
    : '0:00';
  
  const totalTime = currentTrack 
    ? formatTime(currentTrack.duration)
    : '0:00';
  
  // Equalizer effect - only visible when playing
  const renderEqualizer = () => {
    if (!isPlaying) return null;
    
    return (
      <div className="flex items-end h-8 gap-[2px] mx-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div 
            key={i}
            className={`eq-bar eq-bar-${i} w-1 bg-electricBlue rounded-t-sm`}
            style={{ 
              animationDuration: `${0.5 + Math.random() * 0.7}s`,
              height: `${15 + Math.random() * 70}%` 
            }}
          ></div>
        ))}
      </div>
    );
  };

  // If no track is playing, show placeholder
  if (!currentTrack) {
    return (
      <div className="relative bg-muted/20 rounded-xl border border-primary/20 p-4 backdrop-blur-sm">
        <div className="text-center py-4">
          <p className="text-muted-foreground">Aucun titre en lecture</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative bg-muted/20 rounded-xl border border-primary/20 p-4 backdrop-blur-sm">
      {showBrowserWarning && (
        <div className="mb-4">
          <BrowserCompatibilityWarning onClose={() => setShowBrowserWarning(false)} />
        </div>
      )}
      
      {audioError && (
        <div className="absolute top-0 left-0 right-0 bg-destructive/90 text-white text-center py-2 text-xs rounded-t-xl z-10">
          <div className="font-mono">{audioError}</div>
          {errorCode && (
            <div className="text-xs opacity-75 mt-1">
              Code: {errorCode} | Env: {isElectronEnvironment() ? 'Electron' : 'Browser'}
            </div>
          )}
        </div>
      )}
      
      {audioLoading && (
        <div className="absolute top-0 left-0 right-0 bg-primary/60 text-white text-center py-1 text-xs rounded-t-xl z-10">
          Chargement audio... {currentTrack.videoId && `(${currentTrack.videoId})`}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Album Cover */}
        <div className="relative min-w-[100px] min-h-[100px]">
          <div 
            className="w-[100px] h-[100px] rounded-lg bg-cover bg-center pulse-purple"
            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
          />
          {renderEqualizer()}
        </div>
        
        {/* Track Info */}
        <div className="flex flex-col items-center md:items-start">
          <h3 className="text-lg font-audiowide glow text-primary-foreground truncate max-w-[200px]">{currentTrack.title}</h3>
          <p className="text-sm text-secondary truncate max-w-[200px]">{currentTrack.artist}</p>
        </div>
        
        {/* Player Controls */}
        <div className="flex-1 w-full">
          <div className="flex justify-center items-center space-x-4 mb-2">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 rounded-full transition-colors ${isShuffle ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary-foreground'}`}
            >
              <Shuffle size={18} />
            </button>
            
            <button 
              className="p-2 text-primary-foreground hover:text-secondary transition-colors"
              onClick={onPrevious}
            >
              <SkipBack size={24} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-3 bg-primary rounded-full btn-glow text-primary-foreground hover:bg-primary/80 transition-all"
              disabled={!currentTrack.videoId || audioLoading}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button 
              className="p-2 text-primary-foreground hover:text-secondary transition-colors"
              onClick={onNext}
            >
              <SkipForward size={24} />
            </button>
            
            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 rounded-full transition-colors ${isRepeat ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary-foreground'}`}
            >
              <Repeat size={18} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full px-2">
            <div className="flex items-center mb-1">
              <span className="text-xs text-muted-foreground font-vt323">{currentTime}</span>
              <div className="flex-1 mx-2">
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="cursor-pointer"
                />
              </div>
              <span className="text-xs text-muted-foreground font-vt323">{totalTime}</span>
            </div>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center w-full px-2 mt-1">
            <Volume2 size={16} className="text-muted-foreground mr-2" />
            <Slider
              value={[volume]}
              min={0}
              max={100}
              onValueChange={(vals) => setVolume(vals[0])}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
