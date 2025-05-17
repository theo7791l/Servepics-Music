
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { toast } from '@/hooks/use-toast';

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Envoyer les logs audio à Electron si disponible
  const logAudio = (message: string) => {
    console.log(`[AUDIO] ${message}`);
    if (window.electron?.logAudio) {
      window.electron.logAudio(message);
    }
  };
  
  // Mettre à jour la présence Discord si disponible
  const updateDiscordPresence = (track: Track) => {
    if (window.electron?.updateDiscordPresence) {
      window.electron.updateDiscordPresence({
        title: track.title,
        artist: track.artist
      });
      logAudio(`Updating Discord presence for: ${track.title} - ${track.artist}`);
    }
  };
  
  useEffect(() => {
    // Setup audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Add event listeners
      audioRef.current.addEventListener('error', (e) => {
        const error = (e.target as HTMLAudioElement).error;
        logAudio(`Error event triggered: ${error?.code} - ${error?.message}`);
        setAudioError(`Erreur de lecture audio (${error?.code}). Essayez un autre titre.`);
        setIsPlaying(false);
        setAudioLoading(false);
      });
      
      audioRef.current.addEventListener('loadstart', () => {
        logAudio('Audio loading started');
        setAudioLoading(true);
      });
      
      audioRef.current.addEventListener('loadeddata', () => {
        logAudio('Audio data loaded');
        setAudioLoading(false);
      });
      
      audioRef.current.addEventListener('canplay', () => {
        logAudio('Audio can play');
        setAudioLoading(false);
      });
    }
    
    // Update audio source when track changes
    if (currentTrack && currentTrack.audioUrl) {
      logAudio(`Setting new track: ${currentTrack.title} - URL: ${currentTrack.audioUrl}`);
      
      // Essayer d'accéder directement à l'URL audio
      try {
        audioRef.current!.src = currentTrack.audioUrl;
        audioRef.current!.volume = volume / 100;
        setAudioError(null);
        
        // Mettre à jour la présence Discord
        updateDiscordPresence(currentTrack);
        
        // Auto-play new track
        const playPromise = audioRef.current!.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              logAudio('Playback started successfully');
              setIsPlaying(true);
              setAudioError(null);
            })
            .catch(error => {
              logAudio(`Playback failed: ${error.message}`);
              // Réessayer après un court délai
              setTimeout(() => {
                audioRef.current!.play()
                  .then(() => {
                    setIsPlaying(true);
                    setAudioError(null);
                  })
                  .catch(secondError => {
                    logAudio(`Second playback attempt failed: ${secondError.message}`);
                    setIsPlaying(false);
                    setAudioError("Impossible de lire ce titre automatiquement. Cliquez sur Play.");
                  });
              }, 1000);
            });
        }
      } catch (error) {
        logAudio(`Error setting track: ${error}`);
        setAudioError("Erreur lors de la configuration de l'audio. Vérifiez l'URL audio.");
        setIsPlaying(false);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack, volume]);
  
  useEffect(() => {
    // Start/stop progress tracking based on play state
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
    if (!currentTrack || !currentTrack.audioUrl) {
      toast({
        title: "Erreur de lecture",
        description: "Aucun titre audio disponible",
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
      // Vérifier si l'audio est déjà chargé
      if (!audioRef.current?.src || audioRef.current.src !== currentTrack.audioUrl) {
        logAudio('Setting new audio source before playing');
        audioRef.current!.src = currentTrack.audioUrl;
        audioRef.current!.volume = volume / 100;
      }
      
      const playPromise = audioRef.current?.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logAudio('Playback started successfully');
            setAudioError(null);
            setIsPlaying(true);
          })
          .catch(error => {
            logAudio(`Playback failed: ${error.message}`);
            
            // Si l'erreur est liée à l'autoplay, essayons une autre approche
            if (error.name === 'NotAllowedError') {
              logAudio('Autoplay not allowed, trying a different approach');
              
              // Créer un nouvel élément audio avec des attributs spécifiques
              const newAudio = new Audio();
              newAudio.src = currentTrack.audioUrl;
              newAudio.volume = volume / 100;
              newAudio.crossOrigin = "anonymous";
              newAudio.preload = "auto";
              
              // Remplacer l'élément audio actuel
              audioRef.current = newAudio;
              
              // Ajouter les mêmes écouteurs d'événements
              newAudio.addEventListener('error', (e) => {
                const err = (e.target as HTMLAudioElement).error;
                logAudio(`Error event triggered on new audio: ${err?.code} - ${err?.message}`);
                setAudioError(`Nouvelle erreur de lecture (${err?.code}). Essayez un autre titre.`);
                setIsPlaying(false);
                setAudioLoading(false);
              });
              
              newAudio.addEventListener('canplay', () => {
                logAudio('New audio can play');
                setAudioLoading(false);
                newAudio.play()
                  .then(() => {
                    setIsPlaying(true);
                    setAudioError(null);
                  })
                  .catch(err => {
                    logAudio(`Still failed to play: ${err.message}`);
                    setAudioError("Impossible de lire l'audio après plusieurs tentatives. Vérifiez l'URL.");
                  });
              });
              
              // Essayer de charger l'audio
              setAudioLoading(true);
            } else {
              toast({
                title: "Erreur de lecture",
                description: "Impossible de lire ce titre. Essayez un autre.",
                variant: "destructive",
                duration: 3000,
              });
              setAudioError("Erreur lors de la lecture. Essayez de recharger la page ou un autre titre.");
            }
          });
      } else {
        logAudio('Play returned undefined promise');
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
