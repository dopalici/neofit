import React from 'react';
import VitruvianModelViewer from '../3d/VitruvianModel';

export default function BiometricPanel({ userData, healthData }) {
  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">BIOMETRIC IMPRINT</h2>
          <div className="flex items-center">
            <span className="text-xs text-cyan-600 font-mono mr-2">APPLE HEALTH</span>
            <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center" title="Apple Health Connected">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
        
        <div className="relative bg-gray-950 rounded h-80 flex items-center justify-center mb-4 border border-cyan-900 overflow-hidden">
          <VitruvianModelViewer userData={userData} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <p className="text-xs text-cyan-600 font-mono mb-1">WEIGHT STATUS</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-cyan-300 font-mono">{healthData?.weight?.current || '78.3'} kg</p>
              <div className="text-xs text-green-500 font-mono flex items-center">
                <span className="mr-1">-0.4kg</span>
              </div>
            </div>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              LAST MEASURED: {healthData?.weight?.lastUpdated || 'TODAY 06:21'}
            </p>
          </div>
          <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
            <p className="text-xs text-cyan-600 font-mono mb-1">MUSCULAR DENSITY</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-cyan-300 font-mono">42.8%</p>
              <div className="text-xs text-green-500 font-mono flex items-center">
                <span className="mr-1">+0.8%</span>
              </div>
            </div>
            <p className="text-xs text-cyan-600 font-mono mt-1">
              TRENDING POSITIVE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}