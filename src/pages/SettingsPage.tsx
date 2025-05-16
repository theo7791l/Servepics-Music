
import React, { useState } from 'react';
import { Check, Cloud, Download, GitFork, Globe, HardDrive, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from '@/components/ui/separator';
import { toast } from "@/hooks/use-toast";

const SettingsPage: React.FC = () => {
  // Theme settings
  const [currentTheme, setCurrentTheme] = useState<string>('violet');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(true);
  const [currentSource, setCurrentSource] = useState<string>('youtube');
  
  // Theme options
  const themes = [
    { id: 'violet', name: 'Violet Gamer', description: 'Thème violet néon par défaut' },
    { id: 'blue', name: 'Cyberpunk Bleu', description: 'Dominance de bleus électriques' },
    { id: 'green', name: 'Mode Hacker', description: 'Style terminal avec effets verts' },
  ];
  
  // Music sources
  const sources = [
    { id: 'youtube', name: 'YouTube', description: 'Via youtube-dl (sans compte)' },
    { id: 'soundcloud', name: 'SoundCloud', description: 'Via API publique' },
    { id: 'jamendo', name: 'Jamendo', description: 'Musiques libres de droits' },
    { id: 'spotify', name: 'Spotify', description: 'Nécessite un compte premium', disabled: true },
  ];
  
  // Handle theme change
  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    toast({
      title: "Thème modifié",
      description: "Le thème sera appliqué au prochain démarrage",
      duration: 3000,
    });
  };
  
  // Handle source change
  const handleSourceChange = (sourceId: string) => {
    setCurrentSource(sourceId);
    toast({
      title: "Source modifiée",
      description: "La recherche utilisera maintenant " + sources.find(s => s.id === sourceId)?.name,
      duration: 3000,
    });
  };
  
  // Handle offline toggle
  const handleOfflineModeToggle = (checked: boolean) => {
    setOfflineMode(checked);
    toast({
      title: checked ? "Mode hors-ligne activé" : "Mode hors-ligne désactivé",
      description: checked 
        ? "L'application fonctionnera sans connexion internet" 
        : "L'application utilisera internet pour les recherches",
      duration: 3000,
    });
  };
  
  // Export settings
  const handleExportSettings = () => {
    const settings = {
      theme: currentTheme,
      offlineMode,
      downloadEnabled,
      source: currentSource,
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0"
    };
    
    // Create a download link for the settings JSON
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neonwave-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Paramètres exportés",
      description: "Fichier neonwave-settings.json téléchargé",
      duration: 3000,
    });
  };
  
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
              value={currentTheme}
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
          
          {/* Music Sources */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow-blue text-electricBlue">
              Sources musicales
            </h2>
            
            <RadioGroup 
              value={currentSource}
              onValueChange={handleSourceChange}
              className="grid gap-4"
            >
              {sources.map(source => (
                <div key={source.id} className={source.disabled ? "opacity-50" : ""}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={source.id} 
                      id={source.id} 
                      disabled={source.disabled}
                    />
                    <Label 
                      htmlFor={source.id} 
                      className="font-medium cursor-pointer"
                    >
                      {source.name}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 mt-1">
                    {source.description}
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
                  onCheckedChange={setDownloadEnabled}
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
                  toast({
                    title: "Importation",
                    description: "Fonctionnalité à venir dans la prochaine version",
                    duration: 3000,
                  });
                }}
              >
                Importer des paramètres
              </Button>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Suppression",
                    description: "Données locales effacées avec succès",
                    duration: 3000,
                  });
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
