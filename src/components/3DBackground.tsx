
import React from 'react';
import Background from './three/Background';
import { BackgroundProps } from './three/types';

const ThreeDBackground: React.FC<BackgroundProps> = (props) => {
  return <Background {...props} />;
};

export default ThreeDBackground;
