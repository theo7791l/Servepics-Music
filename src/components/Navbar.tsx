
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ListMusic, Settings, Info } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { icon: <Home size={20} />, label: "Accueil", path: "/" },
    { icon: <Search size={20} />, label: "Recherche", path: "/search" },
    { icon: <ListMusic size={20} />, label: "Playlists", path: "/playlists" },
    { icon: <Settings size={20} />, label: "Paramètres", path: "/settings" },
    { icon: <Info size={20} />, label: "À propos", path: "/about" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-muted/90 backdrop-blur-xl border-t border-primary/20 py-1 md:relative md:w-16 md:h-screen md:border-t-0 md:border-r md:border-primary/20 z-10 navbar-container">
      <div className="flex justify-around md:flex-col md:justify-start md:items-center md:pt-6 md:space-y-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`p-2 md:p-3 rounded-lg flex flex-col items-center justify-center transition-all ${
              isActive(item.path) 
                ? 'text-primary bg-primary/10 btn-glow' 
                : 'text-muted-foreground hover:text-primary-foreground'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 md:text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
