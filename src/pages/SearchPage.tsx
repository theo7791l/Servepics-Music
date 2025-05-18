
import React, { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

// Types pour la réponse API Invidious
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

// Converti un video Invidious en format track pour notre app
const convertToTrack = (video: InvidiousVideo) => {
  // Trouver la miniature de meilleure qualité
  const thumbnail = video.videoThumbnails?.find(t => t.quality === 'high') || 
                    video.videoThumbnails?.[0];
  
  return {
    id: video.videoId,
    title: video.title,
    artist: video.author,
    coverUrl: thumbnail?.url || '',
    audioUrl: '', // Sera récupéré lors de la lecture
    duration: video.lengthSeconds,
    videoId: video.videoId
  };
};

// Format des secondes en MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Instances Invidious publiques et fonctionnelles
const invidiousInstances = [
  'https://invidious.fdn.fr',
  'https://y.com.sb',
  'https://invidious.slipfox.xyz',
  'https://invidious.privacydev.net',
  'https://vid.puffyan.us',
  'https://invidious.namazso.eu',
  'https://inv.riverside.rocks'
];

// Filtre pour ne garder que les résultats musicaux
const isMusicContent = (video: InvidiousVideo): boolean => {
  const musicKeywords = [
    'official music video', 'audio', 'lyric', 'music', 'song', 'track',
    'album', 'single', 'remix', 'live', 'concert', 'officiel', 'clip',
    'musique', 'chanson', 'titre'
  ];
  
  // Convertir en minuscules pour une recherche insensible à la casse
  const titleLower = video.title.toLowerCase();
  const descriptionLower = video.description.toLowerCase();
  
  // Vérifier si le contenu semble musical
  return musicKeywords.some(keyword => 
    titleLower.includes(keyword.toLowerCase()) || 
    descriptionLower.includes(keyword.toLowerCase())
  ) || 
  // Ou si la durée est typique d'une chanson (entre 1 et 8 minutes)
  (video.lengthSeconds >= 60 && video.lengthSeconds <= 480);
};

const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  // Vérifier l'authentification au chargement
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.username && parsed.pin) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    setError(null);
    
    // Essayer chaque instance jusqu'à ce qu'une fonctionne
    let searchSuccess = false;
    
    for (const instance of invidiousInstances) {
      try {
        console.log(`Trying search with instance: ${instance}`);
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query + " music")}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`API returned status ${response.status}`);
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrer uniquement les résultats vidéo qui semblent être de la musique
        const videoResults = data
          .filter((item: InvidiousVideo) => item.type === "video")
          .filter(isMusicContent);
        
        // Conversion en format track de notre app
        const tracks = videoResults.map(convertToTrack);
        
        // Trier par pertinence (déjà fait par l'API)
        setSearchResults(tracks);
        setIsSearching(false);
        searchSuccess = true;
        
        toast({
          title: "Recherche terminée",
          description: `${tracks.length} résultats pour "${query}"`,
          duration: 3000,
        });
        
        break; // Sortir de la boucle si succès
      } catch (err) {
        console.error(`Failed to search with instance ${instance}:`, err);
        // Continuer avec l'instance suivante
      }
    }
    
    // Si toutes les instances ont échoué
    if (!searchSuccess) {
      setIsSearching(false);
      setError("Impossible de se connecter aux sources musicales. Vérifiez votre connexion et réessayez.");
      toast({
        title: "Erreur de recherche",
        description: "Connexion impossible aux sources musicales",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  const handleTrackSelect = async (track: any) => {
    // Avant de lire, nous devons récupérer l'URL audio
    setIsSearching(true);
    
    try {
      // Essayer chaque instance jusqu'à ce qu'une fonctionne
      for (const instance of invidiousInstances) {
        try {
          console.log(`Trying to get audio for video ${track.videoId} from instance: ${instance}`);
          const url = `${instance}/api/v1/videos/${track.videoId}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
          }
          
          const data = await response.json();
          
          // Trouver tous les formats audio disponibles
          const audioFormats = data.adaptiveFormats
            .filter((format: any) => format.type.startsWith('audio/'))
            .sort((a: any, b: any) => b.bitrate - a.bitrate);
          
          if (audioFormats.length > 0) {
            // Essayer plusieurs formats audio si disponibles
            let audioTrack = null;
            let audioUrl = null;
            
            // Tester chaque format jusqu'à trouver un qui fonctionne
            for (const format of audioFormats) {
              try {
                // Vérifier si l'URL est accessible
                const testResponse = await fetch(format.url, { method: 'HEAD' });
                if (testResponse.ok) {
                  audioUrl = format.url;
                  break;
                }
              } catch (e) {
                console.warn("Format audio inaccessible, essai suivant:", e);
              }
            }
            
            // Si aucun format n'est accessible, utiliser le premier
            if (!audioUrl && audioFormats.length > 0) {
              audioUrl = audioFormats[0].url;
            }
            
            if (audioUrl) {
              audioTrack = {
                ...track,
                audioUrl: audioUrl,
                title: data.title,
                artist: data.author,
                duration: data.lengthSeconds,
                // Utiliser une miniature de meilleure qualité si disponible
                coverUrl: data.videoThumbnails.find((t: any) => t.quality === 'maxres')?.url || 
                        data.videoThumbnails.find((t: any) => t.quality === 'high')?.url || 
                        track.coverUrl
              };
              
              // Mettre à jour Discord
              if (window.electron?.updateDiscordPresence) {
                window.electron.updateDiscordPresence({
                  title: audioTrack.title,
                  artist: audioTrack.artist
                });
              }
              
              // Journal audio
              if (window.electron?.logAudio) {
                window.electron.logAudio(`Playing: ${audioTrack.title} by ${audioTrack.artist}`);
              }
              
              // Stocker dans localStorage pour la persistance
              localStorage.setItem('currentTrack', JSON.stringify(audioTrack));
              
              setCurrentTrack(audioTrack);
              setIsSearching(false);
              return; // Succès!
            } else {
              throw new Error("No accessible audio formats");
            }
          } else {
            throw new Error("No audio formats found");
          }
        } catch (err) {
          console.error(`Failed to get video details from ${instance}:`, err);
          // Continuer avec l'instance suivante
        }
      }
      
      // Si toutes les instances ont échoué
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
  
  // Récupérer le currentTrack du localStorage au chargement
  useEffect(() => {
    const savedTrack = localStorage.getItem('currentTrack');
    if (savedTrack) {
      try {
        setCurrentTrack(JSON.parse(savedTrack));
      } catch (e) {
        console.error("Error parsing saved track:", e);
      }
    }
  }, []);
  
  const handleAddToFavorites = (track: any) => {
    // Récupérer les playlists de l'utilisateur
    const userData = JSON.parse(localStorage.getItem('userData') || '{"playlists":[]}');
    
    // Trouver ou créer la playlist "Favoris"
    let favorisPlaylist = userData.playlists.find((p: any) => p.name === "Favoris");
    
    if (!favorisPlaylist) {
      favorisPlaylist = {
        id: Date.now().toString(),
        name: "Favoris",
        trackCount: 0,
        coverUrl: track.coverUrl,
        tracks: []
      };
      userData.playlists.push(favorisPlaylist);
    }
    
    // Vérifier si le titre est déjà dans les favoris
    const trackExists = favorisPlaylist.tracks.some((t: any) => t.id === track.id);
    
    if (!trackExists) {
      // Ajouter le titre aux favoris
      favorisPlaylist.tracks.push(track);
      favorisPlaylist.trackCount = favorisPlaylist.tracks.length;
      
      // Mettre à jour le localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      toast({
        title: "Ajouté aux favoris",
        description: `"${track.title}" a été ajouté à vos favoris`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Déjà dans les favoris",
        description: `"${track.title}" est déjà dans vos favoris`,
        duration: 3000,
      });
    }
  };
  
  return (
    <div className="py-4 px-4 search-container">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-audiowide text-3xl mb-4 glow text-primary-foreground">
            Rechercher
          </h1>
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} isSearching={isSearching} />
        </div>
        
        {/* Résultats de recherche */}
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
