// src/utils/storageUtils.js

/**
 * Storage utility functions for NEO•VITRU habit-forming features
 * 
 * These functions handle:
 * - Reading/writing from localStorage with proper error handling
 * - Automatic prefixing of keys to avoid collisions
 * - Type safety and validation
 * - Default values for missing data
 */

// App-specific prefix to avoid collisions with other apps
const STORAGE_PREFIX = 'neo-vitru-';

/**
 * Save data to localStorage with proper error handling
 * 
 * @param {string} key - Storage key (will be prefixed automatically)
 * @param {any} data - Data to store (will be JSON stringified)
 * @param {boolean} merge - If true, merges with existing data instead of replacing
 * @returns {boolean} Success status
 */
export function saveToStorage(key, data, merge = false) {
  try {
    // Add prefix to key
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    
    // If merge is true and existing data exists, merge with it
    if (merge) {
      const existingData = getFromStorage(key, null);
      if (existingData) {
        if (Array.isArray(existingData) && Array.isArray(data)) {
          // For arrays, concatenate
          data = [...existingData, ...data];
        } else if (typeof existingData === 'object' && typeof data === 'object') {
          // For objects, merge properties
          data = { ...existingData, ...data };
        }
      }
    }
    
    // Stringify and save
    localStorage.setItem(prefixedKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Retrieve data from localStorage with proper error handling
 * 
 * @param {string} key - Storage key (will be prefixed automatically)
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The stored data or defaultValue if not found
 */
export function getFromStorage(key, defaultValue = null) {
  try {
    // Add prefix to key
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    
    // Get from localStorage
    const item = localStorage.getItem(prefixedKey);
    
    // Return parsed item if it exists, otherwise default value
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * 
 * @param {string} key - Storage key (will be prefixed automatically)
 * @returns {boolean} Success status
 */
export function removeFromStorage(key) {
  try {
    // Add prefix to key
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    
    // Remove from localStorage
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all app data from localStorage
 * Only removes items with the app's prefix
 * 
 * @returns {boolean} Success status
 */
export function clearAppStorage() {
  try {
    // Get all keys
    const keys = Object.keys(localStorage);
    
    // Remove only keys with app prefix
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing app localStorage:', error);
    return false;
  }
}

/**
 * Get all app storage keys
 * 
 * @returns {string[]} Array of storage keys (without prefix)
 */
export function getStorageKeys() {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('Error getting storage keys:', error);
    return [];
  }
}

/**
 * Check if localStorage is available
 * 
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const testKey = `${STORAGE_PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch (error) {
    return false;
  }
}

/**
 * Specific storage functions for habit-forming features
 */

// Habit-specific keys
export const STORAGE_KEYS = {
  STREAK_DATA: 'streak',
  CHECK_INS: 'checkins',
  COMPLETED_CHALLENGES: 'challenges',
  CLAIMED_REWARDS: 'rewards',
  BODY_METRICS: 'metrics',
  WORKOUT_LOGS: 'workouts',
  REMINDERS: 'reminders'
};

// Default data structures
const DEFAULT_DATA = {
  [STORAGE_KEYS.STREAK_DATA]: {
    currentStreak: 0,
    longestStreak: 0,
    lastCheckIn: null,
    history: []
  },
  [STORAGE_KEYS.CHECK_INS]: {
    lastCheckIn: null,
    history: []
  },
  [STORAGE_KEYS.CLAIMED_REWARDS]: {
    claimed: [],
    available: []
  },
  [STORAGE_KEYS.BODY_METRICS]: {
    weight: [],
    bodyFat: [],
    musclePercentage: []
  },
  [STORAGE_KEYS.WORKOUT_LOGS]: []
};

/**
 * Get habit data with proper defaults
 * 
 * @param {string} key - One of STORAGE_KEYS constants
 * @returns {any} The habit data with proper defaults
 */
export function getHabitData(key) {
  return getFromStorage(key, DEFAULT_DATA[key] || null);
}

/**
 * Save habit data
 * 
 * @param {string} key - One of STORAGE_KEYS constants 
 * @param {any} data - Data to save
 * @returns {boolean} Success status
 */
export function saveHabitData(key, data) {
  return saveToStorage(key, data);
}

/**
 * Add a check-in and update streak
 * 
 * @returns {object} Updated streak data
 */
export function recordCheckIn() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Get current streak data
  const streakData = getHabitData(STORAGE_KEYS.STREAK_DATA);
  const checkIns = getHabitData(STORAGE_KEYS.CHECK_INS);
  
  // Already checked in today
  if (checkIns.lastCheckIn === today) {
    return { streakData, checkIns, alreadyCompleted: true };
  }
  
  // Calculate new streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  let newStreak = streakData.currentStreak;
  if (checkIns.lastCheckIn === yesterdayString) {
    // Continuing streak
    newStreak += 1;
  } else {
    // Broken streak, starting new
    newStreak = 1;
  }
  
  // Update streak data
  const updatedStreakData = {
    ...streakData,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, streakData.longestStreak),
    lastCheckIn: today
  };
  
  // Update check-in data
  const updatedCheckIns = {
    ...checkIns,
    lastCheckIn: today,
    history: [
      { date: today, time: new Date().toISOString() },
      ...checkIns.history
    ]
  };
  
  // Save both updates
  saveHabitData(STORAGE_KEYS.STREAK_DATA, updatedStreakData);
  saveHabitData(STORAGE_KEYS.CHECK_INS, updatedCheckIns);
  
  return {
    streakData: updatedStreakData,
    checkIns: updatedCheckIns,
    newStreak,
    isMilestone: newStreak % 5 === 0, // Milestone every 5 days
    broken: false
  };
}

/**
 * Add a body metric measurement
 * 
 * @param {object} metrics - Object with weight, bodyFat, etc. properties
 * @returns {object} Updated metrics data
 */
export function recordBodyMetrics(metrics) {
  const now = new Date().toISOString();
  const storedMetrics = getHabitData(STORAGE_KEYS.BODY_METRICS);
  const updatedMetrics = { ...storedMetrics };
  
  // Add new metrics with timestamp
  Object.keys(metrics).forEach(metricType => {
    if (metrics[metricType] && updatedMetrics[metricType]) {
      updatedMetrics[metricType] = [
        { date: now, value: parseFloat(metrics[metricType]) },
        ...updatedMetrics[metricType]
      ];
    }
  });
  
  // Save updated metrics
  saveHabitData(STORAGE_KEYS.BODY_METRICS, updatedMetrics);
  
  return updatedMetrics;
}

/**
 * Log a workout
 * 
 * @param {object} workout - Workout data
 * @returns {array} Updated workout logs
 */
export function logWorkout(workout) {
  const workouts = getHabitData(STORAGE_KEYS.WORKOUT_LOGS);
  
  // Add timestamp if not provided
  if (!workout.date) {
    workout.date = new Date().toISOString();
  }
  
  // Add workout to logs
  const updatedWorkouts = [workout, ...workouts];
  
  // Save updated workouts
  saveHabitData(STORAGE_KEYS.WORKOUT_LOGS, updatedWorkouts);
  
  return updatedWorkouts;
}

/**
 * Claim a reward
 * 
 * @param {object} reward - Reward data
 * @returns {object} Updated rewards data
 */
export function claimReward(reward) {
  const rewardsData = getHabitData(STORAGE_KEYS.CLAIMED_REWARDS);
  
  // Add claimed reward
  const updatedRewards = {
    ...rewardsData,
    claimed: [
      {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        value: reward.value,
        category: reward.category,
        claimedAt: new Date().toISOString()
      },
      ...rewardsData.claimed
    ]
  };
  
  // Save updated rewards
  saveHabitData(STORAGE_KEYS.CLAIMED_REWARDS, updatedRewards);
  
  return updatedRewards;
}