
import React, { useState, useEffect, useContext } from 'react';
import { Check, Cloud, Download, Info, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { toast } from "@/hooks/use-toast";
import AuthForm from '@/components/AuthForm';
import { PlayerContext } from '@/App';

const SettingsPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Theme settings
  const { theme, setTheme } = useContext(PlayerContext);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(true);
  const [currentInstance, setCurrentInstance] = useState<string>('auto');
  
  // Theme options
  const themes = [
    { id: 'violet', name: 'Violet Gamer', description: 'Thème violet néon par défaut' },
    { id: 'blue', name: 'Cyberpunk Bleu', description: 'Dominance de bleus électriques' },
    { id: 'green', name: 'Mode Hacker', description: 'Style terminal avec effets verts' },
  ];
  
  // Invidious instances
  const instances = [
    { id: 'auto', name: 'Automatique', description: 'L\'application choisit la meilleure instance' },
    { id: 'invidious.fdn.fr', name: 'invidious.fdn.fr', description: 'Instance française' },
    { id: 'y.com.sb', name: 'y.com.sb', description: 'Instance rapide' },
    { id: 'invidious.slipfox.xyz', name: 'invidious.slipfox.xyz', description: 'Instance alternative 1' },
    { id: 'invidious.privacydev.net', name: 'invidious.privacydev.net', description: 'Instance alternative 2' },
  ];
  
  // Vérifier l'authentification et charger les paramètres
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setIsAuthenticated(!!parsed.pin);
        
        // Charger les paramètres utilisateur
        if (parsed.settings) {
          setOfflineMode(parsed.settings.offlineMode || false);
          setDownloadEnabled(parsed.settings.downloadEnabled || true);
          setCurrentInstance(parsed.settings.instance || 'auto');
        }
      } catch (e) {
        console.error("Error loading user settings:", e);
      }
    }
  }, []);
  
  const handleAuthComplete = () => {
    setIsAuthenticated(true);
    // Recharger les paramètres après l'authentification
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.settings) {
          setOfflineMode(parsed.settings.offlineMode || false);
          setDownloadEnabled(parsed.settings.downloadEnabled || true);
          setCurrentInstance(parsed.settings.instance || 'auto');
        }
      } catch (e) {
        console.error("Error loading user settings:", e);
      }
    }
  };
  
  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    
    // Déclencher un événement personnalisé pour informer l'application du changement de thème
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeId }));
    
    // Apply theme immediately
    document.documentElement.classList.remove('theme-violet', 'theme-blue', 'theme-green');
    document.documentElement.classList.add(`theme-${themeId}`);
    
    // Save to user settings
    saveSettings({ theme: themeId });
    
    toast({
      title: "Thème modifié",
      description: `Le thème "${themes.find(t => t.id === themeId)?.name}" a été appliqué`,
      duration: 3000,
    });
  };
  
  // Handle instance change
  const handleInstanceChange = (instanceId: string) => {
    setCurrentInstance(instanceId);
    
    // Save to user settings
    saveSettings({ instance: instanceId });
    
    toast({
      title: "Instance modifiée",
      description: `L'instance Invidious a été changée pour "${instanceId}"`,
      duration: 3000,
    });
  };
  
  // Handle offline toggle
  const handleOfflineModeToggle = (checked: boolean) => {
    setOfflineMode(checked);
    
    // Save to user settings
    saveSettings({ offlineMode: checked });
    
    toast({
      title: checked ? "Mode hors-ligne activé" : "Mode hors-ligne désactivé",
      description: checked 
        ? "L'application fonctionnera sans connexion internet" 
        : "L'application utilisera internet pour les recherches",
      duration: 3000,
    });
  };
  
  // Save settings helper
  const saveSettings = (newSettings: any) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.settings = {
      ...(userData.settings || {}),
      ...newSettings
    };
    localStorage.setItem('userData', JSON.stringify(userData));
  };
  
  // Export settings
  const handleExportSettings = () => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const settings = {
      ...userData,
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0"
    };
    
    // Create a download link for the settings JSON
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'servepics-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Paramètres exportés",
      description: "Fichier servepics-settings.json téléchargé",
      duration: 3000,
    });
  };
  
  if (!isAuthenticated) {
    return (
      <div className="py-10 px-4">
        <div className="max-w-screen-md mx-auto">
          <h1 className="font-audiowide text-3xl mb-8 glow text-primary-foreground text-center">
            Paramètres - ServePics
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
          <h1 className="font-audiowide text-3xl mb-2 glow text-primary-foreground">
            Paramètres
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Configurez l'application selon vos préférences
          </p>
        </div>
        
        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow text-primary-foreground">
              Thème visuel
            </h2>
            
            <RadioGroup 
              value={theme}
              onValueChange={handleThemeChange}
              className="grid gap-4 grid-cols-1 md:grid-cols-3"
            >
              {themes.map(theme => (
                <div key={theme.id}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={theme.id} id={theme.id} />
                    <Label 
                      htmlFor={theme.id} 
                      className="font-medium cursor-pointer"
                    >
                      {theme.name}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 mt-1">
                    {theme.description}
                  </p>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Invidious Instances */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow-blue text-electricBlue">
              Instances Invidious
            </h2>
            
            <RadioGroup 
              value={currentInstance}
              onValueChange={handleInstanceChange}
              className="grid gap-4"
            >
              {instances.map(instance => (
                <div key={instance.id}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={instance.id} 
                      id={instance.id}
                    />
                    <Label 
                      htmlFor={instance.id} 
                      className="font-medium cursor-pointer"
                    >
                      {instance.name}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 mt-1">
                    {instance.description}
                  </p>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Storage Settings */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow text-primary-foreground">
              Stockage et connexion
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label 
                    htmlFor="offline-mode"
                    className="font-medium cursor-pointer flex items-center"
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Mode hors-ligne
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Utiliser uniquement les titres téléchargés
                  </p>
                </div>
                <Switch 
                  id="offline-mode" 
                  checked={offlineMode} 
                  onCheckedChange={handleOfflineModeToggle}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label 
                    htmlFor="download-enabled"
                    className="font-medium cursor-pointer flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Autoriser téléchargement
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Télécharger automatiquement les titres écoutés
                  </p>
                </div>
                <Switch 
                  id="download-enabled" 
                  checked={downloadEnabled} 
                  onCheckedChange={(checked) => {
                    setDownloadEnabled(checked);
                    saveSettings({ downloadEnabled: checked });
                  }}
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleExportSettings}
                className="w-full"
              >
                Exporter les paramètres (.json)
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = ".json";
                  fileInput.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const importedData = JSON.parse(event.target?.result as string);
                          
                          if (importedData.settings) {
                            // Demander confirmation
                            if (confirm("Voulez-vous importer ces paramètres ? Cela remplacera vos paramètres actuels.")) {
                              localStorage.setItem('userData', JSON.stringify(importedData));
                              
                              // Appliquer les paramètres importés
                              setTheme(importedData.settings.theme || 'violet');
                              setOfflineMode(importedData.settings.offlineMode || false);
                              setDownloadEnabled(importedData.settings.downloadEnabled || true);
                              setCurrentInstance(importedData.settings.instance || 'auto');
                              
                              // Apply theme immediately
                              document.documentElement.classList.remove('theme-violet', 'theme-blue', 'theme-green');
                              document.documentElement.classList.add(`theme-${importedData.settings.theme || 'violet'}`);
                              
                              toast({
                                title: "Paramètres importés",
                                description: "Vos paramètres ont été mis à jour",
                                duration: 3000,
                              });
                            }
                          } else {
                            toast({
                              title: "Format invalide",
                              description: "Le fichier ne contient pas de paramètres valides",
                              variant: "destructive",
                              duration: 3000,
                            });
                          }
                        } catch (e) {
                          console.error("Error importing settings:", e);
                          toast({
                            title: "Erreur d'importation",
                            description: "Le fichier n'est pas un JSON valide",
                            variant: "destructive",
                            duration: 3000,
                          });
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  fileInput.click();
                }}
              >
                Importer des paramètres
              </Button>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.")) {
                    localStorage.clear();
                    toast({
                      title: "Données supprimées",
                      description: "Toutes les données locales ont été effacées",
                      duration: 3000,
                    });
                    
                    // Rediriger vers l'écran d'authentification
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  }
                }}
              >
                Supprimer toutes les données locales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
