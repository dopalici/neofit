import React from "react";

export default function Header({
  isConnecting,
  onOpenSettings,
  onOpenAIChatbot,
}) {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-cyan-500/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-mono text-cyan-400">NEO•VITRU</h1>
            {isConnecting && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-sm text-cyan-400 font-mono">SYNCING</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAIChatbot}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded font-mono hover:bg-cyan-500/30 transition-colors"
            >
              AI ADVISOR
            </button>
            <button
              onClick={onOpenSettings}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded font-mono hover:bg-cyan-500/30 transition-colors"
            >
              SETTINGS
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
