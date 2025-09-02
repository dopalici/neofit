import { useState, useEffect, useCallback } from 'react';
import { useAppleHealth } from './useAppleHealth';
import { useNutritionData } from './useNutritionData';
import { useHabitData } from './useHabitData';
import { getFromStorage } from '../utils/storageUtils';
import { processEnhancementMetrics, processUserGoals } from '../services/healthDataProcessor';
import { STORAGE_KEYS } from '../services/dataImportService';

/**
 * Integrated hook that combines health data, nutrition data, habits and goals
 * @param {Object} initialGoals - Initial user goals
 * @returns {Object} - Integrated health data and functions
 */
export function useIntegratedHealth(initialGoals = {}) {
  // Use the Apple Health hook for health data
  const {
    data: healthData,
    isAvailable: isHealthAvailable,
    isAuthorized: isHealthAuthorized,
    isLoading: isHealthLoading,
    refreshData: refreshHealthData
  } = useAppleHealth([
    'heartRate',
    'steps',
    'sleep',
    'calories',
    'vo2max',
    'restingHeartRate',
    'heartRateVariability',
    'oxygenSaturation'
  ], 'week', { observe: true });
  
  // Use the nutrition data hook for Apple Health nutrition data
  const {
    nutritionData,
    isLoading: isNutritionLoading,
    isHealthAvailable: isNutritionHealthAvailable,
    isHealthAuthorized: isNutritionHealthAuthorized,
    updateNutritionData,
    logMeal: addMealToNutrition,
    refreshData: refreshNutritionData
  } = useNutritionData({ fetchFromHealth: true, period: 'day' });
  
  // Use the habit data hook for habit tracking
  const {
    habitData,
    isLoading: isHabitLoading,
    updateStreak,
    completeHabit,
    performCheckIn,
    startChallenge,
    completeChallenge
  } = useHabitData();
  
  // Local state for enhancement metrics and goals
  const [enhancementMetrics, setEnhancementMetrics] = useState(null);
  const [userGoals, setUserGoals] = useState(initialGoals);
  
  // Combined loading state
  const isLoading = isHealthLoading || isHabitLoading || isNutritionLoading;
  
  // Process health data to create enhancement metrics whenever health data changes
  useEffect(() => {
    if (healthData) {
      const metrics = processEnhancementMetrics(healthData);
      setEnhancementMetrics(metrics);
      
      // Update goals based on health and habit data
      const updatedGoals = processUserGoals(initialGoals, habitData);
      setUserGoals(updatedGoals);
    }
  }, [healthData, habitData, initialGoals]);
  
  // Log a meal - pass through to the nutrition hook
  const addMeal = useCallback((meal) => {
    return addMealToNutrition(meal);
  }, [addMealToNutrition]);
  
  // Sync nutrition data with health data
  const syncNutrition = useCallback(async () => {
    return refreshNutritionData();
  }, [refreshNutritionData]);
  
  // Perform daily check-in with goal updates
  const performCheckInWithGoals = useCallback(async () => {
    try {
      const checkInResult = await performCheckIn();
      
      if (checkInResult.success) {
        // Update goals based on check-in
        const updatedGoals = { ...userGoals };
        
        // Apply small progress boost for consistency
        Object.keys(updatedGoals).forEach(goalKey => {
          // Only boost if not complete
          if (updatedGoals[goalKey].progress < 100) {
            updatedGoals[goalKey].progress = Math.min(
              100, 
              updatedGoals[goalKey].progress + 1.5
            );
          }
        });
        
        setUserGoals(updatedGoals);
        
        return {
          ...checkInResult,
          updatedGoals
        };
      }
      
      return checkInResult;
    } catch (error) {
      console.error('Error in check-in with goals:', error);
      throw error;
    }
  }, [performCheckIn, userGoals]);
  
  // Start a goal challenge
  const startGoalChallenge = useCallback((goalId) => {
    // Only proceed if the goal exists
    if (!userGoals[goalId]) return null;
    
    // Start a habit challenge linked to this goal
    const result = startChallenge({
      id: `goal-${goalId}-${Date.now()}`,
      name: userGoals[goalId].name,
      type: 'goal',
      targetDays: 7,
      linkedGoal: goalId
    });
    
    return result;
  }, [userGoals, startChallenge]);
  
  // Complete a goal challenge
  const completeGoalChallenge = useCallback((challengeId, goalId) => {
    try {
      // Complete the challenge in habit system
      const result = completeChallenge(challengeId);
      
      if (result.success && goalId && userGoals[goalId]) {
        // Boost goal progress significantly
        const updatedGoals = { ...userGoals };
        
        // Boost progress but cap at 100%
        updatedGoals[goalId].progress = Math.min(
          100, 
          updatedGoals[goalId].progress + 10
        );
        
        setUserGoals(updatedGoals);
        
        return {
          ...result,
          updatedGoals
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error completing goal challenge:', error);
      throw error;
    }
  }, [userGoals, completeChallenge]);
  
  return {
    // Data
    healthData,
    enhancementMetrics,
    nutritionData,
    userGoals,
    habitData,
    isHealthAvailable,
    isHealthAuthorized,
    isLoading,
    
    // Functions
    addMeal,
    syncNutrition,
    refreshHealthData,
    
    // Habit functions
    updateStreak,
    completeHabit,
    performCheckIn,
    performCheckInWithGoals,
    startGoalChallenge,
    completeGoalChallenge
  };
}