
import React from 'react';

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 mb-6 ${className}`}>
      {children}
    </div>
  );
};

export default CardWrapper;
