import React, { useState } from 'react';
import { RadioGroup } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface SettingsPageProps {
  onThemeChange: (theme: string) => void;
  currentTheme: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onThemeChange, currentTheme }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);
  const [checkingUpdates, setCheckingUpdates] = useState<boolean>(false);
  
  const themes = [
    { id: 'violet', name: 'Violet', description: 'Thème violet néon par défaut' },
    { id: 'blue', name: 'Bleu', description: 'Thème bleu électrique' },
    { id: 'green', name: 'Vert', description: 'Thème vert émeraude' },
    { id: 'hacker', name: 'Hacker', description: 'Mode terminal hacker' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Style néon rouge et bleu' },
  ];
  
  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    onThemeChange(value);
    
    toast({
      title: "Thème appliqué",
      description: `Le thème ${themes.find(t => t.id === value)?.name} a été activé.`,
      duration: 3000,
    });
  };
  
  const checkForUpdates = async () => {
    setCheckingUpdates(true);
    
    try {
      const response = await fetch('https://api.github.com/repos/theo7791l/Servepics-Music/releases/latest');
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      const latestVersion = data.tag_name.replace('v', '');
      const currentVersion = '1.0.0'; // Should match the version in UpdateChecker
      
      if (latestVersion > currentVersion) {
        toast({
          title: "Mise à jour disponible",
          description: `Une nouvelle version ${latestVersion} est disponible.`,
          duration: 0,
          action: (
            <Button 
              variant="outline" 
              className="bg-primary/20 hover:bg-primary/30"
              onClick={() => {
                if (window.electron?.openExternal) {
                  window.electron.openExternal(data.html_url);
                } else {
                  window.open(data.html_url, '_blank');
                }
              }}
            >
              Télécharger
            </Button>
          ),
        });
      } else {
        toast({
          title: "Aucune mise à jour",
          description: "Vous utilisez déjà la dernière version.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les mises à jour pour le moment.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setCheckingUpdates(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-audiowide mb-8 glow">Paramètres</h1>
      
      <div className="space-y-10">
        {/* Thèmes */}
        <div className="bg-muted/20 p-6 rounded-xl border border-primary/20">
          <h2 className="text-2xl font-audiowide mb-4 text-secondary">Apparence</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-lg mb-4 block">Thème de l'application</Label>
              
              <RadioGroup value={selectedTheme} onValueChange={handleThemeChange} className="space-y-4">
                {themes.map((theme) => (
                  <div 
                    key={theme.id} 
                    className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:border-primary transition-colors ${
                      selectedTheme === theme.id ? 'bg-primary/20 border-primary' : 'border-border'
                    }`}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/70"></div>
                    <div className="flex-1">
                      <div className="font-medium">{theme.name}</div>
                      <div className="text-sm text-muted-foreground">{theme.description}</div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-center">
              <div className={`w-52 h-52 rounded-xl bg-muted/30 border border-primary/30 flex flex-col items-center justify-center shadow-lg theme-preview theme-${selectedTheme}`}>
                <div className="w-36 h-2 bg-primary rounded mb-3"></div>
                <div className="w-24 h-2 bg-secondary rounded mb-6"></div>
                <div className="w-16 h-16 rounded-full bg-primary/50 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-muted/40"></div>
                </div>
                <div className="w-36 h-2 bg-secondary/70 rounded mt-6"></div>
                <div className="w-24 h-2 bg-primary/70 rounded mt-3"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mises à jour */}
        <div className="bg-muted/20 p-6 rounded-xl border border-primary/20">
          <h2 className="text-2xl font-audiowide mb-4 text-secondary">Mises à jour</h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg mb-1">Vérifier les mises à jour</h3>
              <p className="text-muted-foreground text-sm">
                Vérifie si une nouvelle version est disponible sur GitHub
              </p>
            </div>
            
            <Button 
              onClick={checkForUpdates} 
              disabled={checkingUpdates}
              className="bg-primary/90 hover:bg-primary"
            >
              {checkingUpdates ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Vérification...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Vérifier maintenant
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-6 bg-muted/30 p-4 rounded-lg flex items-start border border-muted">
            <AlertCircle size={20} className="mr-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Servepics music vérifie automatiquement les mises à jour au démarrage et 
                chaque jour. Vous pouvez aussi vérifier manuellement à tout moment.
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                Dépôt GitHub: <a 
                  href="https://github.com/theo7791l/Servepics-Music/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.electron?.openExternal) {
                      window.electron.openExternal('https://github.com/theo7791l/Servepics-Music/');
                    } else {
                      window.open('https://github.com/theo7791l/Servepics-Music/', '_blank');
                    }
                  }}
                >
                  theo7791l/Servepics-Music
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
