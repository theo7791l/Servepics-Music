
import React, { useEffect, useState } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface GithubRelease {
  tag_name: string;
  html_url: string;
  assets: Array<{
    browser_download_url: string;
    name: string;
  }>;
}

const GITHUB_REPO = 'theo7791l/Servepics-Music';
const CURRENT_VERSION = '1.0.0'; // Change this to match your current version

const UpdateChecker: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updateUrl, setUpdateUrl] = useState<string>('');

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Check if we're in an Electron environment
        const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
        
        if (!isElectron) {
          console.log("Not in Electron environment, skipping update check");
          return;
        }

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GithubRelease = await response.json();
        const latestVersion = data.tag_name.replace('v', '');

        // Simple version comparison (you might want a more robust solution for semantic versioning)
        if (latestVersion > CURRENT_VERSION) {
          setUpdateAvailable(true);
          
          // Find the appropriate asset based on platform
          let downloadUrl = data.html_url;
          
          if (window.electron && typeof window.electron === 'object') {
            const platform = await window.electron.getPlatform();
            
            // Find the correct asset for the current platform
            const platformExtensions: Record<string, string> = {
              'win32': '.exe',
              'darwin': '.dmg',
              'linux': '.AppImage'
            };
            
            const extension = platformExtensions[platform] || '';
            
            const asset = data.assets.find(a => a.name.endsWith(extension));
            if (asset) {
              downloadUrl = asset.browser_download_url;
            }
          }
          
          setUpdateUrl(downloadUrl);
          
          toast({
            title: "Mise à jour disponible",
            description: `Une nouvelle version ${latestVersion} est disponible.`,
            action: (
              <Button 
                variant="outline" 
                className="bg-primary/20 hover:bg-primary/30"
                onClick={() => openUpdate(downloadUrl)}
              >
                <Download size={16} className="mr-2" />
                Mettre à jour
              </Button>
            ),
            duration: 0, // Persistent notification
          });
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    checkForUpdates();
    
    // Check for updates every 24 hours
    const interval = setInterval(checkForUpdates, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openUpdate = (url: string) => {
    // Open in browser or with electron shell
    if (window.electron && typeof window.electron === 'object' && window.electron.openExternal) {
      window.electron.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        className="flex items-center bg-primary/90 hover:bg-primary shadow-lg"
        onClick={() => openUpdate(updateUrl)}
      >
        <AlertCircle size={16} className="mr-2" />
        Nouvelle version disponible
      </Button>
    </div>
  );
};

export default UpdateChecker;
