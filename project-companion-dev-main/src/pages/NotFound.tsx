import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full animate-fade-in">
        <div className="relative mb-8">
          <h1 className="text-[12rem] font-black text-primary/5 select-none leading-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tighter">Lost in Space?</h2>
              <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="default" className="rounded-full px-8 gap-2 hover-lift">
            <Link to="/">
              <Home className="h-4 w-4" /> Return Home
            </Link>
          </Button>
          <Button onClick={() => window.history.back()} variant="outline" className="rounded-full px-8 gap-2 hover-lift">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
        
        <div className="mt-12 text-xs text-muted-foreground uppercase tracking-widest opacity-50">
          DormLink Navigation System
        </div>
      </div>
    </div>
  );
};

export default NotFound;
