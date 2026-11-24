import { useState, useEffect, useCallback } from 'react';
import { useAppleHealth } from './useAppleHealth';
import { useNutritionData } from './useNutritionData';
import { useHabitSystem } from './useHabitData';
import { processEnhancementMetrics, processUserGoals } from '../services/healthDataProcessor';

const INTEGRATED_HEALTH_DATA_TYPES = [
  'heartRate',
  'steps',
  'sleep',
  'calories',
  'vo2max',
  'restingHeartRate',
  'heartRateVariability',
  'oxygenSaturation'
];

/**
 * Integrated hook that combines health data, nutrition data, habits and goals
 * @param {Object} initialGoals - Initial user goals
 * @returns {Object} - Integrated health data and functions
 */
export function useIntegratedHealth(initialGoals = {}) {
  // Use the Apple Health hook for health data
  const {
    healthData,
    sleepAnalysis,
    isAvailable: isHealthAvailable,
    hasPermission: isHealthAuthorized,
    isLoading: isHealthLoading,
    refreshData: refreshHealthData
  } = useAppleHealth(INTEGRATED_HEALTH_DATA_TYPES, 'week');
  
  // Use the nutrition data hook for Apple Health nutrition data
  const {
    nutritionData,
    isLoading: isNutritionLoading,
    logMeal: addMealToNutrition,
    refreshData: refreshNutritionData
  } = useNutritionData({ fetchFromHealth: true, period: 'day' });
  
  // Use the habit system hook for habit tracking
  const {
    habitData,
    loading: isHabitLoading,
    actions: habitActions
  } = useHabitSystem();
  
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

  const performCheckIn = useCallback(
    (type = 'daily') => habitActions.checkIn(type),
    [habitActions]
  );
  
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
    return habitActions.manageChallenge(
      `goal-${goalId}-${Date.now()}`,
      'start',
      userGoals[goalId].type || 'goal'
    );
  }, [userGoals, habitActions]);
  
  // Complete a goal challenge
  const completeGoalChallenge = useCallback((challengeId, goalId) => {
    try {
      // Complete the challenge in habit system
      const result = habitActions.manageChallenge(challengeId, 'complete');
      
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
  }, [userGoals, habitActions]);
  
  return {
    // Data
    healthData,
    sleepAnalysis,
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
    performCheckIn,
    performCheckInWithGoals,
    startGoalChallenge,
    completeGoalChallenge
  };
}