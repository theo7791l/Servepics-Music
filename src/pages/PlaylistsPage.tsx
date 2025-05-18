import React, { useState, useEffect } from 'react';
import PlaylistCard from '@/components/PlaylistCard';
import TrackList from '@/components/TrackList';
import MusicPlayer from '@/components/MusicPlayer';
import AuthForm from '@/components/AuthForm';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  coverUrl?: string;
  tracks: Track[];
}

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  videoId?: string;
}

interface PlaylistsPageProps {
  isAuthRequired?: boolean;
}

const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ isAuthRequired = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const navigate = useNavigate();
  
  // Vérifier l'authentification et charger les playlists
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setIsAuthenticated(!!parsed.pin);
        if (parsed.playlists) {
          setPlaylists(parsed.playlists);
        }
        
        // Charger le morceau en cours s'il existe
        const savedTrack = localStorage.getItem('currentTrack');
        if (savedTrack) {
          setCurrentTrack(JSON.parse(savedTrack));
        }
      } catch (e) {
        console.error("Error loading user data:", e);
      }
    } else if (isAuthRequired) {
      // Rediriger vers la page d'accueil si l'authentification est requise
      navigate('/');
    }
  }, [navigate, isAuthRequired]);
  
  const handleAuthComplete = () => {
    setIsAuthenticated(true);
    // Recharger les playlists après l'authentification
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.playlists) {
        setPlaylists(parsed.playlists);
      }
    }
  };
  
  const handlePlaylistClick = (playlist: any) => {
    setSelectedPlaylist(playlist);
  };
  
  const handleTrackSelect = async (track: Track) => {
    // Si le morceau a déjà une URL audio, le lire directement
    if (track.audioUrl) {
      setCurrentTrack(track);
      localStorage.setItem('currentTrack', JSON.stringify(track));
      
      // Mettre à jour la présence Discord si disponible
      if (window.electron?.updateDiscordPresence) {
        window.electron.updateDiscordPresence({
          title: track.title,
          artist: track.artist
        });
      }
      
      // Journal audio si disponible
      if (window.electron?.logAudio) {
        window.electron.logAudio(`Playing: ${track.title} by ${track.artist}`);
      }
      
      return;
    }
    
    // Sinon, récupérer l'URL audio via Invidious (si videoId est disponible)
    if (track.videoId) {
      try {
        const invidiousInstances = [
          'https://invidious.fdn.fr',
          'https://y.com.sb',
          'https://invidious.slipfox.xyz',
          'https://invidious.privacydev.net',
          'https://vid.puffyan.us',
          'https://invidious.namazso.eu',
          'https://inv.riverside.rocks'
        ];
        
        // Essayer chaque instance jusqu'à ce qu'une fonctionne
        for (const instance of invidiousInstances) {
          try {
            const url = `${instance}/api/v1/videos/${track.videoId}`;
            console.log(`Trying to fetch from: ${url}`);
            
            const response = await fetch(url);
            
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
              
              // Mettre à jour le morceau dans la playlist
              if (selectedPlaylist) {
                const updatedPlaylist = { ...selectedPlaylist };
                const trackIndex = updatedPlaylist.tracks.findIndex(t => t.id === track.id);
                if (trackIndex !== -1) {
                  updatedPlaylist.tracks[trackIndex] = audioTrack;
                  setSelectedPlaylist(updatedPlaylist);
                  
                  // Mettre à jour dans le stockage local
                  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                  const playlistIndex = userData.playlists.findIndex((p: Playlist) => p.id === selectedPlaylist.id);
                  if (playlistIndex !== -1) {
                    userData.playlists[playlistIndex] = updatedPlaylist;
                    localStorage.setItem('userData', JSON.stringify(userData));
                  }
                }
              }
              
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
              setCurrentTrack(audioTrack);
              localStorage.setItem('currentTrack', JSON.stringify(audioTrack));
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
  
  const handleNextTrack = () => {
    if (!currentTrack || !selectedPlaylist || selectedPlaylist.tracks.length === 0) return;
    
    const currentIndex = selectedPlaylist.tracks.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % selectedPlaylist.tracks.length;
    handleTrackSelect(selectedPlaylist.tracks[nextIndex]);
  };
  
  const handlePreviousTrack = () => {
    if (!currentTrack || !selectedPlaylist || selectedPlaylist.tracks.length === 0) return;
    
    const currentIndex = selectedPlaylist.tracks.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + selectedPlaylist.tracks.length) % selectedPlaylist.tracks.length;
    handleTrackSelect(selectedPlaylist.tracks[prevIndex]);
  };
  
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour la playlist",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Créer une nouvelle playlist
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      trackCount: 0,
      tracks: [],
      coverUrl: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&h=400&auto=format&fit=crop"
    };
    
    // Mettre à jour l'état local
    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    
    // Mettre à jour le stockage local
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.playlists = updatedPlaylists;
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Fermer la boîte de dialogue et réinitialiser le formulaire
    setIsCreateDialogOpen(false);
    setNewPlaylistName("");
    
    toast({
      title: "Playlist créée",
      description: `La playlist "${newPlaylistName}" a été créée`,
      duration: 3000,
    });
  };
  
  if (!isAuthenticated && isAuthRequired) {
    return (
      <div className="py-10 px-4 search-container">
        <div className="max-w-screen-md mx-auto">
          <h1 className="font-audiowide text-3xl mb-8 glow text-primary-foreground text-center">
            Bienvenue sur Servepics music
          </h1>
          <AuthForm onAuthComplete={handleAuthComplete} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4 px-4 pb-20 playlist-container">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="font-audiowide text-3xl glow text-primary-foreground">
            Playlists
          </h1>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
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
                    {selectedPlaylist.tracks?.length || 0} {selectedPlaylist.tracks?.length === 1 ? 'titre' : 'titres'}
                  </p>
                </div>
              </div>
              
              {selectedPlaylist.tracks?.length > 0 ? (
                <TrackList 
                  tracks={selectedPlaylist.tracks} 
                  onTrackSelect={handleTrackSelect}
                  currentTrackId={currentTrack?.id}
                  title={`Titres dans ${selectedPlaylist.name}`}
                />
              ) : (
                <div className="bg-muted/20 rounded-xl border border-primary/20 p-8 text-center backdrop-blur-sm">
                  <p className="text-lg text-muted-foreground mb-2">Playlist vide</p>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez des titres depuis la recherche
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* List of playlists */}
            {playlists && playlists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
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
                <p className="text-lg text-muted-foreground mb-2">Aucune playlist</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez votre première playlist pour commencer
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="btn-glow-blue"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Créer une playlist
                </Button>
              </div>
            )}
          </>
        )}
        
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
        
        {/* Dialog for creating new playlist */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="bg-background border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-audiowide text-xl text-primary-foreground">Créer une nouvelle playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Input
                  placeholder="Nom de la playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-muted/20 border-primary/30 text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-primary/30"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                className="btn-glow-blue"
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PlaylistsPage;
