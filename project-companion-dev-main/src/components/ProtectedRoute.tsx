import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, accountStatus, isAdmin, logout } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/sign-in" replace />;
  }


  if (accountStatus === 'pending') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Clock className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Account Under Review</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your account has been created but is currently pending approval by our administrators. 
          You can browse the website, but certain features are restricted until you are approved.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
          <Button variant="outline" onClick={logout}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (accountStatus === 'banned') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Account Suspended</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your account has been suspended by an administrator. You can no longer access this platform.
        </p>
        <Button onClick={logout} variant="destructive">Sign Out</Button>
      </div>
    );
  }

  return <>{children}</>;
};
