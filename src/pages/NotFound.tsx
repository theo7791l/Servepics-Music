
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center bg-muted/20 rounded-xl border border-primary/20 p-8 backdrop-blur-sm max-w-lg">
        <div className="flex justify-center mb-4">
          <AlertTriangle size={48} className="text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-audiowide mb-4 glow text-primary-foreground">404</h1>
        <p className="text-xl text-electricBlue mb-6">Signal perdu dans le cyberespace</p>
        <p className="text-muted-foreground mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée vers une autre dimension.
        </p>
        <Button asChild className="btn-glow">
          <Link to="/">
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
