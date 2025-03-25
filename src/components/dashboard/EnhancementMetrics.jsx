import React from 'react';
import { Heart, Zap, Shield, Droplet } from 'lucide-react';

export default function EnhancementMetrics({ healthData }) {
  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">ENHANCEMENT METRICS</h2>
          <button className="text-cyan-600 text-xs font-mono">TEMPORAL ANALYSIS</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Heart size={16} className="text-red-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">CARDIAC EFFICIENCY</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">{healthData?.heartRate?.current || '62'} bpm</p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div className="h-1 w-12 bg-cyan-500 rounded-full"></div>
              </div>
              <p className="text-xs text-cyan-600 ml-2 font-mono">OPTIMAL</p>
            </div>
          </div>
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Zap size={16} className="text-yellow-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">OXYGEN UTILIZATION</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">{healthData?.vo2Max?.current || '48.3'}</p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div className="h-1 w-14 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-xs text-green-500 ml-2 font-mono">SUPERIOR</p>
            </div>
          </div>
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Shield size={16} className="text-blue-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">FORCE OUTPUT</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">78<span className="text-xs">/100</span></p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div className="h-1 w-10 bg-yellow-500 rounded-full"></div>
              </div>
              <p className="text-xs text-yellow-500 ml-2 font-mono">ADVANCED</p>
            </div>
          </div>
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center mb-1">
              <Droplet size={16} className="text-blue-500 mr-1" />
              <p className="text-xs text-cyan-600 font-mono">ENDURANCE MATRIX</p>
            </div>
            <p className="text-xl font-bold text-cyan-300 font-mono">82<span className="text-xs">/100</span></p>
            <div className="flex items-center justify-between mt-1">
              <div className="h-1 w-16 bg-gray-800 rounded-full">
                <div className="h-1 w-13 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-xs text-green-500 ml-2 font-mono">SUPERIOR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}