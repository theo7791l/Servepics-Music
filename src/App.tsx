
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import GlitchLoader from './components/GlitchLoader';
import TitleBar from './components/TitleBar';
import Navbar from './components/Navbar';
import BackgroundParticles from './components/BackgroundParticles';
import { Toaster } from './components/ui/toaster';
import UpdateChecker from './components/UpdateChecker';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';

// Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaylistsPage from './pages/PlaylistsPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import NotFound from './pages/NotFound';

// Styles
import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<string>('violet'); // Default theme
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Apply theme to document body
  const applyTheme = (selectedTheme: string) => {
    const body = document.body;
    // Remove all theme classes
    body.classList.remove('theme-violet', 'theme-blue', 'theme-green', 'theme-hacker', 'theme-cyberpunk');
    // Add selected theme
    body.classList.add(`theme-${selectedTheme}`);
    // Save to localStorage
    localStorage.setItem('app-theme', selectedTheme);
    // Update state
    setTheme(selectedTheme);
  };

  // Vérifier l'état de l'authentification
  const checkAuthentication = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setIsAuthenticated(!!parsed.pin);
      } catch (e) {
        console.error("Error parsing user data:", e);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  // Initialize theme from localStorage on mount and check auth
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'violet';
    applyTheme(savedTheme);
    
    // Add transition class for smooth theme changes after initial load
    setTimeout(() => {
      document.body.classList.add('theme-transition');
    }, 100);

    // Check authentication status
    checkAuthentication();
  }, []);

  // Gestionnaire de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
  };

  // Gestionnaire d'authentification complète
  const handleAuthComplete = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return <GlitchLoader onComplete={() => setLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col h-screen w-screen overflow-hidden">
          <div className="flex items-center">
            <TitleBar />
            {isAuthenticated && <UserProfile onLogout={handleLogout} />}
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {isAuthenticated && <Navbar />}
            
            <main className="flex-1 overflow-auto relative">
              <BackgroundParticles />
              
              <div className="p-4 md:p-6 relative z-10">
                {isAuthenticated ? (
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/playlists" element={<PlaylistsPage />} />
                    <Route path="/settings" element={<SettingsPage onThemeChange={applyTheme} currentTheme={theme} />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <AuthForm onAuthComplete={handleAuthComplete} />
                  </div>
                )}
              </div>
            </main>
          </div>
          
          <UpdateChecker />
        </div>
      </Router>
      
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
