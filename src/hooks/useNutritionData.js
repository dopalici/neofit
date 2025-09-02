import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, getFromStorage } from '../utils/storageUtils';
import { STORAGE_KEYS } from '../services/dataImportService';
import { useAppleHealth } from './useAppleHealth';
import { processNutritionData } from '../services/healthDataProcessor';

/**
 * Hook to fetch and manage nutrition data
 * @param {Object} options - Options for data fetching
 * @param {boolean} options.fetchFromHealth - Whether to fetch from Apple Health
 * @param {string} options.period - Time period for data (day, week, month)
 * @returns {Object} Nutrition data and functions
 */
export function useNutritionData(options = {}) {
  const {
    fetchFromHealth = true,
    period = 'day',
  } = options;

  // Define the nutrition data types to fetch from Apple Health
  const nutritionDataTypes = [
    'dietaryEnergy',
    'dietaryProtein',
    'dietaryCarbs',
    'dietaryFat',
    'dietaryWater',
    'dietaryFiber',
    'dietarySugar',
  ];

  // State for nutrition data
  const [nutritionData, setNutritionData] = useState(() => {
    return getFromStorage(STORAGE_KEYS.NUTRITION_DATA, {
      calories: { consumed: 0, goal: 2200 },
      protein: { consumed: 0, goal: 120 },
      carbs: { consumed: 0, goal: 200 },
      fat: { consumed: 0, goal: 70 },
      water: { consumed: 0, goal: 2500 },
      fiber: { consumed: 0, goal: 25 },
      sugar: { consumed: 0, goal: 50 },
      meals: []
    });
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Use Apple Health hook to fetch all nutrition data types
  const { 
    data: healthData,
    isAvailable: isHealthAvailable, 
    isAuthorized: isHealthAuthorized,
    refreshData: refreshHealthData
  } = useAppleHealth(nutritionDataTypes, period, { 
    observe: true,
    autoRefresh: false
  });

  // Process data from Apple Health and update nutrition state
  useEffect(() => {
    if (fetchFromHealth && healthData && Object.keys(healthData).length > 0) {
      try {
        setIsLoading(true);
        
        // Process the raw health data
        const processedData = processNutritionData(healthData);
        
        // Merge with existing data for goals and other metadata
        const newData = {
          ...nutritionData,
          calories: { 
            consumed: processedData.calories || 0, 
            goal: nutritionData.calories.goal 
          },
          protein: { 
            consumed: processedData.protein || 0, 
            goal: nutritionData.protein.goal 
          },
          carbs: { 
            consumed: processedData.carbs || 0, 
            goal: nutritionData.carbs.goal 
          },
          fat: { 
            consumed: processedData.fat || 0, 
            goal: nutritionData.fat.goal 
          },
          water: { 
            consumed: processedData.water || 0, 
            goal: nutritionData.water.goal 
          },
          fiber: { 
            consumed: processedData.fiber || 0, 
            goal: nutritionData.fiber.goal 
          },
          sugar: { 
            consumed: processedData.sugar || 0, 
            goal: nutritionData.sugar.goal 
          },
          meals: processedData.meals || nutritionData.meals
        };
        
        setNutritionData(newData);
        saveToStorage(STORAGE_KEYS.NUTRITION_DATA, newData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error processing nutrition data from health:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [healthData, fetchFromHealth, nutritionData.calories.goal, nutritionData.protein.goal, 
      nutritionData.carbs.goal, nutritionData.fat.goal, nutritionData.water.goal,
      nutritionData.fiber.goal, nutritionData.sugar.goal]);

  // Function to update nutrition data manually
  const updateNutritionData = useCallback((data) => {
    setNutritionData(prevData => {
      const newData = { ...prevData, ...data };
      saveToStorage(STORAGE_KEYS.NUTRITION_DATA, newData);
      return newData;
    });
    setLastUpdated(new Date());
  }, []);

  // Function to log a meal manually
  const logMeal = useCallback((meal) => {
    setNutritionData(prevData => {
      // Default structure for a new meal
      const newMeal = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        name: meal.name || 'Meal',
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        ...meal
      };
      
      // Add the meal and update totals
      const newMeals = [...prevData.meals, newMeal];
      
      // Recalculate consumed amounts
      const calories = newMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const protein = newMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
      const carbs = newMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
      const fat = newMeals.reduce((sum, m) => sum + (m.fat || 0), 0);
      
      const newData = {
        ...prevData,
        meals: newMeals,
        calories: { ...prevData.calories, consumed: calories },
        protein: { ...prevData.protein, consumed: protein },
        carbs: { ...prevData.carbs, consumed: carbs },
        fat: { ...prevData.fat, consumed: fat }
      };
      
      saveToStorage(STORAGE_KEYS.NUTRITION_DATA, newData);
      return newData;
    });
    setLastUpdated(new Date());
  }, []);

  // Function to update nutrition goals
  const updateNutritionGoals = useCallback((goals) => {
    setNutritionData(prevData => {
      const newData = {
        ...prevData,
        calories: { ...prevData.calories, goal: goals.calories || prevData.calories.goal },
        protein: { ...prevData.protein, goal: goals.protein || prevData.protein.goal },
        carbs: { ...prevData.carbs, goal: goals.carbs || prevData.carbs.goal },
        fat: { ...prevData.fat, goal: goals.fat || prevData.fat.goal },
        water: { ...prevData.water, goal: goals.water || prevData.water.goal },
        fiber: { ...prevData.fiber, goal: goals.fiber || prevData.fiber.goal },
        sugar: { ...prevData.sugar, goal: goals.sugar || prevData.sugar.goal }
      };
      
      saveToStorage(STORAGE_KEYS.NUTRITION_DATA, newData);
      return newData;
    });
    setLastUpdated(new Date());
  }, []);

  // Function to refresh data from health
  const refreshData = useCallback(() => {
    if (fetchFromHealth && isHealthAvailable && isHealthAuthorized) {
      return refreshHealthData();
    }
    return Promise.resolve();
  }, [fetchFromHealth, isHealthAvailable, isHealthAuthorized, refreshHealthData]);

  return {
    nutritionData,
    isLoading,
    error,
    lastUpdated,
    isHealthAvailable,
    isHealthAuthorized,
    updateNutritionData,
    logMeal,
    updateNutritionGoals,
    refreshData
  };
}