import React from 'react';
import { RotateCw } from 'lucide-react';

export default function NutritionPanel({ nutritionData, onSyncNutrition, isSyncing }) {
  // Calculate percentage
  const caloriePercentage = Math.round((nutritionData?.calories?.consumed / nutritionData?.calories?.goal) * 100);
  
  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">CELLULAR FUEL</h2>
          <div className="flex items-center">
            <span className="text-xs text-cyan-600 font-mono mr-2">MYFITNESSPAL</span>
            <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center" title="MyFitnessPal Connected">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
            <button 
              onClick={onSyncNutrition}
              className="ml-2 text-cyan-500 hover:text-cyan-300 text-xs"
              title="Sync with MyFitnessPal">
              <RotateCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-950 border border-cyan-900 rounded-full flex items-center justify-center mr-4 relative">
              <span className="text-cyan-400 font-bold font-mono">{caloriePercentage}%</span>
              <svg className="absolute inset-0" width="64" height="64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#1e3a45" strokeWidth="3" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth="3" 
                  strokeDasharray="175.9" 
                  strokeDashoffset={175.9 - ((caloriePercentage / 100) * 175.9)} 
                  transform="rotate(-90 32 32)" 
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-cyan-300 font-mono">OPTIMAL BIOFUEL RATIO</p>
              <p className="text-xs text-cyan-600 font-mono">
                LAST UPDATED: {nutritionData?.calories?.lastUpdated || '07:21:05'}
              </p>
            </div>
          </div>
          <div className="border-t border-cyan-900 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-cyan-600 font-mono">ENERGY</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {nutritionData?.calories?.consumed || 1842}<span className="text-cyan-600">/{nutritionData?.calories?.goal || 2200}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">PROTEIN</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {nutritionData?.protein?.consumed || 126}g<span className="text-cyan-600">/{nutritionData?.protein?.goal || 140}g</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">HYDRATION</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {nutritionData?.water?.consumed || 2.1}L<span className="text-cyan-600">/{nutritionData?.water?.goal || 3}L</span>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-cyan-900 pt-3">
            <div className="text-xs text-cyan-600 font-mono mb-2">TODAY'S NUTRITION LOG</div>
            <div className="space-y-2">
              {(nutritionData?.meals || [
                { name: 'BREAKFAST', time: '06:15', calories: 420, protein: 32 },
                { name: 'SNACK', time: '09:30', calories: 180, protein: 15 }
              ]).map((meal, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="font-mono text-cyan-400">{meal.name} ({meal.time})</div>
                  <div className="font-mono text-cyan-600">{meal.calories} kcal · {meal.protein}g protein</div>
                </div>
              ))}
              <button className="text-xs text-cyan-500 font-mono hover:text-cyan-400 mt-1">
                + ADD MEAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}