
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre, un artiste..."
          className="w-full bg-muted/50 border border-primary/30 rounded-lg py-3 px-4 pr-12 
                    text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 
                    focus:ring-primary/50 focus:border-primary transition-all font-orbitron"
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-glow-blue rounded-lg p-2"
        >
          <Search className="h-5 w-5 text-electricBlue" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
