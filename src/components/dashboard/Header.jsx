import React from "react";
import { Settings, Sparkles } from "lucide-react";

export default function Header({
  isConnecting,
  onOpenSettings,
  onOpenAIChatbot,
}) {
  return (
    <header className="bg-[#08111a]/90 backdrop-blur-md border-b border-slate-800/90 sticky top-0 z-30">
      <div className="container mx-auto px-6 py-3.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3.5">
            <span className="text-xl font-mono font-bold tracking-wider text-cyan-300">
              NEO•VITRU
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-widest uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              SYSTEM v2
            </span>
            {isConnecting && (
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-400 font-mono">SYNCING</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenAIChatbot}
              className="px-3.5 py-1.5 bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 rounded-lg font-mono text-xs hover:bg-cyan-400 hover:text-slate-950 transition-colors flex items-center"
            >
              <Sparkles size={13} className="mr-1.5" />
              AI COACH
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 bg-slate-900 text-slate-300 border border-slate-700 rounded-lg font-mono text-xs hover:border-slate-500 hover:text-slate-100 transition-colors flex items-center"
            >
              <Settings size={13} className="mr-1.5" />
              SYNC & SETTINGS
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
