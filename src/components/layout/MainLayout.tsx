
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LockKeyhole, 
  LogOut, 
  User, 
  Files, 
  Settings, 
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };
    
    // Simulate a slight delay to show loading state
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('encryption_key');
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Don't render sidebar on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-pulse-subtle flex flex-col items-center gap-3">
          <LockKeyhole size={40} className="text-primary animate-float" />
          <p className="text-muted-foreground animate-fade-in">Loading secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {isAuthenticated && !isAuthPage && (
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xs h-screen sticky top-0 flex flex-col transition-all duration-300 animate-slide-up">
          <div className="p-4 flex items-center space-x-2 border-b border-border h-16">
            <LockKeyhole className="h-6 w-6 text-primary" />
            <h1 className="font-medium text-xl">SecureVault</h1>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            <NavigationLink to="/dashboard" active={location.pathname === '/dashboard'} icon={<Files size={18} />}>
              My Files
            </NavigationLink>
            <NavigationLink to="/profile" active={location.pathname === '/profile'} icon={<User size={18} />}>
              Profile
            </NavigationLink>
            <NavigationLink to="/settings" active={location.pathname === '/settings'} icon={<Settings size={18} />}>
              Settings
            </NavigationLink>
          </nav>
          
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </Button>
          </div>
        </aside>
      )}
      
      <main className={cn(
        "flex-1 transition-all duration-300",
        isAuthenticated && !isAuthPage ? "animate-fade-in" : "w-full animate-scale-in"
      )}>
        {children}
      </main>
    </div>
  );
};

interface NavigationLinkProps {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const NavigationLink: React.FC<NavigationLinkProps> = ({ to, active, icon, children }) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group hover:bg-secondary",
        active ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {icon}
      </span>
      <span>{children}</span>
      {active && (
        <ChevronRight size={16} className="ml-auto text-primary" />
      )}
    </Link>
  );
};

export default MainLayout;
