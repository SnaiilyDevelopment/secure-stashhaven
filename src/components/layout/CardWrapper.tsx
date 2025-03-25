
import React from 'react';

interface CardWrapperProps {
  children: React.ReactNode;
}

const CardWrapper: React.FC<CardWrapperProps> = ({ children }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      {children}
    </div>
  );
};

export default CardWrapper;
