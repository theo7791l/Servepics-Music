
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

interface UserProfileProps {
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const [username, setUsername] = useState<string>('Utilisateur');
  
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.username) {
          setUsername(parsed.username);
        }
      } catch (e) {
        console.error("Erreur lors de la récupération du nom d'utilisateur:", e);
      }
    }
  }, []);
  
  return (
    <div className="ml-auto mr-4 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-primary/10">
            <Avatar className="h-8 w-8 border border-primary/30">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${username}`} alt={username} />
              <AvatarFallback className="text-primary bg-muted">
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-primary-foreground hidden md:block">{username}</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass-morphism">
          <DropdownMenuLabel>Mon profil</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;
