import React from 'react';
import { OrbitControls } from '@react-three/drei';

export default function ModelControls() {
  return (
    <OrbitControls 
      enablePan={false} 
      enableZoom={true} 
      minPolarAngle={Math.PI / 4} 
      maxPolarAngle={Math.PI / 2}
      minDistance={3}
      maxDistance={8} 
    />
  );
}