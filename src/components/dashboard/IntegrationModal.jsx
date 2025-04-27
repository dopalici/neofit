import { motion } from "framer-motion";
import React from "react";

export default function IntegrationModal({
  isOpen,
  onClose,
  connectedApps,
  onToggleConnection,
}) {
  if (!isOpen) return null;

  const apps = [
    {
      id: "apple-health",
      name: "Apple Health",
      icon: "🍎",
      description: "Sync your health and fitness data from Apple Health",
      color: "bg-red-500/10 border-red-500/20",
    },
    {
      id: "myfitnesspal",
      name: "MyFitnessPal",
      icon: "🥗",
      description: "Import your nutrition and calorie tracking data",
      color: "bg-green-500/10 border-green-500/20",
    },
    {
      id: "strava",
      name: "Strava",
      icon: "🏃",
      description: "Connect your workout and activity data",
      color: "bg-orange-500/10 border-orange-500/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 border border-cyan-500/20 rounded-lg p-6 max-w-lg w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-mono text-cyan-400">
            System Integration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`p-4 rounded-lg border ${app.color} transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <h3 className="font-mono text-cyan-400">{app.name}</h3>
                    <p className="text-sm text-gray-400">{app.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleConnection(app.id)}
                  className={`px-4 py-2 rounded font-mono text-sm transition-all duration-300 ${
                    connectedApps[app.id]
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-gray-800/50 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400"
                  }`}
                >
                  {connectedApps[app.id] ? "Connected" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-cyan-500/10">
          <p className="text-sm text-gray-400 text-center">
            Connected services will automatically sync with your NeoFit
            dashboard
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
