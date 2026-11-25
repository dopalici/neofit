import React from "react";
import { Eye, Moon, RefreshCw, Settings, Sparkles, Sun } from "lucide-react";

const THEME_META = {
  obsidian: {
    label: "Obsidian",
    icon: Eye,
    title: "System Obsidian (Click to switch visual comfort mode)",
  },
  "matrix-night": {
    label: "Night",
    icon: Moon,
    title: "Matrix Night — Low-Blue Circadian Mode",
  },
  daylight: {
    label: "Daylight",
    icon: Sun,
    title: "Daylight Clarity — High-Ambient Sunlight Mode",
  },
};

export default function Header({
  isConnecting,
  theme = "obsidian",
  onCycleTheme,
  onOpenSettings,
  onOpenAIChatbot,
  className = "",
}) {
  const themeInfo = THEME_META[theme] || THEME_META.obsidian;
  const ThemeIcon = themeInfo.icon;

  return (
    <header
      className={`backdrop-blur-md border-b sticky top-0 z-30 transition-colors safe-top ${className}`}
      style={{
        backgroundColor: "color-mix(in oklab, var(--nv-bg-elevated) 90%, transparent)",
        borderColor: "var(--nv-rule)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="text-base sm:text-lg font-bold tracking-wider truncate"
            style={{ color: "var(--nv-text)" }}
          >
            NEO<span style={{ color: "var(--nv-accent)" }}>•</span>VITRU
          </span>
          {isConnecting && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-mono"
              style={{ color: "var(--nv-accent)" }}
            >
              <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
              <span className="hidden sm:inline">Syncing</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCycleTheme && (
            <button
              type="button"
              onClick={onCycleTheme}
              title={themeInfo.title}
              aria-label={`Switch visual theme (current: ${themeInfo.label})`}
              className="h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors inline-flex items-center gap-1.5"
              style={{
                backgroundColor: "var(--nv-surface)",
                borderColor: "var(--nv-rule)",
                color: "var(--nv-text-secondary)",
              }}
            >
              <ThemeIcon size={14} style={{ color: "var(--nv-accent)" }} aria-hidden="true" />
              <span className="hidden sm:inline">{themeInfo.label}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAIChatbot}
            className="h-9 px-3 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            style={{
              backgroundColor: "var(--nv-accent-soft)",
              border: "1px solid var(--nv-border-strong)",
              color: "var(--nv-accent)",
            }}
          >
            <Sparkles size={13} aria-hidden="true" />
            <span>Coach</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="h-9 w-9 sm:w-auto sm:px-3 rounded-lg border text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: "var(--nv-surface)",
              borderColor: "var(--nv-rule)",
              color: "var(--nv-text-secondary)",
            }}
            aria-label="Open Settings and Integrations"
          >
            <Settings size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
