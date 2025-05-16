
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "@/components/Navbar";
import BackgroundParticles from "@/components/BackgroundParticles";
import GlitchLoader from "@/components/GlitchLoader";

import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import PlaylistsPage from "@/pages/PlaylistsPage";
import SettingsPage from "@/pages/SettingsPage";
import AboutPage from "@/pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clean up console
    console.log("%cNeonWave Music Player", "color: #8A2BE2; font-size: 24px; font-weight: bold;");
    console.log("%cPrivacy First | No Tracking | Open Source", "color: #00FFFF; font-size: 14px;");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Loading Screen */}
        {loading && (
          <GlitchLoader onComplete={() => setLoading(false)} />
        )}
        
        {/* Main App */}
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
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
            </main>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
