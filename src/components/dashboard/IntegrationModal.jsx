import { motion } from "framer-motion";
import React, { useState } from "react";
import { Check, Eye, Moon, Sun, X } from "lucide-react";
import KnowledgeBaseImporter from "../settings/KnowledgeBaseImporter";
import { VISUAL_THEMES } from "../../utils/themeUtils";

const THEME_ICONS = {
  obsidian: Eye,
  "matrix-night": Moon,
  daylight: Sun,
};

export default function IntegrationModal({
  isOpen,
  onClose,
  connectedApps,
  onToggleConnection,
  theme = "obsidian",
  onSelectTheme,
}) {
  const [activeTab, setActiveTab] = useState("connections");

  if (!isOpen) return null;

  const apps = [
    {
      id: "appleHealth",
      name: "Apple Health",
      icon: "🍎",
      description: "Sync workouts, VO2 max, HRV, sleep, and resting heart rate",
    },
    {
      id: "myFitnessPal",
      name: "MyFitnessPal",
      icon: "🥗",
      description: "Import your nutrition and daily protein/calorie tracking data",
    },
    {
      id: "strava",
      name: "Strava",
      icon: "🏃",
      description: "Connect your outdoor running, cycling, and endurance sessions",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="system-window nv-modal-surface rounded-2xl p-6 max-w-lg w-full max-h-[86vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">System Settings</h2>
            <p className="text-xs text-slate-400">
              Manage health connections, visual comfort, and your FitLib vault.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
          {[
            { id: "connections", label: "CONNECTIONS" },
            { id: "display", label: "VISUAL COMFORT" },
            { id: "knowledge", label: "KNOWLEDGE BASE" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors border ${
                activeTab === tab.id
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "connections" && (
          <>
            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="nv-surface-subtle p-4 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{app.name}</h3>
                        <p className="text-xs text-slate-400">{app.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleConnection(app.id)}
                      className={`px-3.5 py-2 rounded-lg font-mono text-xs transition-colors border shrink-0 ${
                        connectedApps[app.id]
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-900/70 text-slate-300 border-slate-700 hover:border-cyan-400/50"
                      }`}
                    >
                      {connectedApps[app.id] ? "Connected" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-400 text-center">
                Connected services automatically feed your Readiness Gate and Cardio Goal Engine.
              </p>
            </div>
          </>
        )}

        {activeTab === "display" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Tuned using screen-viewing optics: zero pure-black halation glare, tabular numbers,
              and circadian-friendly palettes so anyone can check their goals comfortably morning
              or night.
            </p>
            {VISUAL_THEMES.map((t) => {
              const Icon = THEME_ICONS[t.id] || Eye;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTheme && onSelectTheme(t.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? "bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/30"
                      : "nv-surface-subtle hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {t.description}
                      </p>
                      <p className="text-[11px] font-mono text-cyan-300 mt-1">
                        Best for: {t.bestFor}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center shrink-0">
                      <Check size={14} className="mr-1" /> ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "knowledge" && <KnowledgeBaseImporter />}
      </motion.div>
    </motion.div>
  );
}
