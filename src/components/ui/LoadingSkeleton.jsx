// src/components/ui/LoadingSkeleton.jsx
import React from "react";
import { WifiOff } from "lucide-react";

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 animate-pulse space-y-6">
      <div className="h-8 w-64 bg-gray-800 rounded"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="h-96 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
          <div className="h-32 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="h-44 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
          <div className="h-48 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
            <div className="h-64 bg-gray-900 border border-cyan-900/60 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="bg-yellow-950/80 border-b border-yellow-700 px-6 py-2 text-center text-xs font-mono text-yellow-300 flex items-center justify-center"
    >
      <WifiOff size={13} className="mr-2" />
      OFFLINE MODE — LOCAL DATA, WORKOUT LOGGER & KNOWLEDGE BASE REMAIN AVAILABLE
    </div>
  );
}
