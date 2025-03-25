import React from 'react';

export default function GoalsPanel({ goals }) {
  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">ENHANCEMENT PROTOCOLS</h2>
          <button className="text-cyan-600 text-xs font-mono">INITIATE NEW</button>
        </div>
        <div className="space-y-4">
          {goals.handstandPushup && (
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-cyan-300 font-mono">{goals.handstandPushup.name}</h3>
                  <p className="text-sm text-cyan-600 mt-1 font-mono">PRIMARY ENHANCEMENT · {goals.handstandPushup.type.toUpperCase()}</p>
                </div>
                <span className="bg-gray-800 text-cyan-300 text-xs px-2 py-1 rounded font-mono">
                  {goals.handstandPushup.progress}% COMPLETE
                </span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full relative" style={{ width: `${goals.handstandPushup.progress}%` }}>
                    <div className="absolute right-0 top-0 h-1.5 w-1 bg-cyan-300"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-xs text-cyan-600 font-mono">INITIATED: {goals.handstandPushup.startDate}</div>
                <div className="text-xs text-cyan-600 font-mono">EST. COMPLETION: {goals.handstandPushup.targetDate}</div>
              </div>
            </div>
          )}
          
          {goals.fourMinuteMile && (
            <div className="bg-gray-950 border border-cyan-900 p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-cyan-300 font-mono">{goals.fourMinuteMile.name}</h3>
                  <p className="text-sm text-cyan-600 mt-1 font-mono">SECONDARY ENHANCEMENT · {goals.fourMinuteMile.type.toUpperCase()}</p>
                </div>
                <span className="bg-gray-800 text-cyan-300 text-xs px-2 py-1 rounded font-mono">
                  {goals.fourMinuteMile.progress}% COMPLETE
                </span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full relative" style={{ width: `${goals.fourMinuteMile.progress}%` }}>
                    <div className="absolute right-0 top-0 h-1.5 w-1 bg-cyan-300"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-xs text-cyan-600 font-mono">INITIATED: {goals.fourMinuteMile.startDate}</div>
                <div className="text-xs text-cyan-600 font-mono">EST. COMPLETION: {goals.fourMinuteMile.targetDate}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}