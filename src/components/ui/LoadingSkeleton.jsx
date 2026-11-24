// src/components/ui/LoadingSkeleton.jsx
import React from "react";
import { WifiOff } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-pulse space-y-6">
      <div className="h-8 w-64 bg-slate-800/70 rounded-lg" />
      <div className="h-32 system-window rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-72 system-window rounded-2xl" />
        <div className="lg:col-span-7 h-72 system-window rounded-2xl" />
      </div>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="bg-amber-950/75 border-b border-amber-500/40 px-6 py-2 text-center text-xs font-mono text-amber-200 flex items-center justify-center relative z-40"
    >
      <WifiOff size={13} className="mr-2" />
      Offline Mode — Local telemetry, workout logger, and 576 FitLib guides stay available.
    </div>
  );
}
