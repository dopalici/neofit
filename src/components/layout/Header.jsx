import React from 'react';
import { User, Settings, Bluetooth } from 'lucide-react';

export default function Header({ isConnecting, onOpenSettings }) {
  return (
    <header className="bg-gray-900 border-b border-cyan-800 text-cyan-400 shadow-lg shadow-cyan-900/30 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="font-bold text-xl mr-2 text-cyan-300">NEO•VITRU</div>
          <span className="text-cyan-600 text-xs font-mono">v2.38.5</span>
        </div>
        <div className="flex items-center space-x-4">
          {isConnecting && (
            <div className="text-xs text-cyan-600 font-mono flex items-center">
              <Bluetooth size={16} className="animate-pulse mr-1" />
              SYNCING BIOMETRICS
            </div>
          )}
          <button 
            onClick={onOpenSettings}
            className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition">
            INTEGRATIONS
          </button>
          <div className="w-10 h-10 bg-cyan-900 border border-cyan-600 rounded-full flex items-center justify-center glow-cyan">
            <User size={20} className="text-cyan-400" />
          </div>
        </div>
      </div>
    </header>
  );
}