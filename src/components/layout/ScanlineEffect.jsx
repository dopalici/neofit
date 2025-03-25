import React from 'react';

export default function ScanlineEffect() {
  return (
    <>
      {/* Scanline effect overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-10">
        <div className="scanlines h-screen w-screen"></div>
      </div>
      
      {/* Hexcode background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
        <div className="hex-pattern text-xs text-cyan-500 font-mono">
          {'01010101001010101101010100101'.repeat(1000)}
        </div>
      </div>
    </>
  );
}