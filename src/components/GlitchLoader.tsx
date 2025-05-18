
import React, { useState, useEffect } from 'react';

interface GlitchLoaderProps {
  onComplete?: () => void;
}

const GlitchLoader: React.FC<GlitchLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);
  
  useEffect(() => {
    // Simulated loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        return next >= 100 ? 100 : next;
      });
    }, 200);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setShowLoader(false);
        if (onComplete) onComplete();
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);
  
  if (!showLoader) return null;
  
  return (
    <div className="fixed inset-0 bg-deepBlack flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-4">
        <h1 className="font-audiowide text-4xl mb-6 glitch glow text-center">
          Servepics music
        </h1>
        
        <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute h-full bg-gradient-to-r from-primary to-secondary rounded-full glitch"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-vt323 text-secondary">
            INITIALIZING
          </span>
          <span className="text-xs font-vt323 text-secondary">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs font-vt323 text-muted-foreground animate-pulse">
            PRIVACY FIRST . NO TRACKING . OPEN SOURCE
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlitchLoader;
