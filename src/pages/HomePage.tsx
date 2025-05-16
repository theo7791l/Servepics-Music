
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistCard from '@/components/PlaylistCard';
import { toast } from "@/hooks/use-toast";

// Mock data for initial development
const mockTracks = [
  {
    id: '1',
    title: 'Cybernetic Dreams',
    artist: 'Neon Protocol',
    coverUrl: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/01/18/audio_7fc51f063f.mp3',
    duration: 185
  },
  {
    id: '2',
    title: 'Digital Horizon',
    artist: 'Virtual Sync',
    coverUrl: 'https://images.unsplash.com/photo-1614149162883-504ce46d2aad?w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_270f4304ce.mp3',
    duration: 214
  },
  {
    id: '3',
    title: 'Neon City Lights',
    artist: 'Synthwave Collective',
    coverUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/06/13/audio_5edf1c6320.mp3',
    duration: 240
  },
  {
    id: '4',
    title: 'Electric Dreams',
    artist: 'Laser Grid',
    coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946df2456a.mp3',
    duration: 192
  },
  {
    id: '5',
    title: 'Retrowave Journey',
    artist: 'Neon Drive',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&auto=format&fit=crop',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7ecco5cs0.mp3',
    duration: 208
  },
];

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

const HomePage: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState(mockTracks[0]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const handleSearch = (query: string) => {
    // In a real app, this would trigger an API search
    toast({
      title: "Recherche en cours",
      description: `Recherche de "${query}"...`,
      duration: 3000,
    });
    console.log("Searching for:", query);
  };
  
  const handleTrackSelect = (track: any) => {
    setCurrentTrack(track);
  };
  
  const handleNextTrack = () => {
    const currentIndex = mockTracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockTracks.length;
    setCurrentTrack(mockTracks[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    const currentIndex = mockTracks.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + mockTracks.length) % mockTracks.length;
    setCurrentTrack(mockTracks[prevIndex]);
  };
  
  const handleAddToFavorites = (track: any) => {
    const isFavorite = favorites.includes(track.id);
    
    if (isFavorite) {
      setFavorites(favorites.filter(id => id !== track.id));
      toast({
        title: "Retiré des favoris",
        description: `"${track.title}" retiré de vos favoris`,
        duration: 3000,
      });
    } else {
      setFavorites([...favorites, track.id]);
      toast({
        title: "Ajouté aux favoris",
        description: `"${track.title}" ajouté à vos favoris`,
        duration: 3000,
      });
    }
  };
  
  const handlePlaylistClick = (playlist: any) => {
    toast({
      title: "Playlist sélectionnée",
      description: `"${playlist.name}" - ${playlist.trackCount} titres`,
      duration: 3000,
    });
  };
  
  return (
    <div className="py-4 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-audiowide text-4xl mb-2 glow text-primary-foreground">
            NeonWave
          </h1>
          <p className="text-muted-foreground text-sm">
            Streaming musical sans tracking, sans pub
          </p>
        </div>
        
        {/* Search bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Playlists */}
        <div className="mb-8">
          <h2 className="text-xl font-audiowide mb-4 glow-blue text-electricBlue">
            Vos playlists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockPlaylists.map(playlist => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist} 
                onClick={handlePlaylistClick}
              />
            ))}
          </div>
        </div>
        
        {/* Track list */}
        <div className="mb-8">
          <TrackList 
            tracks={mockTracks} 
            onTrackSelect={handleTrackSelect} 
            onAddToFavorites={handleAddToFavorites}
            currentTrackId={currentTrack?.id}
          />
        </div>
        
        {/* Player */}
        <div className="sticky bottom-16 md:bottom-4 pt-4 pb-2 bg-gradient-to-t from-background to-transparent z-10">
          <MusicPlayer 
            currentTrack={currentTrack} 
            onNext={handleNextTrack}
            onPrevious={handlePreviousTrack}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
