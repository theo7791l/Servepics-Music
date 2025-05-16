
import React, { useState } from 'react';
import { Heart, Plus, MoreHorizontal } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  videoId?: string;
}

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  tracks: Track[];
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
  title = "Titres",
  formatDuration
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.playlists || [];
      } catch (e) {
        console.error("Error parsing playlists:", e);
      }
    }
    return [];
  });
  
  const defaultFormatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const formatTime = formatDuration || defaultFormatDuration;
  
  const handleAddToPlaylist = (track: Track, playlistId: string) => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      toast({
        title: "Erreur",
        description: "Vous devez vous connecter pour ajouter des titres à une playlist",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    try {
      const parsed = JSON.parse(userData);
      const playlistIndex = parsed.playlists.findIndex((p: Playlist) => p.id === playlistId);
      
      if (playlistIndex === -1) {
        toast({
          title: "Erreur",
          description: "Playlist non trouvée",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // Vérifier si le titre est déjà dans la playlist
      const playlist = parsed.playlists[playlistIndex];
      const trackExists = playlist.tracks?.some((t: Track) => t.id === track.id);
      
      if (trackExists) {
        toast({
          title: "Déjà dans la playlist",
          description: `"${track.title}" est déjà dans "${playlist.name}"`,
          duration: 3000,
        });
        return;
      }
      
      // Ajouter le titre à la playlist
      if (!playlist.tracks) {
        playlist.tracks = [];
      }
      
      playlist.tracks.push(track);
      playlist.trackCount = playlist.tracks.length;
      
      // Mettre à jour le localStorage
      localStorage.setItem('userData', JSON.stringify(parsed));
      
      // Mettre à jour l'état local
      setPlaylists(parsed.playlists);
      
      toast({
        title: "Titre ajouté",
        description: `"${track.title}" ajouté à "${playlist.name}"`,
        duration: 3000,
      });
      
    } catch (e) {
      console.error("Error adding track to playlist:", e);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le titre à la playlist",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()} 
                      className="p-1.5 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {playlists.map((playlist) => (
                      <DropdownMenuItem 
                        key={playlist.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(track, playlist.id);
                        }}
                      >
                        <Plus size={14} className="mr-2" />
                        Ajouter à {playlist.name}
                      </DropdownMenuItem>
                    ))}
                    {playlists.length === 0 && (
                      <DropdownMenuItem disabled>
                        Aucune playlist disponible
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackList;
