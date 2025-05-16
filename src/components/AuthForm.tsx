
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";

interface AuthFormProps {
  onAuthComplete: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<'pin' | 'username'>('pin');
  const [pin, setPin] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  
  useEffect(() => {
    // Vérifier si l'utilisateur existe déjà
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.pin) {
        setIsExistingUser(true);
      }
    }
  }, []);
  
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      toast({
        title: "Code PIN invalide",
        description: "Le code PIN doit contenir 6 chiffres",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (isExistingUser) {
      // Vérifier le PIN existant
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.pin !== pin) {
        toast({
          title: "Code PIN incorrect",
          description: "Veuillez réessayer",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      // PIN correct, connexion réussie
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${userData.username} !`,
        duration: 3000,
      });
      onAuthComplete();
      return;
    }
    
    // Nouveau compte, passer à l'étape du nom d'utilisateur
    setStep('username');
  };
  
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Nom d'utilisateur requis",
        description: "Veuillez entrer un nom d'utilisateur",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Créer un nouveau profil utilisateur
    const userData = {
      username,
      pin,
      createdAt: new Date().toISOString(),
      playlists: [
        {
          id: Date.now().toString(),
          name: "Favoris",
          trackCount: 0,
          coverUrl: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=400&h=400&auto=format&fit=crop",
          tracks: []
        }
      ]
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    toast({
      title: "Profil créé avec succès",
      description: `Bienvenue, ${username} !`,
      duration: 3000,
    });
    
    onAuthComplete();
  };
  
  return (
    <div className="bg-muted/20 rounded-xl border border-primary/20 p-6 backdrop-blur-sm max-w-md mx-auto">
      {step === 'pin' ? (
        <>
          <h2 className="text-xl font-audiowide mb-6 glow text-primary-foreground text-center">
            {isExistingUser ? "Entrez votre code PIN" : "Créez votre code PIN"}
          </h2>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Code PIN à 6 chiffres"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 6))}
                maxLength={6}
                pattern="\d{6}"
                className="text-center font-mono text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isExistingUser ? "Entrez votre code à 6 chiffres" : "Choisissez un code à 6 chiffres pour sécuriser votre profil"}
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full btn-glow-blue"
            >
              {isExistingUser ? "Se connecter" : "Continuer"}
            </Button>
            {isExistingUser && (
              <p className="text-xs text-center text-muted-foreground">
                <button 
                  type="button" 
                  onClick={() => {
                    if (confirm("Réinitialiser votre profil? Toutes vos playlists seront effacées.")) {
                      localStorage.removeItem('userData');
                      setIsExistingUser(false);
                      toast({
                        title: "Profil réinitialisé",
                        description: "Vous pouvez maintenant créer un nouveau profil",
                        duration: 3000,
                      });
                    }
                  }}
                  className="text-primary-foreground/60 hover:text-primary-foreground underline"
                >
                  Réinitialiser mon profil
                </button>
              </p>
            )}
          </form>
        </>
      ) : (
        <>
          <h2 className="text-xl font-audiowide mb-6 glow text-primary-foreground text-center">
            Choisissez votre nom d'utilisateur
          </h2>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setStep('pin')}
              >
                Retour
              </Button>
              <Button 
                type="submit" 
                className="btn-glow-blue"
              >
                Créer mon profil
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AuthForm;
