
import React from 'react';
import { GitFork, Github, Globe, Heart, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const AboutPage: React.FC = () => {
  return (
    <div className="py-4 px-4">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-audiowide text-3xl mb-2 glow text-primary-foreground">
            À propos
          </h1>
          <p className="text-muted-foreground text-sm">
            NeonWave - Lecteur musical sans tracking, sans publicité
          </p>
        </div>
        
        <div className="space-y-8">
          {/* About the app */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-2xl font-audiowide glow text-primary-foreground mb-2">
                NeonWave
              </h2>
              <div className="text-sm text-muted-foreground text-center mb-2">
                Version 1.0.0
              </div>
              <div className="flex gap-2 justify-center">
                <span className="text-xs bg-primary/20 border border-primary/40 px-2 py-1 rounded-full font-vt323">
                  OPEN SOURCE
                </span>
                <span className="text-xs bg-secondary/20 border border-secondary/40 px-2 py-1 rounded-full font-vt323">
                  NO ADS
                </span>
                <span className="text-xs bg-primary/20 border border-primary/40 px-2 py-1 rounded-full font-vt323">
                  NO TRACKING
                </span>
              </div>
            </div>
            
            <p className="text-center mb-6">
              NeonWave est une application de streaming musical légère, open source et sans publicité,
              conçue avec une interface gamer futuriste. Elle fonctionne en local, sans collecte de données,
              et peut lire de la musique depuis diverses sources comme YouTube ou SoundCloud.
            </p>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Github size={16} />
                Code source
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <GitFork size={16} />
                Contribuer
              </Button>
            </div>
          </div>
          
          {/* Privacy Policy */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow-blue text-electricBlue flex items-center gap-2">
              <Shield size={20} />
              Politique de confidentialité
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Lock size={16} className="text-secondary" />
                  Pas de collecte de données
                </h3>
                <p className="text-sm text-muted-foreground">
                  NeonWave ne collecte aucune donnée personnelle. Tous vos paramètres et playlists
                  sont stockés localement sur votre ordinateur.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-secondary" />
                  Connexions réseau
                </h3>
                <p className="text-sm text-muted-foreground">
                  Les seules connexions réseau sont faites pour rechercher et diffuser du contenu musical
                  depuis les sources que vous avez choisies. Aucune télémétrie n'est envoyée.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Heart size={16} className="text-secondary" />
                  Respect des droits d'auteur
                </h3>
                <p className="text-sm text-muted-foreground">
                  NeonWave respecte les droits d'auteur et les conditions d'utilisation des services tiers.
                  Veuillez utiliser cette application de manière responsable et légale.
                </p>
              </div>
            </div>
          </div>
          
          {/* Credits */}
          <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-audiowide mb-4 glow text-primary-foreground">
              Crédits
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Développement</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Interface React avec TailwindCSS</li>
                  <li>- Lecteur audio personnalisé</li>
                  <li>- Visualisations audio</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Bibliothèques</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- React &amp; React Router</li>
                  <li>- Lucide Icons</li>
                  <li>- shadcn/ui Components</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <p className="text-center text-xs text-muted-foreground">
              Licence MIT - Créé avec 💜 pour la communauté
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
