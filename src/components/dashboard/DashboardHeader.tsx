
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  subtitle 
}) => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-medium tracking-tight text-green-800">{title}</h1>
      {subtitle && (
        <p className="text-green-700/80 mt-1">
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default DashboardHeader;
