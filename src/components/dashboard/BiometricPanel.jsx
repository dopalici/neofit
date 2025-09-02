import React, { useState, useEffect } from 'react';
import AnimatedBiometricModel from '../3d/AnimatedBiometricModel';

export default function BiometricPanel({ userData, healthData }) {
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [animationInterval, setAnimationInterval] = useState(null);
  
  // Animation sequence that cycles through available animations - DISABLED
  useEffect(() => {
    // Set to idle animation only
    setCurrentAnimation('idle');
    
    // // Clear existing interval if there is one
    // if (animationInterval) {
    //   clearInterval(animationInterval);
    // }
    
    // // Define available animations
    // const animations = ['idle', 'squat', 'pushup', 'jumpingJack', 'plank', 'situp'];
    // let currentIndex = 0;
    
    // // Set initial animation
    // setCurrentAnimation(animations[currentIndex]);
    
    // // Create new interval to cycle through animations
    // const interval = setInterval(() => {
    //   // Move to next animation
    //   currentIndex = (currentIndex + 1) % animations.length;
      
    //   // First set to idle to reset position, then after a short delay set to next animation
    //   setCurrentAnimation('idle');
      
    //   setTimeout(() => {
    //     setCurrentAnimation(animations[currentIndex]);
    //   }, 500);
      
    // }, 15000); // Change animation every 15 seconds (increased for better viewing)
    
    // setAnimationInterval(interval);
    
    // // Cleanup interval on component unmount
    // return () => {
    //   clearInterval(interval);
    // };
  }, []);

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">BIOMETRIC IMPRINT</h2>
          <div className="flex items-center">
            <span className="text-xs text-cyan-600 font-mono mr-2">APPLE HEALTH</span>
            <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center" title="Apple Health Connected">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        
        <div className="relative bg-gray-950 rounded h-80 flex items-center justify-center mb-4 border border-cyan-900 overflow-hidden">
          <AnimatedBiometricModel 
            userData={userData} 
            currentAnimation={currentAnimation}
          />
          
          {/* Animation indicator */}
          <div className="absolute bottom-2 right-2 bg-gray-900/70 px-2 py-1 rounded text-xs text-cyan-400 font-mono">
            ANIMATION: {currentAnimation.toUpperCase()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <p className="text-xs text-cyan-600 font-mono mb-1">WEIGHT STATUS</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-cyan-300 font-mono">{healthData?.weight?.current || '78.3'} kg</p>
              <div className="text-xs text-green-500 font-mono flex items-center">
                <span className="mr-1">-0.4kg</span>
              </div>
            </div>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              LAST MEASURED: {healthData?.weight?.lastUpdated || 'TODAY 06:21'}
            </p>
          </div>
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <p className="text-xs text-cyan-600 font-mono mb-1">MUSCULAR DENSITY</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-cyan-300 font-mono">42.8%</p>
              <div className="text-xs text-green-500 font-mono flex items-center">
                <span className="mr-1">+0.8%</span>
              </div>
            </div>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              TRENDING POSITIVE
            </p>
          </div>
        </div>
        
        {/* Optional: Animation Controls */}
        <div className="mt-4 border-t border-cyan-900 pt-4">
          <p className="text-xs text-cyan-600 font-mono mb-2">PREVIEW EXERCISES</p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setCurrentAnimation('idle')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'idle' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              IDLE
            </button>
            <button 
              onClick={() => setCurrentAnimation('pushup')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'pushup' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              PUSH-UP
            </button>
            <button 
              onClick={() => setCurrentAnimation('squat')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'squat' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              SQUAT
            </button>
            <button 
              onClick={() => setCurrentAnimation('jumpingJack')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'jumpingJack' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              JUMPING JACK
            </button>
            <button 
              onClick={() => setCurrentAnimation('plank')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'plank' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              PLANK
            </button>
            <button 
              onClick={() => setCurrentAnimation('situp')}
              className={`px-2 py-1 text-xs font-mono rounded ${currentAnimation === 'situp' ? 'bg-cyan-900 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}
            >
              SIT-UP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}