
import React from 'react';
import { ListMusic } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  coverUrl?: string;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (playlist: Playlist) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <div 
      onClick={() => onClick(playlist)}
      className="bg-muted/30 hover:bg-muted/50 border border-primary/20 rounded-lg overflow-hidden cursor-pointer transition-all hover:translate-y-[-5px] btn-glow"
    >
      <div className="relative aspect-square">
        {playlist.coverUrl ? (
          <img 
            src={playlist.coverUrl} 
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-primary/20">
            <ListMusic size={48} className="text-primary-foreground opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
      </div>
      <div className="p-3">
        <h3 className="font-medium truncate text-sm">{playlist.name}</h3>
        <p className="text-xs text-muted-foreground">
          {playlist.trackCount} {playlist.trackCount === 1 ? 'titre' : 'titres'}
        </p>
      </div>
    </div>
  );
};

export default PlaylistCard;
