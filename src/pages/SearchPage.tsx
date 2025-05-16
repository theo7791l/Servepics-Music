
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import { toast } from "@/hooks/use-toast";

// Reusing the mock data from HomePage
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
];

const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Simulate search with timeout
    setTimeout(() => {
      // In a real app, this would fetch from API
      setSearchResults(mockTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) || 
        track.artist.toLowerCase().includes(query.toLowerCase())
      ));
      setIsSearching(false);
      
      toast({
        title: "Recherche terminée",
        description: `Résultats pour "${query}"`,
        duration: 3000,
      });
    }, 1000);
  };
  
  const handleTrackSelect = (track: any) => {
    setCurrentTrack(track);
  };
  
  const handleNextTrack = () => {
    if (!currentTrack || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentTrack(searchResults[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    if (!currentTrack || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentTrack(searchResults[prevIndex]);
  };
  
  const handleAddToFavorites = (track: any) => {
    toast({
      title: "Ajouté aux favoris",
      description: `"${track.title}" ajouté à vos favoris`,
      duration: 3000,
    });
  };
  
  return (
    <div className="py-4 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-audiowide text-3xl mb-4 glow text-primary-foreground">
            Rechercher
          </h1>
        </div>
        
        {/* Search bar */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Search Results */}
        <div className="mb-8">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-6 w-36 bg-muted rounded mb-3"></div>
                <div className="h-4 w-48 bg-muted/50 rounded"></div>
              </div>
            </div>
          ) : (
            searchQuery ? (
              searchResults.length > 0 ? (
                <TrackList 
                  tracks={searchResults} 
                  onTrackSelect={handleTrackSelect} 
                  onAddToFavorites={handleAddToFavorites}
                  currentTrackId={currentTrack?.id}
                  title={`Résultats pour "${searchQuery}"`}
                />
              ) : (
                <div className="bg-muted/20 rounded-xl border border-primary/20 p-8 text-center backdrop-blur-sm">
                  <p className="text-lg text-muted-foreground mb-2">Aucun résultat trouvé</p>
                  <p className="text-sm text-muted-foreground">
                    Essayez avec des termes différents ou vérifiez la source musicale
                  </p>
                </div>
              )
            ) : (
              <div className="bg-muted/20 rounded-xl border border-primary/20 p-8 text-center backdrop-blur-sm">
                <p className="text-lg text-muted-foreground mb-2">
                  Recherchez vos artistes et titres préférés
                </p>
                <p className="text-sm text-muted-foreground">
                  Entrez un terme de recherche ci-dessus
                </p>
              </div>
            )
          )}
        </div>
        
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

export default SearchPage;
