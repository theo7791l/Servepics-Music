
import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import { toast } from "@/hooks/use-toast";

// Types for Invidious API response
interface InvidiousVideo {
  type: string;
  title: string;
  videoId: string;
  author: string;
  authorId: string;
  authorUrl: string;
  videoThumbnails: Array<{
    quality: string;
    url: string;
    width: number;
    height: number;
  }>;
  description: string;
  descriptionHtml: string;
  viewCount: number;
  publishedText: string;
  lengthSeconds: number;
  liveNow: boolean;
  paid: boolean;
  premium: boolean;
}

// Convert Invidious video to our app's track format
const convertToTrack = (video: InvidiousVideo) => {
  // Find the highest quality thumbnail
  const thumbnail = video.videoThumbnails?.find(t => t.quality === 'high') || 
                    video.videoThumbnails?.[0];
  
  return {
    id: video.videoId,
    title: video.title,
    artist: video.author,
    coverUrl: thumbnail?.url || '',
    audioUrl: '', // This will be fetched when playing
    duration: video.lengthSeconds,
    videoId: video.videoId
  };
};

// Format seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Invidious API instances - we can rotate through these if one fails
  const invidiousInstances = [
    'https://invidious.snopyta.org',
    'https://inv.riverside.rocks',
    'https://invidio.us',
    'https://vid.puffyan.us'
  ];
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setError(null);
    
    // Try each instance until one works
    let searchSuccess = false;
    
    for (const instance of invidiousInstances) {
      try {
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter only video results (not playlists, channels, etc.)
        const videoResults = data.filter((item: InvidiousVideo) => item.type === "video");
        
        // Convert to our app's track format
        const tracks = videoResults.map(convertToTrack);
        
        setSearchResults(tracks);
        setIsSearching(false);
        searchSuccess = true;
        
        toast({
          title: "Recherche terminée",
          description: `${tracks.length} résultats pour "${query}"`,
          duration: 3000,
        });
        
        break; // Exit the loop if successful
      } catch (err) {
        console.error(`Failed to search with instance ${instance}:`, err);
        // Continue to the next instance
      }
    }
    
    // If all instances failed
    if (!searchSuccess) {
      setIsSearching(false);
      setError("Impossible de se connecter aux sources musicales. Veuillez réessayer plus tard.");
      toast({
        title: "Erreur de recherche",
        description: "Impossible de se connecter aux sources musicales",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  const handleTrackSelect = async (track: any) => {
    // Before playing, we need to fetch the audio URL
    setIsSearching(true);
    
    try {
      // Try each instance until one works
      for (const instance of invidiousInstances) {
        try {
          const url = `${instance}/api/v1/videos/${track.videoId}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
          }
          
          const data = await response.json();
          
          // Find audio-only format with highest quality
          const audioFormats = data.adaptiveFormats
            .filter((format: any) => format.type.startsWith('audio/'))
            .sort((a: any, b: any) => b.bitrate - a.bitrate);
          
          if (audioFormats.length > 0) {
            const audioTrack = {
              ...track,
              audioUrl: audioFormats[0].url,
              title: data.title,
              artist: data.author,
              duration: data.lengthSeconds,
              // Use better quality thumbnail if available
              coverUrl: data.videoThumbnails.find((t: any) => t.quality === 'maxres')?.url || 
                       data.videoThumbnails.find((t: any) => t.quality === 'high')?.url || 
                       track.coverUrl
            };
            
            setCurrentTrack(audioTrack);
            setIsSearching(false);
            return; // Success!
          } else {
            throw new Error("No audio formats found");
          }
        } catch (err) {
          console.error(`Failed to get video details from ${instance}:`, err);
          // Continue to the next instance
        }
      }
      
      // If all instances failed
      throw new Error("All instances failed");
    } catch (err) {
      setIsSearching(false);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire ce titre pour le moment",
        variant: "destructive",
        duration: 3000,
      });
      console.error("Failed to get audio URL:", err);
    }
  };
  
  const handleNextTrack = () => {
    if (!currentTrack || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % searchResults.length;
    handleTrackSelect(searchResults[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    if (!currentTrack || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
    handleTrackSelect(searchResults[prevIndex]);
  };
  
  const handleAddToFavorites = (track: any) => {
    // This will be implemented with the playlist system
    toast({
      title: "Fonctionnalité à venir",
      description: "L'ajout aux favoris sera disponible avec le système de playlists",
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
          <SearchBar onSearch={handleSearch} isSearching={isSearching} />
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
          ) : error ? (
            <div className="bg-muted/20 rounded-xl border border-destructive/40 p-8 text-center backdrop-blur-sm">
              <p className="text-lg text-destructive mb-2">{error}</p>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre connexion internet ou réessayez plus tard
              </p>
            </div>
          ) : searchQuery ? (
            searchResults.length > 0 ? (
              <TrackList 
                tracks={searchResults} 
                onTrackSelect={handleTrackSelect} 
                onAddToFavorites={handleAddToFavorites}
                currentTrackId={currentTrack?.id}
                title={`Résultats pour "${searchQuery}"`}
                formatDuration={formatDuration}
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
