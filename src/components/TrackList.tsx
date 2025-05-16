
import React from 'react';
import { Heart, Plus } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  onAddToFavorites?: (track: Track) => void;
  currentTrackId?: string;
  title?: string;
  formatDuration?: (seconds: number) => string;
}

const TrackList: React.FC<TrackListProps> = ({ 
  tracks, 
  onTrackSelect,
  onAddToFavorites,
  currentTrackId,
  title = "Titres populaires",
  formatDuration
}) => {
  const defaultFormatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const formatTime = formatDuration || defaultFormatDuration;
  
  return (
    <div className="bg-muted/20 rounded-xl border border-primary/20 p-4 backdrop-blur-sm">
      <h2 className="text-xl font-audiowide mb-4 glow text-primary-foreground">{title}</h2>
      
      {tracks.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">Aucun titre disponible</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div 
              key={track.id}
              onClick={() => onTrackSelect(track)}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                currentTrackId === track.id 
                  ? 'bg-primary/20 border border-primary/40 btn-glow' 
                  : 'hover:bg-muted/40'
              }`}
            >
              <div 
                className="w-10 h-10 rounded bg-cover bg-center mr-3"
                style={{ backgroundImage: `url(${track.coverUrl})` }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-sm">
                  {track.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {track.artist}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {formatTime(track.duration)}
                </span>
                
                {onAddToFavorites && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToFavorites(track);
                    }}
                    className="p-1.5 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackList;
