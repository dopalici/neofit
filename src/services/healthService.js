// This service would integrate with Apple Health via HealthKit
import { getFromStorage } from '../utils/storageUtils';
import { STORAGE_KEYS } from '../services/dataImportService';
// Mock data for development
const mockHealthData = {
  heartRate: { current: 62, min: 58, max: 118, avg: 72, lastUpdated: '07:42:15' },
  steps: { today: 6834, goal: 10000, lastUpdated: '07:42:15' },
  sleep: { lastNight: '6h 48m', deepSleep: '1h 32m', rem: '2h 15m', efficiency: 87 },
  vo2Max: { current: 48.3, previous: 47.8, lastUpdated: '2 days ago' },
  calories: { burned: 1432, goal: 2800, lastUpdated: '07:42:15' },
  weight: { current: 78.3, previous: 78.7, lastUpdated: '06:21:33' }
};

// or HealthKit JS Bridge in a hybrid app context

export const fetchHealthData = async () => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Try to get real data from storage first
      const heartRate = getFromStorage(STORAGE_KEYS.HEART_RATE_DATA, []);
      const steps = getFromStorage(STORAGE_KEYS.STEP_COUNT_DATA, []);
      const weight = getFromStorage(STORAGE_KEYS.WEIGHT_DATA, []);
      const sleep = getFromStorage(STORAGE_KEYS.SLEEP_DATA, []);
      const vo2Max = getFromStorage(STORAGE_KEYS.VO2MAX_DATA, []);
      const workouts = getFromStorage(STORAGE_KEYS.WORKOUT_DATA, []);
      const nutrition = getFromStorage(STORAGE_KEYS.NUTRITION_DATA, []);
      
      // Check if we have real data
      const hasRealData = heartRate.length > 0 || steps.length > 0 || 
                           weight.length > 0 || sleep.length > 0 ||
                           vo2Max.length > 0 || workouts.length > 0 ||
                           nutrition.length > 0;
      
      if (hasRealData) {
        // Process the real data into the format expected by components
        const processedData = processRealHealthData(heartRate, steps, weight, sleep, vo2Max, workouts, nutrition);
        resolve(processedData);
      } else {
        // Fall back to mock data if no real data is available
        resolve(mockHealthData);
      }
    }, 300); // Reduced delay for better UX
  });
};

// New function to process real health data
function processRealHealthData(heartRate, steps, weight, sleep, vo2Max, workouts, nutrition = []) {
  // Get the most recent data for each type
  const getLatest = (arr) => arr.length > 0 ? 
    arr.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
  
  const latestHeartRate = getLatest(heartRate);
  const latestSteps = getLatest(steps);
  const latestWeight = getLatest(weight);
  const latestSleep = getLatest(sleep);
  const latestVo2Max = getLatest(vo2Max);
  
  // Get the previous weight measurement if available (for trend calculation)
  let previousWeight = null;
  if (weight.length > 1) {
    const sortedWeight = [...weight].sort((a, b) => new Date(b.date) - new Date(a.date));
    previousWeight = sortedWeight[1];
  }
  
  // Process workout data to get recent workout statistics
  const recentWorkouts = workouts.length > 0 ? 
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10) : [];
  
  const workoutStats = {
    count: workouts.length,
    recentTypes: [...new Set(recentWorkouts.map(w => w.type))].slice(0, 5),
    totalCalories: recentWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
    averageDuration: recentWorkouts.length > 0 ?
      recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length : 0
  };
  
  // Format the data to match what the components expect
  return {
    heartRate: {
      current: latestHeartRate ? latestHeartRate.value : 62,
      min: Math.min(...heartRate.map(item => item.value), 58),
      max: Math.max(...heartRate.map(item => item.value), 118),
      avg: heartRate.length > 0 ? 
        (heartRate.reduce((sum, item) => sum + item.value, 0) / heartRate.length).toFixed(1) : 72,
      lastUpdated: latestHeartRate ? formatTime(new Date(latestHeartRate.date)) : '07:42:15',
      data: heartRate // Include the full dataset for charts
    },
    steps: {
      today: latestSteps ? latestSteps.value : 6834,
      goal: 10000,
      lastUpdated: latestSteps ? formatTime(new Date(latestSteps.date)) : '07:42:15',
      data: steps
    },
    sleep: {
      lastNight: latestSleep ? `${latestSleep.value}h` : '6h 48m',
      deepSleep: '1h 32m', // You might need more processing for these specialized values
      rem: '2h 15m',
      efficiency: 87,
      data: sleep
    },
    vo2Max: {
      current: latestVo2Max ? latestVo2Max.value : 48.3,
      previous: 47.8,
      lastUpdated: latestVo2Max ? formatDate(new Date(latestVo2Max.date)) : '2 days ago',
      data: vo2Max
    },
    weight: {
      current: latestWeight ? latestWeight.value : 78.3,
      previous: previousWeight ? previousWeight.value : 78.7,
      trend: previousWeight && latestWeight ? 
        (latestWeight.value - previousWeight.value).toFixed(1) : -0.4,
      lastUpdated: latestWeight ? formatTime(new Date(latestWeight.date)) : '06:21:33',
      data: weight
    },
    workouts: {
      recent: recentWorkouts,
      stats: workoutStats,
      data: workouts
    },
    // Process nutrition data if available
    nutrition: {
      data: nutrition,
      recent: nutrition.length > 0 ? 
        nutrition.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10) : [],
      stats: {
        count: nutrition.length,
        avgCalories: nutrition.length > 0 ? 
          (nutrition.reduce((sum, item) => sum + (item.calories || 0), 0) / nutrition.length).toFixed(0) : 0,
        avgProtein: nutrition.length > 0 ? 
          (nutrition.reduce((sum, item) => sum + (item.protein || 0), 0) / nutrition.length).toFixed(1) : 0,
        avgCarbs: nutrition.length > 0 ? 
          (nutrition.reduce((sum, item) => sum + (item.carbs || 0), 0) / nutrition.length).toFixed(1) : 0,
        avgFat: nutrition.length > 0 ? 
          (nutrition.reduce((sum, item) => sum + (item.fat || 0), 0) / nutrition.length).toFixed(1) : 0
      }
    }
  };
}

// Helper functions for date formatting
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}