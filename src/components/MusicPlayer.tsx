
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Setup audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Update audio source when track changes
    if (currentTrack) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.volume = volume / 100;
      
      // Auto-play new track
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
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
  }, [currentTrack]);
  
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
              audioRef.current.play();
            } else {
              setIsPlaying(false);
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
    }
  }, [volume]);
  
  const togglePlay = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleProgressChange = (values: number[]) => {
    if (!audioRef.current || !currentTrack) return;
    
    const newPosition = values[0];
    const newTime = (newPosition / 100) * (audioRef.current.duration || 0);
    
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
          <h3 className="text-lg font-audiowide glow text-primary-foreground">{currentTrack.title}</h3>
          <p className="text-sm text-secondary">{currentTrack.artist}</p>
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
