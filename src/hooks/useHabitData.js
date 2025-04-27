import { useState, useEffect, useCallback } from 'react';
import { 
  saveHabitData, 
  loadHabitData, 
  checkInUser,
  claimReward,
  manageChallenge,
  updateUserPreferences,
  checkForTriggers,
  getAvailableInvestments,
  logBodyMetrics,
  logWorkoutNotes,
  setupReminders,
  loadAllHabitData
} from '../services/habitService';

// General hook for accessing any habit data
export function useHabitData(key, defaultValue) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load data on mount
  useEffect(() => {
    try {
      const loadedData = loadHabitData(key, defaultValue);
      setData(loadedData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, [key, defaultValue]);
  
  // Function to update data
  const updateData = useCallback((newData) => {
    try {
      // If newData is a function, call it with the current data
      const updatedData = typeof newData === 'function' 
        ? newData(data) 
        : newData;
        
      // Save to localStorage
      saveHabitData(key, updatedData);
      
      // Update state
      setData(updatedData);
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  }, [key, data]);
  
  return { data, loading, error, updateData };
}

// Specialized hook for all habit functionality
export function useHabitSystem() {
  const [habitData, setHabitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // Load all habit data on mount
  useEffect(() => {
    try {
      const allData = loadAllHabitData();
      setHabitData(allData);
      setLoading(false);
      
      // Check for triggers on load
      const triggerInfo = checkForTriggers();
      if (triggerInfo.shouldTrigger) {
        setNotifications(prev => [
          {
            id: Date.now(),
            type: triggerInfo.triggerType,
            message: triggerInfo.message
          },
          ...prev
        ]);
      }
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);
  
  // Perform user check-in
  const performCheckIn = useCallback((checkInType = 'daily') => {
    try {
      const result = checkInUser(checkInType);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          checkIns: result.checkIns,
          streakData: result.streakData
        }));
        
        // If a reward was generated, add notification
        if (result.reward) {
          setNotifications(prev => [
            {
              id: Date.now(),
              type: 'reward',
              message: `You've earned a reward: ${result.reward.title}`,
              reward: result.reward
            },
            ...prev
          ]);
        }
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Claim a reward
  const performClaimReward = useCallback((rewardId) => {
    try {
      const result = claimReward(rewardId);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          rewards: result.rewardsData
        }));
        
        // Add notification
        setNotifications(prev => [
          {
            id: Date.now(),
            type: 'rewardClaimed',
            message: `Reward claimed: ${result.reward.title}`
          },
          ...prev
        ]);
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Start or complete a challenge
  const performChallengeAction = useCallback((challengeId, action = 'start', category = null) => {
    try {
      const result = manageChallenge(challengeId, action, category);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          challenges: result.challengesData
        }));
        
        // Add notification
        setNotifications(prev => [
          {
            id: Date.now(),
            type: `challenge${action === 'start' ? 'Started' : 'Completed'}`,
            message: result.message
          },
          ...prev
        ]);
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Update user preferences
  const updatePreferences = useCallback((preferences) => {
    try {
      const result = updateUserPreferences(preferences);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          preferences: result.preferences
        }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Log body metrics
  const recordBodyMetrics = useCallback((metrics) => {
    try {
      const result = logBodyMetrics(metrics);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          bodyMetrics: result.bodyMetrics
        }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Save workout notes
  const recordWorkoutNotes = useCallback((notes) => {
    try {
      const result = logWorkoutNotes(notes);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          workoutNotes: result.workoutNotes
        }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Set up reminders
  const configureReminders = useCallback((reminders) => {
    try {
      const result = setupReminders(reminders);
      
      if (result.success) {
        // Update local state
        setHabitData(prev => ({
          ...prev,
          reminders: result.reminders
        }));
      }
      
      return result;
    } catch (err) {
      setError(err);
      return { success: false, message: err.message };
    }
  }, []);
  
  // Get investment opportunities for the user
  const getInvestments = useCallback(() => {
    return getAvailableInvestments();
  }, []);
  
  // Dismiss a notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);
  
  return {
    habitData,
    loading,
    error,
    notifications,
    actions: {
      checkIn: performCheckIn,
      claimReward: performClaimReward,
      manageChallenge: performChallengeAction,
      updatePreferences,
      recordBodyMetrics,
      recordWorkoutNotes,
      configureReminders,
      getInvestments,
      dismissNotification
    }
  };
}