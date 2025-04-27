import React from "react";

export default function ScanlineEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent opacity-30 animate-scanline" />
      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
