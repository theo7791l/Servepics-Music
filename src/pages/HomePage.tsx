
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import PlaylistCard from '@/components/PlaylistCard';
import AuthForm from '@/components/AuthForm';
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
  coverUrl?: string;
  tracks: Track[];
}

const invidiousInstances = [
  'https://invidious.fdn.fr',
  'https://y.com.sb',
  'https://invidious.slipfox.xyz',
  'https://invidious.privacydev.net'
];

const HomePage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [randomTracks, setRandomTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Vérifier l'authentification et charger les données utilisateur
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setIsAuthenticated(!!parsed.pin);
        if (parsed.playlists) {
          setPlaylists(parsed.playlists);
          
          // Extraire des morceaux aléatoires depuis les playlists de l'utilisateur
          const allTracks: Track[] = [];
          parsed.playlists.forEach((playlist: Playlist) => {
            if (playlist.tracks && playlist.tracks.length > 0) {
              allTracks.push(...playlist.tracks);
            }
          });
          
          // Mélanger et prendre maximum 5 morceaux
          if (allTracks.length > 0) {
            const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
            setRandomTracks(shuffled.slice(0, 5));
          } else {
            // Si l'utilisateur n'a pas de morceaux, essayer de charger des morceaux populaires
            fetchPopularTracks();
          }
        }
        
        // Charger le morceau en cours s'il existe
        const savedTrack = localStorage.getItem('currentTrack');
        if (savedTrack) {
          setCurrentTrack(JSON.parse(savedTrack));
        }
      } catch (e) {
        console.error("Error loading user data:", e);
      }
    }
  }, []);
  
  // Fonction pour récupérer des morceaux populaires via Invidious
  const fetchPopularTracks = async () => {
    setIsLoading(true);
    
    try {
      // Essayer chaque instance jusqu'à ce qu'une fonctionne
      for (const instance of invidiousInstances) {
        try {
          // Recherche pour "music" pour obtenir des morceaux populaires
          const url = `${instance}/api/v1/search?q=music`;
          const response = await fetch(url, { mode: 'cors' });
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
          }
          
          const data = await response.json();
          
          // Filtrer uniquement les résultats vidéo (pas les playlists, chaînes, etc.)
          const videoResults = data.filter((item: any) => item.type === "video");
          
          // Conversion en format track de notre app
          const tracks = videoResults.slice(0, 5).map((video: any) => {
            const thumbnail = video.videoThumbnails?.find((t: any) => t.quality === 'high') || 
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
          });
          
          setRandomTracks(tracks);
          break; // Sortir de la boucle si succès
        } catch (err) {
          console.error(`Failed to fetch popular tracks from ${instance}:`, err);
          // Continuer avec l'instance suivante
        }
      }
    } catch (e) {
      console.error("Error fetching popular tracks:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAuthComplete = () => {
    setIsAuthenticated(true);
    // Recharger les données après l'authentification
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.playlists) {
        setPlaylists(parsed.playlists);
      }
    }
  };
  
  const handleSearch = (query: string) => {
    // Rediriger vers la page de recherche avec la requête
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  const handleTrackSelect = async (track: Track) => {
    // Si le morceau a déjà une URL audio, le lire directement
    if (track.audioUrl) {
      setCurrentTrack(track);
      localStorage.setItem('currentTrack', JSON.stringify(track));
      return;
    }
    
    // Sinon, récupérer l'URL audio via Invidious (si videoId est disponible)
    if (track.videoId) {
      setIsLoading(true);
      
      try {
        // Essayer chaque instance jusqu'à ce qu'une fonctionne
        for (const instance of invidiousInstances) {
          try {
            const url = `${instance}/api/v1/videos/${track.videoId}`;
            const response = await fetch(url, { mode: 'cors' });
            
            if (!response.ok) {
              throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Trouver le format audio uniquement avec la meilleure qualité
            const audioFormats = data.adaptiveFormats
              .filter((format: any) => format.type.startsWith('audio/'))
              .sort((a: any, b: any) => b.bitrate - a.bitrate);
            
            if (audioFormats.length > 0) {
              const audioTrack = {
                ...track,
                audioUrl: audioFormats[0].url,
                title: data.title || track.title,
                artist: data.author || track.artist,
                duration: data.lengthSeconds || track.duration,
                // Utiliser une miniature de meilleure qualité si disponible
                coverUrl: data.videoThumbnails?.find((t: any) => t.quality === 'maxres')?.url || 
                        data.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || 
                        track.coverUrl
              };
              
              // Stocker dans localStorage pour la persistance
              setCurrentTrack(audioTrack);
              localStorage.setItem('currentTrack', JSON.stringify(audioTrack));
              setIsLoading(false);
              return;
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
        setIsLoading(false);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire ce titre pour le moment",
          variant: "destructive",
          duration: 3000,
        });
        console.error("Failed to get audio URL:", err);
      }
    } else {
      toast({
        title: "Erreur de lecture",
        description: "Information vidéo manquante",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const handlePlaylistClick = (playlist: Playlist) => {
    navigate(`/playlists`);
    // Attendre que la page de playlists soit chargée, puis sélectionner la playlist
    setTimeout(() => {
      localStorage.setItem('selectedPlaylistId', playlist.id);
    }, 100);
  };
  
  const handleNextTrack = () => {
    if (!currentTrack || randomTracks.length === 0) return;
    
    const currentIndex = randomTracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % randomTracks.length;
    handleTrackSelect(randomTracks[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    if (!currentTrack || randomTracks.length === 0) return;
    
    const currentIndex = randomTracks.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + randomTracks.length) % randomTracks.length;
    handleTrackSelect(randomTracks[prevIndex]);
  };
  
  const handleAddToFavorites = (track: Track) => {
    // Récupérer les playlists de l'utilisateur
    const userData = JSON.parse(localStorage.getItem('userData') || '{"playlists":[]}');
    
    // Trouver ou créer la playlist "Favoris"
    let favorisPlaylist = userData.playlists.find((p: Playlist) => p.name === "Favoris");
    
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
    const trackExists = favorisPlaylist.tracks?.some((t: Track) => t.id === track.id);
    
    if (!trackExists) {
      // Ajouter le titre aux favoris
      if (!favorisPlaylist.tracks) favorisPlaylist.tracks = [];
      favorisPlaylist.tracks.push(track);
      favorisPlaylist.trackCount = favorisPlaylist.tracks.length;
      
      // Mettre à jour le localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Mettre à jour l'état local
      setPlaylists(userData.playlists);
      
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
  
  if (!isAuthenticated) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-screen-md mx-auto">
          <h1 className="font-audiowide text-4xl mb-8 glow text-primary-foreground text-center">
            NeonWave
          </h1>
          <AuthForm onAuthComplete={handleAuthComplete} />
        </div>
      </div>
    );
  }
  
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
        
        {/* Barre de recherche */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Playlists */}
        <div className="mb-8">
          <h2 className="text-xl font-audiowide mb-4 glow-blue text-electricBlue">
            Vos playlists
          </h2>
          {playlists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={{
                    ...playlist,
                    trackCount: playlist.tracks?.length || 0
                  }} 
                  onClick={handlePlaylistClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-muted/20 rounded-xl border border-primary/20 p-8 text-center backdrop-blur-sm">
              <p className="text-muted-foreground">Aucune playlist</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary/20 rounded-lg text-primary-foreground hover:bg-primary/30 transition-colors"
                onClick={() => navigate('/playlists')}
              >
                Créer votre première playlist
              </button>
            </div>
          )}
        </div>
        
        {/* Liste de titres */}
        <div className="mb-8">
          {randomTracks.length > 0 ? (
            <TrackList 
              tracks={randomTracks} 
              onTrackSelect={handleTrackSelect} 
              onAddToFavorites={handleAddToFavorites}
              currentTrackId={currentTrack?.id}
              title="Titres suggérés"
            />
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-6 w-36 bg-muted rounded mb-3"></div>
                <div className="h-4 w-48 bg-muted/50 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-xl border border-primary/20 p-8 text-center backdrop-blur-sm">
              <p className="text-muted-foreground mb-2">Aucun titre à afficher</p>
              <p className="text-sm text-muted-foreground">
                Utilisez la recherche pour trouver de la musique
              </p>
            </div>
          )}
        </div>
        
        {/* Player */}
        {currentTrack && (
          <div className="fixed left-0 right-0 bottom-16 md:bottom-4 pt-4 pb-2 px-4 bg-gradient-to-t from-background to-transparent z-10">
            <div className="max-w-screen-xl mx-auto">
              <MusicPlayer 
                currentTrack={currentTrack} 
                onNext={handleNextTrack}
                onPrevious={handlePreviousTrack}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
