// src/services/habitService.js
import { 
  generateTriggers, 
  getVariableReward, 
  getInvestmentOpportunities, 
  calculateActionDifficulty,
  getPersonalizedChallengeProgression
} from '../utils/habitUtils';

// ----- DATA MODELS -----

// Streak data model
const defaultStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckIn: null,
  history: [] // Array of {date, completed}
};

// Check-in data model
const defaultCheckInData = {
  lastCheckIn: null,
  history: [] // Array of {date, time, type}
};

// Rewards data model
const defaultRewardsData = {
  claimed: [], // Array of {id, date, type, title}
  available: [] // Array of {id, type, title, description, value}
};

// Challenges data model
const defaultChallengesData = {
  active: [], // Array of {id, category, name, description, startDate, completed}
  completed: [], // Array of {id, category, name, description, completedDate}
  preferences: [] // User's preferred challenge categories (strength, cardio, etc.)
};

// User preferences model
const defaultUserPreferences = {
  interests: [], // Array of strings: ['strength', 'cardio', 'nutrition', etc.]
  preferredCheckInTime: null, // Time string like "07:00"
  goalCategories: [], // Array of strings: ['weight', 'strength', 'endurance', etc.]
  notifications: true,
  hasCompletedOnboarding: false
};

// ----- LOCAL STORAGE OPERATIONS -----

// Save to localStorage with proper namespacing
export function saveHabitData(key, data) {
  try {
    localStorage.setItem(`neo-vitru-${key}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} data:`, error);
    return false;
  }
}

