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
      
      // Check if we have real data
      const hasRealData = heartRate.length > 0 || steps.length > 0 || 
                           weight.length > 0 || sleep.length > 0 ||
                           vo2Max.length > 0;
      
      if (hasRealData) {
        // Process the real data into the format expected by components
        const processedData = processRealHealthData(heartRate, steps, weight, sleep, vo2Max, workouts);
        resolve(processedData);
      } else {
        // Fall back to mock data if no real data is available
        resolve(mockHealthData);
      }
    }, 300); // Reduced delay for better UX
  });
};

// New function to process real health data
function processRealHealthData(heartRate, steps, weight, sleep, vo2Max, workouts) {
  // Get the most recent data for each type
  const getLatest = (arr) => arr.length > 0 ? 
    arr.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
  
  const latestHeartRate = getLatest(heartRate);
  const latestSteps = getLatest(steps);
  const latestWeight = getLatest(weight);
  const latestSleep = getLatest(sleep);
  const latestVo2Max = getLatest(vo2Max);
  
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
      previous: 78.7,
      lastUpdated: latestWeight ? formatTime(new Date(latestWeight.date)) : '06:21:33',
      data: weight
    },
    // Add workouts data processing as needed
  };
}

// Helper functions for date formatting
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}