
import React from 'react';
import { Minus, Square, X } from 'lucide-react';

declare global {
  interface Window {
    electron: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      updateDiscordPresence: (trackInfo: { title: string; artist: string }) => void;
      logAudio?: (message: string) => void;
    };
  }
}

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if (window.electron?.minimize) {
      window.electron.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electron?.maximize) {
      window.electron.maximize();
    }
  };

  const handleClose = () => {
    if (window.electron?.close) {
      window.electron.close();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-background/50 backdrop-blur-md flex items-center justify-between px-2 z-50 app-drag">
      <div className="text-xs font-audiowide text-primary-foreground">ServePics Music Player</div>
      <div className="flex items-center space-x-1 app-no-drag">
        <button 
          onClick={handleMinimize} 
          className="p-1 hover:bg-muted/30 rounded-sm text-muted-foreground hover:text-primary-foreground"
        >
          <Minus size={14} />
        </button>
        <button 
          onClick={handleMaximize} 
          className="p-1 hover:bg-muted/30 rounded-sm text-muted-foreground hover:text-primary-foreground"
        >
          <Square size={14} />
        </button>
        <button 
          onClick={handleClose} 
          className="p-1 hover:bg-destructive/30 rounded-sm text-muted-foreground hover:text-destructive"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
