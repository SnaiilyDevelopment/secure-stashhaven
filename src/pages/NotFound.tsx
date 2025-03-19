
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LockKeyhole, ShieldAlert } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 space-y-2">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-medium tracking-tight">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
        </div>
        
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or you don't have permission to view it.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button asChild>
            <Link to="/">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Return to Vault
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
