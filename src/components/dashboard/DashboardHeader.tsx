
import React from 'react';
import { formatBytes } from '@/lib/storage/storageUtils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  storageUsed?: number; // Add storageUsed prop to the interface
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title = 'Your Secure Files', // Default title
  subtitle,
  storageUsed 
}) => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-medium tracking-tight text-green-800">{title}</h1>
      {subtitle && (
        <p className="text-green-700/80 mt-1">
          {subtitle}
        </p>
      )}
      {storageUsed !== undefined && (
        <p className="text-green-700/80 mt-2 text-sm">
          Storage used: {formatBytes(storageUsed)}
        </p>
      )}
    </header>
  );
};

export default DashboardHeader;
