import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { toast } from '@/hooks/use-toast';
import { getCompatibleAudioUrl, isElectronEnvironment } from '@/utils/audioPlayer';
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
  const [audioLoading, setAudioLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
  
  const createAudioElement = (): HTMLAudioElement => {
    const audio = new Audio();
    
    audio.addEventListener('error', (e) => {
      const error = (e.target as HTMLAudioElement).error;
      logAudio(`Error event triggered: ${error?.code} - ${error?.message}`);
      setAudioError(`Erreur de lecture audio (${error?.code}). Essayez un autre titre.`);
      setIsPlaying(false);
      setAudioLoading(false);
    });
    
    audio.addEventListener('loadstart', () => {
      logAudio('Audio loading started');
      setAudioLoading(true);
    });
    
    audio.addEventListener('loadeddata', () => {
      logAudio('Audio data loaded');
      setAudioLoading(false);
    });
    
    audio.addEventListener('canplay', () => {
      logAudio('Audio can play');
      setAudioLoading(false);
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
      // Clean up audio element when component unmounts
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
    setAudioLoading(true);
    setProgress(0);
    setRetryCount(0);
    
    // Récupérer l'URL audio compatible avec l'environnement
    getCompatibleAudioUrl(currentTrack.videoId)
      .then(audioSource => {
        if (!audioSource || !audioRef.current) {
          throw new Error('No compatible audio source found');
        }
        
        logAudio(`Got compatible audio URL: ${audioSource.url} (type: ${audioSource.type})`);
        
        // Set audio source and options
        audioRef.current.src = audioSource.url;
        audioRef.current.volume = volume / 100;
        audioRef.current.crossOrigin = "anonymous";
        
        // Update Discord presence
        updateDiscordPresence(currentTrack);
        
        // Attempt to play
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              logAudio('Playback started successfully');
              setIsPlaying(true);
              setAudioError(null);
              setAudioLoading(false);
            })
            .catch(error => {
              logAudio(`Playback failed: ${error.message}`);
              setIsPlaying(false);
              setAudioLoading(false);
              
              if (!isElectronEnvironment()) {
                setAudioError("Lecture limitée dans le navigateur. Utilisez l'app Electron pour une expérience complète.");
              } else {
                setAudioError("Erreur de lecture. Essayez un autre titre.");
              }
            });
        }
      })
      .catch(error => {
        logAudio(`Error getting compatible audio URL: ${error}`);
        setAudioError(!isElectronEnvironment() 
          ? "Lecture audio non disponible dans le navigateur web" 
          : "Erreur lors de la configuration de l'audio"
        );
        setIsPlaying(false);
        setAudioLoading(false);
      });
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
        description: "Aucun titre audio disponible",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!isElectronEnvironment()) {
      toast({
        title: "Limitation du navigateur",
        description: "La lecture audio est limitée dans le navigateur web",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (isPlaying) {
      logAudio('Playback paused');
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      logAudio('Attempting to play');
      
      if (!audioRef.current) {
        audioRef.current = createAudioElement();
      }
      
      // Handle browser autoplay restrictions gracefully
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logAudio('Manual play successful');
            setAudioError(null);
            setIsPlaying(true);
          })
          .catch(error => {
            logAudio(`Manual play failed: ${error.message}`);
            
            if (error.name === 'NotAllowedError') {
              setAudioError("Cliquez sur le bouton play pour activer le son");
              toast({
                title: "Interaction requise",
                description: "Cliquez sur play pour activer le son (restriction du navigateur)",
                duration: 5000,
              });
            } else {
              setAudioError("Erreur de lecture audio");
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
        <div className="absolute top-0 left-0 right-0 bg-destructive/80 text-white text-center py-1 text-xs rounded-t-xl">
          {audioError}
        </div>
      )}
      
      {audioLoading && (
        <div className="absolute top-0 left-0 right-0 bg-primary/60 text-white text-center py-1 text-xs rounded-t-xl">
          Chargement audio...
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
              disabled={!currentTrack.audioUrl || audioLoading}
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
