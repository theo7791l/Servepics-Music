
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

// Pages
import Index from './pages/Index';
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

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'violet';
    applyTheme(savedTheme);
    
    // Add transition class for smooth theme changes after initial load
    setTimeout(() => {
      document.body.classList.add('theme-transition');
    }, 100);

    // Check authentication status
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setIsAuthenticated(!!parsed.pin);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {loading && <GlitchLoader onComplete={() => setLoading(false)} />}
      
      <Router>
        <div className="flex flex-col h-screen w-screen overflow-hidden">
          <TitleBar />
          
          <div className="flex flex-1 overflow-hidden">
            <Navbar />
            
            <main className="flex-1 overflow-auto relative">
              <BackgroundParticles />
              
              <div className="p-4 md:p-6 relative z-10">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/playlists" element={
                    <PlaylistsPage isAuthRequired={!isAuthenticated} />
                  } />
                  <Route path="/settings" element={<SettingsPage onThemeChange={applyTheme} currentTheme={theme} />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
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