// Load from localStorage with proper namespacing
export function loadHabitData(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(`neo-vitru-${key}`);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} data:`, error);
    return defaultValue;
  }
}

// ----- CORE FUNCTIONALITY -----

// Check in the user, update streak, and possibly generate rewards
export function checkInUser(checkInType = 'daily') {
  const today = new Date();
  const todayString = today.toDateString();
  const todayIsoString = today.toISOString();
  
  // Load existing data
  const checkIns = loadHabitData('checkins', defaultCheckInData);
  const streakData = loadHabitData('streaks', defaultStreakData);
  
  // Check if already checked in today
  if (checkIns.lastCheckIn === todayString && checkInType === 'daily') {
    return { 
      success: false, 
      message: 'Already checked in today',
      checkIns,
      streakData
    };
  }
  
  // Update check-ins data
  const updatedCheckIns = {
    lastCheckIn: todayString,
    history: [
      {
        date: todayString,
        time: todayIsoString,
        type: checkInType
      },
      ...checkIns.history
    ]
  };
  
  // Calculate streak
  let newStreak = 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  
  // Check if last check-in was yesterday (continue streak) or if this is a reset
  if (streakData.lastCheckIn === yesterdayString || checkInType !== 'daily') {
    newStreak = streakData.currentStreak + 1;
  } else {
    newStreak = 1; // Reset streak
  }
  
  // Update streak data
  const updatedStreakData = {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, streakData.longestStreak),
    lastCheckIn: todayString,
    history: [
      {
        date: todayString,
        completed: true
      },
      ...streakData.history
    ]
  };
  
  // Save updated data
  saveHabitData('checkins', updatedCheckIns);
  saveHabitData('streaks', updatedStreakData);
  
  // Check if user should get a reward
  let reward = null;
  const userPreferences = loadHabitData('preferences', defaultUserPreferences);
  const rewardsData = loadHabitData('rewards', defaultRewardsData);
  
  if (newStreak > 0) {
    reward = getVariableReward(newStreak, userPreferences.interests, rewardsData.claimed);
    
    // If a reward was generated, add it to available rewards
    if (reward) {
      const updatedRewardsData = {
        ...rewardsData,
        available: [
          {
            ...reward,
            id: Date.now(),
            dateGenerated: todayIsoString
          },
          ...rewardsData.available
        ]
      };
      
      saveHabitData('rewards', updatedRewardsData);
    }
  }
  
  return {
    success: true,
    message: 'Check-in successful',
    checkIns: updatedCheckIns,
    streakData: updatedStreakData,
    reward
  };
}

// Claim a reward
export function claimReward(rewardId) {
  const rewardsData = loadHabitData('rewards', defaultRewardsData);
  
  // Find the reward
  const rewardIndex = rewardsData.available.findIndex(r => r.id === rewardId);
  if (rewardIndex === -1) {
    return {
      success: false,
      message: 'Reward not found'
    };
  }
  
  const reward = rewardsData.available[rewardIndex];
  
  // Move from available to claimed
  const updatedRewardsData = {
    claimed: [
      {
        id: reward.id,
        type: reward.type,
        title: reward.title,
        value: reward.value,
        claimedAt: new Date().toISOString()
      },
      ...rewardsData.claimed
    ],
    available: [
      ...rewardsData.available.slice(0, rewardIndex),
      ...rewardsData.available.slice(rewardIndex + 1)
    ]
  };
  
  saveHabitData('rewards', updatedRewardsData);
  
  // Apply reward effects (would connect to other services in a real app)
  let rewardEffects = {};
  
  if (reward.type === 'streak' || reward.type === 'progress') {
    // XP rewards
    const xpMatch = reward.value.match(/\+(\d+)\s*XP/i);
    if (xpMatch) {
      rewardEffects.xpGained = parseInt(xpMatch[1]);
    }
  }
  
  return {
    success: true,
    message: 'Reward claimed successfully',
    reward,
    rewardEffects,
    rewardsData: updatedRewardsData
  };
}

// Start or update a challenge
export function manageChallenge(challengeId, action = 'start', category = null) {
  const challengesData = loadHabitData('challenges', defaultChallengesData);
  
  if (action === 'start') {
    // Get challenges for this category
    const userProgress = 100; // For demo; would get from user data
    const availableChallenges = getPersonalizedChallengeProgression(category, userProgress);
    
    // Find the challenge
    const challenge = availableChallenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.unlocked) {
      return {
        success: false,
        message: 'Challenge not available or locked'
      };
    }
    
    // Add to active challenges
    const updatedChallengesData = {
      ...challengesData,
      active: [
        {
          id: challenge.id,
          category,
          name: challenge.name,
          description: challenge.description,
          xp: challenge.xp,
          startDate: new Date().toISOString(),
          completed: false
        },
        ...challengesData.active
      ]
    };
    
    saveHabitData('challenges', updatedChallengesData);
    
    return {
      success: true,
      message: 'Challenge started',
      challengesData: updatedChallengesData
    };
  }
  
  if (action === 'complete') {
    // Find the active challenge
    const challengeIndex = challengesData.active.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) {
      return {
        success: false,
        message: 'Challenge not found'
      };
    }
    
    const challenge = challengesData.active[challengeIndex];
    
    // Move from active to completed
    const updatedChallengesData = {
      active: [
        ...challengesData.active.slice(0, challengeIndex),
        ...challengesData.active.slice(challengeIndex + 1)
      ],
      completed: [
        {
          ...challenge,
          completed: true,
          completedDate: new Date().toISOString()
        },
        ...challengesData.completed
      ],
      preferences: challengesData.preferences
    };
    
    saveHabitData('challenges', updatedChallengesData);
    
    return {
      success: true,
      message: 'Challenge completed',
      xpGained: challenge.xp,
      challengesData: updatedChallengesData
    };
  }
  
  return {
    success: false,
    message: 'Invalid action'
  };
}

// Update user preferences (investment step in Hook model)
export function updateUserPreferences(preferences) {
  const currentPreferences = loadHabitData('preferences', defaultUserPreferences);
  
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences,
    hasCompletedOnboarding: true
  };
  
  saveHabitData('preferences', updatedPreferences);
  
  return {
    success: true,
    message: 'Preferences updated',
    preferences: updatedPreferences
  };
}

// Check for habit triggers (critical for Hook model)
export function checkForTriggers() {
  const checkIns = loadHabitData('checkins', defaultCheckInData);
  const lastActivity = checkIns.lastCheckIn;
  
  const triggerInfo = generateTriggers(checkIns.history, lastActivity);
  
  return {
    ...triggerInfo,
    lastActivity
  };
}

// Get available investment opportunities for the user
export function getAvailableInvestments() {
  const userData = {
    hasSetPreferences: loadHabitData('preferences', defaultUserPreferences).hasCompletedOnboarding,
    hasSetReminders: loadHabitData('reminders') !== null
  };
  
  const habitHistory = loadHabitData('checkins', defaultCheckInData).history;
  
  return getInvestmentOpportunities(userData, habitHistory);
}

// Log body metrics (part of investment stage)
export function logBodyMetrics(metrics) {
  const now = new Date().toISOString();
  const bodyMetrics = loadHabitData('bodyMetrics', {
    weight: [],
    bodyFat: [],
    musclePercentage: []
  });
  
  const updatedMetrics = { ...bodyMetrics };
  
  // Add new metrics to the appropriate arrays
  if (metrics.weight !== undefined && !isNaN(metrics.weight)) {
    updatedMetrics.weight = [
      { date: now, value: parseFloat(metrics.weight) },
      ...bodyMetrics.weight
    ];
  }
  
  if (metrics.bodyFat !== undefined && !isNaN(metrics.bodyFat)) {
    updatedMetrics.bodyFat = [
      { date: now, value: parseFloat(metrics.bodyFat) },
      ...bodyMetrics.bodyFat
    ];
  }
  
  if (metrics.musclePercentage !== undefined && !isNaN(metrics.musclePercentage)) {
    updatedMetrics.musclePercentage = [
      { date: now, value: parseFloat(metrics.musclePercentage) },
      ...bodyMetrics.musclePercentage
    ];
  }
  
  saveHabitData('bodyMetrics', updatedMetrics);
  
  // Log this as a check-in activity (for streak purposes)
  checkInUser('metrics');
  
  return {
    success: true,
    message: 'Metrics logged successfully',
    bodyMetrics: updatedMetrics
  };
}

// Save workout notes (part of investment stage)
export function logWorkoutNotes(notes) {
  if (!notes || notes.trim() === '') {
    return {
      success: false,
      message: 'Notes cannot be empty'
    };
  }
  
  const workoutNotes = loadHabitData('workoutNotes', []);
  
  const updatedNotes = [
    {
      id: Date.now(),
      date: new Date().toISOString(),
      content: notes,
      type: 'workout'
    },
    ...workoutNotes
  ];
  
  saveHabitData('workoutNotes', updatedNotes);
  
  // Log this as a check-in activity (for streak purposes)
  checkInUser('workout');
  
  return {
    success: true,
    message: 'Notes saved successfully',
    workoutNotes: updatedNotes
  };
}

// Set up reminders for future triggers
export function setupReminders(reminders) {
  saveHabitData('reminders', reminders);
  
  return {
    success: true,
    message: 'Reminders set up successfully',
    reminders
  };
}

// Load all habit data for initialization
export function loadAllHabitData() {
  return {
    checkIns: loadHabitData('checkins', defaultCheckInData),
    streakData: loadHabitData('streaks', defaultStreakData),
    rewards: loadHabitData('rewards', defaultRewardsData),
    challenges: loadHabitData('challenges', defaultChallengesData),
    preferences: loadHabitData('preferences', defaultUserPreferences),
    bodyMetrics: loadHabitData('bodyMetrics', {
      weight: [],
      bodyFat: [],
      musclePercentage: []
    }),
    workoutNotes: loadHabitData('workoutNotes', []),
    reminders: loadHabitData('reminders', [])
  };
}