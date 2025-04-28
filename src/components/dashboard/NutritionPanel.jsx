// src/components/dashboard/NutritionPanel.jsx
import React, { useState, useEffect } from 'react';
import { RotateCw, PieChart, Calendar, TrendingUp } from 'lucide-react';

export default function NutritionPanel({ nutritionData, onSyncNutrition, isSyncing }) {
  const [localData, setLocalData] = useState({
    calories: { consumed: 0, goal: 2200, lastUpdated: '' },
    protein: { consumed: 0, goal: 140, lastUpdated: '' },
    carbs: { consumed: 0, goal: 220, lastUpdated: '' },
    fat: { consumed: 0, goal: 73, lastUpdated: '' },
    water: { consumed: 0, goal: 3, lastUpdated: '' },
    meals: []
  });

  // Format nutritional data for display when props change
  useEffect(() => {
    if (nutritionData) {
      setLocalData(nutritionData);
    }
  }, [nutritionData]);

  // Calculate percentage for progress bars
  const calculatePercentage = (consumed, goal) => {
    if (!consumed || !goal || isNaN(consumed) || isNaN(goal) || goal === 0) {
      return 0;
    }
    return Math.min(100, Math.round((consumed / goal) * 100));
  };

  // Calculate the overall calorie percentage for the circle display
  const caloriePercentage = calculatePercentage(
    localData.calories?.consumed,
    localData.calories?.goal
  );
  
  // Determine remaining calories
  const remainingCalories = Math.max(
    0,
    (localData.calories?.goal || 0) - (localData.calories?.consumed || 0)
  );
  
  // Calculate macronutrient distribution
  const totalMacros = (localData.protein?.consumed || 0) + 
                      (localData.carbs?.consumed || 0) + 
                      (localData.fat?.consumed || 0);
  
  const macroPercentages = {
    protein: totalMacros ? Math.round((localData.protein?.consumed || 0) / totalMacros * 100) : 0,
    carbs: totalMacros ? Math.round((localData.carbs?.consumed || 0) / totalMacros * 100) : 0,
    fat: totalMacros ? Math.round((localData.fat?.consumed || 0) / totalMacros * 100) : 0
  };
  
  // Format the timestamp if present
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Check if it's already in the right format
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) return timeString;
    
    try {
      // Try to parse as Date if it's a full timestamp
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }
    } catch (e) {
      // If parsing fails, return the original string
      console.error("Error parsing time:", e);
    }
    
    return timeString;
  };

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
          {/* Calorie donut chart with intake overview */}
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-950 border border-cyan-900 rounded-full flex items-center justify-center mr-4 relative">
              <span className="text-cyan-400 font-bold font-mono">{caloriePercentage}%</span>
              {/* SVG Circle Progress */}
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
                LAST UPDATED: {formatTime(localData?.calories?.lastUpdated) || '00:00:00'}
              </p>
              <p className="text-xs text-cyan-600 font-mono mt-1">
                REMAINING: <span className="text-cyan-400">{remainingCalories}</span> KCAL
              </p>
            </div>
          </div>

          {/* Macronutrient data */}
          <div className="border-t border-cyan-900 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-cyan-600 font-mono">ENERGY</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {localData?.calories?.consumed || 0}<span className="text-cyan-600">/{localData?.calories?.goal || 0}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">PROTEIN</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {localData?.protein?.consumed || 0}g<span className="text-cyan-600">/{localData?.protein?.goal || 0}g</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">HYDRATION</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {localData?.water?.consumed || 0}L<span className="text-cyan-600">/{localData?.water?.goal || 0}L</span>
                </p>
              </div>
            </div>
            
            {/* Macronutrient distribution bar chart */}
            <div className="mt-4">
              <div className="text-xs text-cyan-600 font-mono mb-2 flex justify-between">
                <span>MACRONUTRIENT DISTRIBUTION</span>
                <div className="flex items-center">
                  <PieChart size={12} className="text-cyan-500 mr-1" />
                  <span>
                    P: {macroPercentages.protein}% | 
                    C: {macroPercentages.carbs}% | 
                    F: {macroPercentages.fat}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-cyan-500" style={{ width: `${macroPercentages.protein}%` }}></div>
                <div className="h-full bg-green-500" style={{ width: `${macroPercentages.carbs}%` }}></div>
                <div className="h-full bg-yellow-500" style={{ width: `${macroPercentages.fat}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-cyan-600 font-mono mt-1">
                <span>PROTEIN</span>
                <span>CARBS</span>
                <span>FAT</span>
              </div>
            </div>
          </div>

          {/* Today's log */}
          <div className="border-t border-cyan-900 pt-3">
            <div className="text-xs text-cyan-600 font-mono mb-2 flex justify-between">
              <span>TODAY'S NUTRITION LOG</span>
              <div className="flex items-center">
                <Calendar size={12} className="text-cyan-500 mr-1" />
                <span>DAILY TRACKING</span>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(localData?.meals && localData.meals.length > 0) ? (
                localData.meals.map((meal, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-gray-950 p-2 rounded border border-cyan-900/50">
                    <div className="font-mono text-cyan-400">{meal.name} ({meal.time})</div>
                    <div className="font-mono text-cyan-600">{meal.calories} kcal · {meal.protein}g protein</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-xs text-cyan-600 font-mono bg-gray-950 rounded p-3">
                  NO MEALS RECORDED TODAY
                </div>
              )}
              <button className="text-xs text-cyan-500 font-mono hover:text-cyan-400 mt-1 w-full text-center bg-gray-950 p-2 rounded border border-cyan-900/30 flex items-center justify-center">
                <TrendingUp size={12} className="mr-1" /> ADD MEAL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}