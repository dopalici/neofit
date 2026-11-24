import React from "react";
import { Eye, Moon, Settings, Sparkles, Sun } from "lucide-react";

const THEME_META = {
  obsidian: { label: "Obsidian", icon: Eye, title: "System Obsidian (Click to switch visual comfort mode)" },
  "matrix-night": { label: "Night", icon: Moon, title: "Matrix Night — Low-Blue Circadian Mode" },
  daylight: { label: "Daylight", icon: Sun, title: "Daylight Clarity — High-Ambient Sunlight Mode" },
};

export default function Header({
  isConnecting,
  theme = "obsidian",
  onCycleTheme,
  onOpenSettings,
  onOpenAIChatbot,
}) {
  const themeInfo = THEME_META[theme] || THEME_META.obsidian;
  const ThemeIcon = themeInfo.icon;

  return (
    <header
      className="backdrop-blur-md border-b sticky top-0 z-30 transition-colors safe-top"
      style={{
        backgroundColor: "color-mix(in srgb, var(--nv-bg-elevated) 88%, transparent)",
        borderColor: "var(--nv-border)",
      }}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-lg sm:text-xl font-mono font-bold tracking-wider text-cyan-300">
              NEO•VITRU
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono tracking-widest uppercase text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
              SYSTEM v2
            </span>
            {isConnecting && (
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-400 font-mono">SYNCING</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onCycleTheme && (
              <button
                type="button"
                onClick={onCycleTheme}
                title={themeInfo.title}
                aria-label={`Switch visual theme (current: ${themeInfo.label})`}
                className="px-3 py-2 bg-slate-900/80 text-slate-200 border border-slate-700/80 rounded-lg font-mono text-xs hover:border-cyan-400/60 transition-colors flex items-center gap-1.5"
              >
                <ThemeIcon size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">{themeInfo.label}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAIChatbot}
              className="px-3.5 py-2 bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 rounded-lg font-mono text-xs hover:bg-cyan-400 hover:text-slate-950 transition-colors flex items-center"
            >
              <Sparkles size={13} className="mr-1.5" />
              <span>AI Coach</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-2 bg-slate-900/80 text-slate-200 border border-slate-700/80 rounded-lg font-mono text-xs hover:border-slate-500 transition-colors flex items-center"
              aria-label="Open Settings and Integrations"
            >
              <Settings size={14} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
