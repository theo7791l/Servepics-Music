
import React, { useState } from 'react';
import PlaylistCard from '@/components/PlaylistCard';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";

// Mock data
const mockPlaylists = [
  { 
    id: '1', 
    name: 'Mes favoris', 
    trackCount: 12, 
    coverUrl: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&h=400&auto=format&fit=crop' 
  },
  { 
    id: '2', 
    name: 'Cyberpunk vibes', 
    trackCount: 8, 
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&auto=format&fit=crop' 
  },
  { 
    id: '3', 
    name: 'Coding sessions', 
    trackCount: 15, 
    coverUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=400&auto=format&fit=crop' 
  },
  { 
    id: '4', 
    name: 'Gaming soundtrack', 
    trackCount: 21, 
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&auto=format&fit=crop'
  },
];

const playlistTracks = {
  '1': [
    {
      id: '101',
      title: 'Night Drive',
      artist: 'Synthwave Collective',
      coverUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=400&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/01/18/audio_7fc51f063f.mp3',
      duration: 185
    },
    {
      id: '102',
      title: 'Retrowave Dreams',
      artist: 'Glitch Protocol',
      coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_270f4304ce.mp3',
      duration: 214
    },
  ],
  '2': [
    {
      id: '201',
      title: 'Neon City',
      artist: 'Digital Wave',
      coverUrl: 'https://images.unsplash.com/photo-1614149162883-504ce46d2aad?w=400&h=400&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/audio/2023/06/13/audio_5edf1c6320.mp3',
      duration: 240
    },
  ],
  '3': [],
  '4': [
    {
      id: '401',
      title: 'Boss Battle',
      artist: 'Game OST',
      coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&auto=format&fit=crop',
      audioUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946df2456a.mp3',
      duration: 192
    },
  ],
};

const PlaylistsPage: React.FC = () => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [playlistContent, setPlaylistContent] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  
  const handlePlaylistClick = (playlist: any) => {
    setSelectedPlaylist(playlist);
    // @ts-ignore - Just for demo purposes
    const tracks = playlistTracks[playlist.id] || [];
    setPlaylistContent(tracks);
    setCurrentTrack(null);
  };
  
  const handleTrackSelect = (track: any) => {
    setCurrentTrack(track);
  };
  
  const handleNextTrack = () => {
    if (!currentTrack || playlistContent.length === 0) return;
    
    const currentIndex = playlistContent.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlistContent.length;
    setCurrentTrack(playlistContent[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    if (!currentTrack || playlistContent.length === 0) return;
    
    const currentIndex = playlistContent.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlistContent.length) % playlistContent.length;
    setCurrentTrack(playlistContent[prevIndex]);
  };
  
  const handleCreateNewPlaylist = () => {
    toast({
      title: "Nouvelle playlist",
      description: "Fonctionnalité à venir dans la prochaine version",
      duration: 3000,
    });
  };
  
  return (
    <div className="py-4 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="font-audiowide text-3xl glow text-primary-foreground">
            Playlists
          </h1>
          <Button 
            onClick={handleCreateNewPlaylist}
            className="btn-glow-blue bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <PlusCircle size={16} className="mr-2" />
            Nouvelle playlist
          </Button>
        </div>
        
        {selectedPlaylist ? (
          <>
            {/* Selected playlist */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setSelectedPlaylist(null)}
                className="mb-4"
              >
                ← Retour aux playlists
              </Button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-lg overflow-hidden">
                  {selectedPlaylist.coverUrl ? (
                    <img 
                      src={selectedPlaylist.coverUrl} 
                      alt={selectedPlaylist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary-foreground opacity-50">
                        No Cover
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-audiowide glow text-primary-foreground">
                    {selectedPlaylist.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlaylist.trackCount} {selectedPlaylist.trackCount === 1 ? 'titre' : 'titres'}
                  </p>
                </div>
              </div>
              
              <TrackList 
                tracks={playlistContent} 
                onTrackSelect={handleTrackSelect}
                currentTrackId={currentTrack?.id}
                title={`Titres dans ${selectedPlaylist.name}`}
              />
            </div>
          </>
        ) : (
          <>
            {/* List of playlists */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {mockPlaylists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onClick={handlePlaylistClick}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Player */}
        {currentTrack && (
          <div className="sticky bottom-16 md:bottom-4 pt-4 pb-2 bg-gradient-to-t from-background to-transparent z-10">
            <MusicPlayer 
              currentTrack={currentTrack} 
              onNext={handleNextTrack}
              onPrevious={handlePreviousTrack}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistsPage;
