// src/components/dashboard/EnhancedNutritionPanel.jsx
import React, { useState, useEffect } from 'react';
import { RotateCw, PieChart, Calendar, TrendingUp, Plus, ChevronRight } from 'lucide-react';

export default function EnhancedNutritionPanel({ nutritionData, onSyncNutrition, isSyncing, onAddMeal }) {
  const [localData, setLocalData] = useState({
    calories: { consumed: 0, goal: 2200, lastUpdated: '' },
    protein: { consumed: 0, goal: 140, lastUpdated: '' },
    carbs: { consumed: 0, goal: 220, lastUpdated: '' },
    fat: { consumed: 0, goal: 73, lastUpdated: '' },
    water: { consumed: 0, goal: 3, lastUpdated: '' },
    meals: []
  });
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
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

  // Handle input change for new meal form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle meal submission
  const handleSubmitMeal = (e) => {
    e.preventDefault();
    
    // Create meal object and validate
    const mealToAdd = {
      name: newMeal.name.trim() || 'MEAL',
      calories: parseInt(newMeal.calories) || 0,
      protein: parseInt(newMeal.protein) || 0,
      carbs: parseInt(newMeal.carbs) || 0,
      fat: parseInt(newMeal.fat) || 0
    };
    
    // Only add if calories or macronutrients are specified
    if (mealToAdd.calories > 0 || mealToAdd.protein > 0 || mealToAdd.carbs > 0 || mealToAdd.fat > 0) {
      onAddMeal(mealToAdd);
      
      // Reset form and close
      setNewMeal({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      });
      setShowAddMeal(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">CELLULAR FUEL</h2>
          <div className="flex items-center">
            <span className="text-xs text-cyan-600 font-mono mr-2">APPLE HEALTH</span>
            <div className="h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center" title="Apple Health Connected">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
            <button 
              onClick={onSyncNutrition}
              className="ml-2 text-cyan-500 hover:text-cyan-300 text-xs"
              title="Sync with Apple Health">
              <RotateCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Calorie donut chart with intake overview */}
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gray-950 border border-cyan-900 rounded-full flex items-center justify-center mr-4 relative">
              <span className="text-cyan-400 font-bold font-mono">{caloriePercentage}%</span>
              {/* SVG Circle Progress */}
              <svg className="absolute inset-0" width="80" height="80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#1e3a45" strokeWidth="4" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="36" 
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth="4" 
                  strokeDasharray="226.2" 
                  strokeDashoffset={226.2 - ((caloriePercentage / 100) * 226.2)} 
                  transform="rotate(-90 40 40)" 
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
                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${calculatePercentage(localData?.calories?.consumed, localData?.calories?.goal)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">PROTEIN</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {localData?.protein?.consumed || 0}g<span className="text-cyan-600">/{localData?.protein?.goal || 0}g</span>
                </p>
                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500" 
                    style={{ width: `${calculatePercentage(localData?.protein?.consumed, localData?.protein?.goal)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-xs text-cyan-600 font-mono">HYDRATION</p>
                <p className="font-medium text-cyan-300 font-mono">
                  {localData?.water?.consumed || 0}L<span className="text-cyan-600">/{localData?.water?.goal || 0}L</span>
                </p>
                <div className="h-1 w-full bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-blue-400" 
                    style={{ width: `${calculatePercentage(localData?.water?.consumed, localData?.water?.goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Advanced macronutrient distribution */}
            <div className="mt-4">
              <div className="text-xs text-cyan-600 font-mono mb-2 flex justify-between">
                <span>MACRONUTRIENT DISTRIBUTION</span>
                <div className="flex items-center">
                  <PieChart size={12} className="text-cyan-500 mr-1" />
                </div>
              </div>
              <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-cyan-500 flex items-center justify-center" style={{ width: `${macroPercentages.protein}%` }}>
                  <span className="text-[8px] text-white font-mono px-1">{macroPercentages.protein}%</span>
                </div>
                <div className="h-full bg-green-500 flex items-center justify-center" style={{ width: `${macroPercentages.carbs}%` }}>
                  <span className="text-[8px] text-white font-mono px-1">{macroPercentages.carbs}%</span>
                </div>
                <div className="h-full bg-yellow-500 flex items-center justify-center" style={{ width: `${macroPercentages.fat}%` }}>
                  <span className="text-[8px] text-white font-mono px-1">{macroPercentages.fat}%</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-cyan-600 font-mono mt-1">
                <span>PROTEIN: {localData?.protein?.consumed || 0}g</span>
                <span>CARBS: {localData?.carbs?.consumed || 0}g</span>
                <span>FAT: {localData?.fat?.consumed || 0}g</span>
              </div>
              <div className="text-xs font-mono text-center mt-2">
                <div className={`inline-block px-2 py-1 rounded ${
                  macroPercentages.protein >= 30 ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'
                }`}>
                  {macroPercentages.protein >= 30 ? 'OPTIMAL PROTEIN RATIO' : 'INCREASE PROTEIN INTAKE'}
                </div>
              </div>
            </div>
          </div>

          {/* Today's log with Apple Health integration */}
          <div className="border-t border-cyan-900 pt-3">
            <div className="text-xs text-cyan-600 font-mono mb-2 flex justify-between items-center">
              <span>NUTRITION LOG</span>
              <div className="flex items-center">
                <button 
                  onClick={() => setShowAddMeal(prev => !prev)}
                  className="text-cyan-500 hover:text-cyan-300 flex items-center"
                >
                  {showAddMeal ? 'CANCEL' : 'ADD MEAL'}
                  {!showAddMeal && <Plus size={12} className="ml-1" />}
                </button>
              </div>
            </div>
            
            {/* Add meal form */}
            {showAddMeal && (
              <form onSubmit={handleSubmitMeal} className="mb-3 bg-gray-950 p-3 rounded border border-cyan-900/50">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-cyan-600 font-mono block mb-1">MEAL NAME</label>
                    <input 
                      type="text" 
                      name="name"
                      value={newMeal.name}
                      onChange={handleInputChange}
                      placeholder="Enter meal name"
                      className="w-full bg-gray-900 text-cyan-300 border border-cyan-800 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-600 font-mono block mb-1">CALORIES (KCAL)</label>
                    <input 
                      type="number" 
                      name="calories"
                      value={newMeal.calories}
                      onChange={handleInputChange}
                      placeholder="Enter calories"
                      className="w-full bg-gray-900 text-cyan-300 border border-cyan-800 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-cyan-600 font-mono block mb-1">PROTEIN (G)</label>
                    <input 
                      type="number" 
                      name="protein"
                      value={newMeal.protein}
                      onChange={handleInputChange}
                      placeholder="Protein"
                      className="w-full bg-gray-900 text-cyan-300 border border-cyan-800 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-600 font-mono block mb-1">CARBS (G)</label>
                    <input 
                      type="number" 
                      name="carbs"
                      value={newMeal.carbs}
                      onChange={handleInputChange}
                      placeholder="Carbs"
                      className="w-full bg-gray-900 text-cyan-300 border border-cyan-800 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-cyan-600 font-mono block mb-1">FAT (G)</label>
                    <input 
                      type="number" 
                      name="fat"
                      value={newMeal.fat}
                      onChange={handleInputChange}
                      placeholder="Fat"
                      className="w-full bg-gray-900 text-cyan-300 border border-cyan-800 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-cyan-900/50 hover:bg-cyan-900/80 text-cyan-400 font-mono text-xs py-2 rounded border border-cyan-800"
                >
                  LOG MEAL
                </button>
              </form>
            )}
            
            {/* Meal log */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(localData?.meals && localData.meals.length > 0) ? (
                localData.meals.map((meal, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-gray-950 p-2 rounded border border-cyan-900/50">
                    <div className="font-mono text-cyan-400 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
                      {meal.name} ({meal.time})
                    </div>
                    <div className="font-mono text-cyan-600">
                      <span className="text-cyan-400">{meal.calories}</span> kcal · 
                      <span className="text-cyan-500"> {meal.protein}g</span> protein
                      <ChevronRight size={12} className="inline ml-1 text-cyan-700" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-xs text-cyan-600 font-mono bg-gray-950 rounded p-3">
                  NO MEALS RECORDED TODAY
                </div>
              )}
            </div>
            
            {/* Nutrition insights */}
            <div className="mt-3 bg-gray-950 p-3 rounded border border-cyan-900/50">
              <div className="text-xs text-cyan-500 font-mono font-bold mb-2">NUTRITION INSIGHTS</div>
              <p className="text-xs text-cyan-600 font-mono">
                {macroPercentages.protein < 20 ? 
                  "PROTEIN INTAKE BELOW OPTIMAL LEVELS FOR RECOVERY" : 
                  macroPercentages.protein > 35 ? 
                  "PROTEIN RATIO EXCEEDS RECOMMENDED RANGE" :
                  "PROTEIN BALANCE OPTIMAL FOR MUSCLE RECOVERY"
                }
              </p>
              <p className="text-xs text-cyan-600 font-mono mt-1">
                {remainingCalories > 1000 ? 
                  "CALORIC DEFICIT MAY IMPACT PERFORMANCE" : 
                  remainingCalories < 200 ? 
                  "APPROACHING DAILY CALORIC TARGET" :
                  "MAINTAIN CURRENT INTAKE PATTERN FOR GOAL PROGRESS"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}