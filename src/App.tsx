
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import BackgroundParticles from "@/components/BackgroundParticles";
import GlitchLoader from "@/components/GlitchLoader";
import MusicPlayer from "@/components/MusicPlayer";
import TitleBar from "@/components/TitleBar";

import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import PlaylistsPage from "@/pages/PlaylistsPage";
import SettingsPage from "@/pages/SettingsPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "./pages/NotFound";
import React from "react";

const queryClient = new QueryClient();

// Player context
export const PlayerContext = React.createContext<{
  currentTrack: any;
  setCurrentTrack: (track: any) => void;
  handleNextTrack: () => void;
  handlePreviousTrack: () => void;
  theme: string;
  setTheme: (theme: string) => void;
}>({
  currentTrack: null,
  setCurrentTrack: () => {},
  handleNextTrack: () => {},
  handlePreviousTrack: () => {},
  theme: 'violet',
  setTheme: () => {},
});

// Global player component that persists across routes
const GlobalPlayer = () => {
  const { currentTrack, handleNextTrack, handlePreviousTrack } = React.useContext(PlayerContext);
  const location = useLocation();
  
  // Les routes qui ont déjà leur propre player
  const skipPlayerRoutes = ['/playlists', '/search'];
  const shouldShowPlayer = currentTrack && !skipPlayerRoutes.includes(location.pathname);
  
  if (!shouldShowPlayer) return null;
  
  return (
    <div className="fixed left-0 right-0 bottom-16 md:bottom-4 pt-4 pb-2 px-4 bg-gradient-to-t from-background to-transparent z-10">
      <div className="max-w-screen-xl mx-auto">
        <MusicPlayer 
          currentTrack={currentTrack}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [theme, setTheme] = useState('violet');

  useEffect(() => {
    // Clean up console
    console.log("%cServePics Music Player", "color: #8A2BE2; font-size: 24px; font-weight: bold;");
    console.log("%cPrivacy First | No Tracking | Open Source", "color: #00FFFF; font-size: 14px;");
    
    // Load current track and queue from localStorage
    const savedTrack = localStorage.getItem('currentTrack');
    if (savedTrack) {
      try {
        setCurrentTrack(JSON.parse(savedTrack));
      } catch (e) {
        console.error("Error loading current track:", e);
      }
    }
    
    const savedQueue = localStorage.getItem('queue');
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Error loading queue:", e);
      }
    }
    
    // Apply saved theme
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.settings?.theme) {
          setTheme(parsed.settings.theme);
          applyTheme(parsed.settings.theme);
        }
      } catch (e) {
        console.error("Error loading theme:", e);
      }
    }
    
    // Ajouter un listener pour les changements de thème
    window.addEventListener('themeChanged', ((event: CustomEvent) => {
      const newTheme = event.detail;
      if (newTheme) {
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    }) as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', (() => {}) as EventListener);
    };
  }, []);
  
  // Fonction pour appliquer le thème à tout le document
  const applyTheme = (themeName: string) => {
    // Supprimer toutes les classes de thème existantes
    document.documentElement.classList.remove('theme-violet', 'theme-blue', 'theme-green', 'theme-hacker', 'theme-cyberpunk');
    // Ajouter la nouvelle classe de thème
    document.documentElement.classList.add(`theme-${themeName}`);
    
    // Appliquer des styles spécifiques en fonction du thème
    const root = document.documentElement;
    
    switch (themeName) {
      case 'violet':
        root.style.setProperty('--primary-color', '#9b87f5');
        root.style.setProperty('--secondary-color', '#7E69AB');
        break;
      case 'blue':
        root.style.setProperty('--primary-color', '#0EA5E9');
        root.style.setProperty('--secondary-color', '#1EAEDB');
        break;
      case 'green':
        root.style.setProperty('--primary-color', '#10B981');
        root.style.setProperty('--secondary-color', '#059669');
        break;
      case 'hacker':
        root.style.setProperty('--primary-color', '#00FF41');
        root.style.setProperty('--secondary-color', '#008F11');
        root.style.setProperty('--background-color', '#0D0208');
        root.style.setProperty('--text-color', '#00FF41');
        break;
      case 'cyberpunk':
        root.style.setProperty('--primary-color', '#FF2A6D');
        root.style.setProperty('--secondary-color', '#05D9E8');
        root.style.setProperty('--background-color', '#121212');
        root.style.setProperty('--text-color', '#FF2A6D');
        break;
      default:
        root.style.setProperty('--primary-color', '#9b87f5');
        root.style.setProperty('--secondary-color', '#7E69AB');
    }
  }
  
  // Handle next track
  const handleNextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    
    setCurrentTrack(nextTrack);
    localStorage.setItem('currentTrack', JSON.stringify(nextTrack));
  };
  
  // Handle previous track
  const handlePreviousTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];
    
    setCurrentTrack(prevTrack);
    localStorage.setItem('currentTrack', JSON.stringify(prevTrack));
  };
  
  // Update queue when currentTrack changes
  const updateCurrentTrack = (track: any) => {
    setCurrentTrack(track);
    localStorage.setItem('currentTrack', JSON.stringify(track));
    
    // Add to queue if not already present
    if (track && !queue.find(t => t.id === track.id)) {
      const newQueue = [...queue, track];
      setQueue(newQueue);
      localStorage.setItem('queue', JSON.stringify(newQueue));
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PlayerContext.Provider value={{
        currentTrack,
        setCurrentTrack: updateCurrentTrack,
        handleNextTrack,
        handlePreviousTrack,
        theme,
        setTheme: (newTheme) => {
          setTheme(newTheme);
          applyTheme(newTheme);
          
          // Sauvegarder le thème dans les paramètres utilisateur
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (!userData.settings) userData.settings = {};
          userData.settings.theme = newTheme;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Loading Screen */}
          {loading && (
            <GlitchLoader onComplete={() => setLoading(false)} />
          )}
          
          {/* Title Bar for Desktop App */}
          <TitleBar />
          
          {/* Main App */}
          <div className={`min-h-screen flex flex-col md:flex-row overflow-hidden pt-8 theme-${theme}`}>
            <BackgroundParticles />
            
            <BrowserRouter>
              <Navbar />
              
              <main className="flex-1 pb-16 md:pb-0 md:pl-16 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/playlists" element={<PlaylistsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                <GlobalPlayer />
              </main>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </PlayerContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
