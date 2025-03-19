
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, User, Settings as SettingsIcon, LogOut, FileIcon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackgroundScene from '../BackgroundScene';
import { logoutUser } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const ThreeDLayout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* 3D Background */}
      <BackgroundScene />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <LockKeyhole className="h-4 w-4 text-green-600" />
            </div>
            <span className="font-medium text-lg text-green-800">SafeHaven</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-green-700 hover:text-green-600 transition flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link to="/profile" className="text-green-700 hover:text-green-600 transition flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <Link to="/settings" className="text-green-700 hover:text-green-600 transition flex items-center gap-1.5">
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-700 hover:bg-green-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 relative z-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-green-100 py-4 text-center text-green-700/70 text-sm">
        <div className="container mx-auto">
          <p>Secure end-to-end encrypted storage</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} SafeHaven. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ThreeDLayout;
