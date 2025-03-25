
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Shield, 
  Files, 
  Settings, 
  User, 
  Home, 
  LogOut,
  X
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost"
            size="icon"
            aria-label="Menu"
            onClick={toggleSidebar}
            className="mr-4 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 
            className="text-xl font-semibold text-green-700 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            SecureVault
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="hidden md:inline text-sm text-gray-600">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/profile')}
                className="hidden md:flex"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar - Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed md:sticky top-0 left-0 h-full w-64 bg-white shadow-md z-50 transition-transform duration-300 ease-in-out transform
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold text-green-700">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="p-4 space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full justify-start"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="w-full justify-start"
            >
              <Files className="h-4 w-4 mr-2" />
              Files
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/settings')}
              className="w-full justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profile')}
              className="w-full justify-start md:hidden"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => logout()}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4 text-green-500" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default MainLayout;
