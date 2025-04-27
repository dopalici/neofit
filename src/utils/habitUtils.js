// src/utils/habitUtils.js
// Implements Nir Eyal's Hook Model:
// 1. Trigger (internal/external)
// 2. Action (simple user behavior)
// 3. Variable Reward (fulfills need while leaving user wanting more)
// 4. Investment (increases likelihood of next engagement)

import { format, differenceInDays, isSameDay, isToday, subDays } from 'date-fns';

// Generate external trigger notifications based on user's usage patterns
export function generateTriggers(checkInHistory, lastActivity) {
  const today = new Date();
  
  // If user has no check-in history or hasn't been active today
  if (!checkInHistory || checkInHistory.length === 0 || !isActive(lastActivity)) {
    return {
      shouldTrigger: true,
      triggerType: 'reminder',
      message: 'Maintain your optimization streak by checking in today.'
    };
  }
  
  // If user has missed their routine time
  const userPatterns = analyzeUserPatterns(checkInHistory);
  if (userPatterns.usualCheckInTime && isTimeLaterThan(new Date(), userPatterns.usualCheckInTime)) {
    return {
      shouldTrigger: true,
      triggerType: 'missedRoutine',
      message: 'You usually check in around ' + formatTime(userPatterns.usualCheckInTime) + '. Keep your streak going!'
    };
  }
  
  // If user is close to reaching a milestone
  if (userPatterns.currentStreak && [4, 9, 24, 29, 99].includes(userPatterns.currentStreak)) {
    return {
      shouldTrigger: true,
      triggerType: 'milestone',
      message: `You're just 1 day away from a ${userPatterns.currentStreak + 1}-day streak milestone!`
    };
  }
  
  return { shouldTrigger: false };
}

// Analyze user patterns from check-in history
function analyzeUserPatterns(checkInHistory) {
  if (!checkInHistory || checkInHistory.length < 3) {
    return {};
  }
  
  // Calculate streak
  let currentStreak = 0;
  let i = 0;
  const sortedHistory = [...checkInHistory].sort((a, b) => 
    new Date(b.date || b.time) - new Date(a.date || a.time)
  );
  
  // Calculate current streak (consecutive days)
  let checkDate = new Date();
  for (const entry of sortedHistory) {
    const entryDate = new Date(entry.date || entry.time);
    
    // If this entry is from current date being checked
    if (isSameDay(entryDate, checkDate)) {
      currentStreak++;
      // Move to previous day
      checkDate = subDays(checkDate, 1);
    } else if (differenceInDays(checkDate, entryDate) === 1) {
      // There's a gap, streak is broken
      break;
    } else {
      // Move checkDate to match this entry and continue streak
      checkDate = entryDate;
      currentStreak++;
      // Move to previous day
      checkDate = subDays(checkDate, 1);
    }
  }
  
  // Calculate usual check-in time (average of last 5 check-ins)
  const recentTimes = sortedHistory.slice(0, 5).map(h => new Date(h.date || h.time));
  let totalMinutes = 0;
  
  for (const time of recentTimes) {
    totalMinutes += time.getHours() * 60 + time.getMinutes();
  }
  
  const averageMinutes = Math.floor(totalMinutes / recentTimes.length);
  const usualCheckInTime = new Date();
  usualCheckInTime.setHours(Math.floor(averageMinutes / 60));
  usualCheckInTime.setMinutes(averageMinutes % 60);
  
  return {
    currentStreak,
    usualCheckInTime
  };
}

// Check if user is active today based on last activity timestamp
export function isActive(lastActivity) {
  if (!lastActivity) return false;
  
  const lastActiveDate = new Date(lastActivity);
  return isToday(lastActiveDate);
}

// Get appropriate variable reward based on user's progress and preferences
export function getVariableReward(streakLength, userInterests, lastRewards) {
  // Create array of possible rewards weighted by probability
  const possibleRewards = [];
  
  // Basic rewards always available
  possibleRewards.push({
    type: 'progress',
    title: 'EFFICIENCY BOOST',
    description: 'Your consistent effort is enhancing your results',
    value: '+50 XP',
    probability: 0.7
  });
  
  // Streak-based rewards (higher probability with longer streaks)
  if (streakLength >= 3) {
    possibleRewards.push({
      type: 'streak',
      title: 'MOMENTUM AMPLIFIER',
      description: `${streakLength}-day streak achievement`,
      value: `+${streakLength * 10} XP`,
      probability: Math.min(0.1 * streakLength, 0.8)
    });
  }
  
  // Milestone rewards (predictable intervals but variable content)
  if (streakLength === 5 || streakLength === 10 || streakLength === 30 || streakLength === 100) {
    possibleRewards.push({
      type: 'milestone',
      title: `${streakLength}-DAY OPTIMIZATION THRESHOLD`,
      description: 'You have reached a significant milestone',
      value: 'NEW FEATURE UNLOCKED',
      probability: 0.9
    });
  }
  
  // Personalized rewards based on user interests
  if (userInterests && userInterests.includes('strength')) {
    possibleRewards.push({
      type: 'personalized',
      title: 'STRENGTH PROTOCOL UNLOCKED',
      description: 'New advanced strength training methodology',
      value: 'CUSTOM PROGRAM',
      probability: 0.3
    });
  }
  
  if (userInterests && userInterests.includes('cardio')) {
    possibleRewards.push({
      type: 'personalized',
      title: 'CARDIO EFFICIENCY MATRIX',
      description: 'Optimized heart rate zone calculations',
      value: 'HEART RATE ZONES',
      probability: 0.3
    });
  }
  
  // Surprise reward (completely unexpected)
  if (Math.random() < 0.05) { // 5% chance
    possibleRewards.push({
      type: 'surprise',
      title: 'SYSTEM UPGRADE',
      description: 'You have unlocked an unexpected enhancement',
      value: 'MYSTERY REWARD',
      probability: 1.0
    });
  }
  
  // Filter out rewards that were recently given (avoid repetition)
  const filteredRewards = possibleRewards.filter(reward => {
    if (!lastRewards || lastRewards.length === 0) return true;
    
    // Don't show same reward type twice in a row
    const recentRewardTypes = lastRewards.slice(0, 3).map(r => r.type);
    if (recentRewardTypes.every(t => t === reward.type)) return false;
    
    return true;
  });
  
  // Choose a reward based on probability
  let selectedReward = null;
  for (const reward of filteredRewards) {
    if (Math.random() < reward.probability) {
      selectedReward = reward;
      break;
    }
  }
  
  // If no reward was selected by probability, pick one randomly
  if (!selectedReward && filteredRewards.length > 0) {
    selectedReward = filteredRewards[Math.floor(Math.random() * filteredRewards.length)];
  }
  
  return selectedReward;
}

// Get investment opportunities for the user to increase future engagement
export function getInvestmentOpportunities(userData, habitHistory) {
  const opportunities = [];
  
  // Opportunity to personalize
  if (!userData.hasSetPreferences) {
    opportunities.push({
      type: 'personalize',
      title: 'PERSONALIZE YOUR SYSTEM',
      description: 'Set your preferences to get personalized recommendations',
      benefit: 'More relevant rewards and challenges',
      action: 'setPreferences'
    });
  }
  
  // Opportunity to log data
  if (!habitHistory || habitHistory.filter(h => h.type === 'bodyMetrics').length === 0) {
    opportunities.push({
      type: 'dataLogging',
      title: 'RECORD YOUR PROGRESS METRICS',
      description: 'Log your body measurements to track progress over time',
      benefit: 'Visualize your improvement journey',
      action: 'logBodyMetrics'
    });
  }
  
  // Opportunity to set up reminders
  if (!userData.hasSetReminders) {
    opportunities.push({
      type: 'reminders',
      title: 'OPTIMIZE YOUR ROUTINE',
      description: 'Set up smart reminders to stay on track',
      benefit: 'Never miss a session again',
      action: 'setupReminders'
    });
  }
  
  // Opportunity to join challenges
  opportunities.push({
    type: 'challenge',
    title: 'JOIN PROGRESSIVE CHALLENGES',
    description: 'Select challenges that align with your goals',
    benefit: 'Structured approach to reaching your fitness goals',
    action: 'browsePrograms'
  });
  
  return opportunities;
}

// Helper function to check if time1 is later than time2
function isTimeLaterThan(time1, time2) {
  return (time1.getHours() > time2.getHours()) || 
    (time1.getHours() === time2.getHours() && time1.getMinutes() > time2.getMinutes());
}

// Format time from Date object to string
function formatTime(date) {
  return format(date, 'h:mm a');
}

// Calculate how difficult an action is perceived based on user history
export function calculateActionDifficulty(action, userHistory) {
  // Factors in Nir Eyal's B=MAT formula:
  // Behavior = Motivation + Ability + Trigger
  
  // Default difficulty (higher = harder)
  let difficulty = 5;
  
  if (!userHistory || userHistory.length === 0) {
    return difficulty;
  }
  
  // Reduce difficulty if user has successfully completed this action before
  const actionCompletions = userHistory.filter(h => h.action === action).length;
  difficulty -= Math.min(actionCompletions, 3); // Max 3 point reduction
  
  // Reduce difficulty if user has been active recently (last 3 days)
  const recentActivity = userHistory.some(h => {
    const actionDate = new Date(h.date || h.time);
    return differenceInDays(new Date(), actionDate) <= 3;
  });
  
  if (recentActivity) {
    difficulty -= 1;
  }
  
  return Math.max(1, difficulty);
}

// Get personalized challenge progression based on user history
export function getPersonalizedChallengeProgression(challengeCategory, userProgress) {
  const challenges = {
    strength: [
      {
        id: 'strength_1',
        name: 'FOUNDATIONAL STRENGTH',
        description: 'Complete 3 sets of 10 bodyweight squats',
        xp: 50,
        threshold: 0 // Available immediately
      },
      {
        id: 'strength_2',
        name: 'STRENGTH PROGRESSION I',
        description: 'Complete 3 sets of 15 bodyweight squats',
        xp: 100,
        threshold: 50 // Requires 50 XP in strength
      },
      {
        id: 'strength_3',
        name: 'STRENGTH PROGRESSION II',
        description: 'Complete 3 sets of 10 weighted squats (25% bodyweight)',
        xp: 150,
        threshold: 150
      },
      {
        id: 'strength_4',
        name: 'ADVANCED STRENGTH I',
        description: 'Complete 3 sets of 8 weighted squats (50% bodyweight)',
        xp: 200,
        threshold: 300
      },
      {
        id: 'strength_5',
        name: 'ELITE STRENGTH',
        description: 'Complete 3 sets of 5 weighted squats (100% bodyweight)',
        xp: 300,
        threshold: 500
      }
    ],
    cardio: [
      {
        id: 'cardio_1',
        name: 'CARDIOVASCULAR BASE',
        description: 'Complete a 1 mile run/walk without stopping',
        xp: 50,
        threshold: 0
      },
      {
        id: 'cardio_2',
        name: 'CARDIO EFFICIENCY I',
        description: 'Complete a 2 mile run in under 20 minutes',
        xp: 100,
        threshold: 50
      },
      {
        id: 'cardio_3',
        name: 'CARDIO EFFICIENCY II',
        description: 'Complete a 5K run in under 30 minutes',
        xp: 150,
        threshold: 150
      },
      {
        id: 'cardio_4',
        name: 'ADVANCED CARDIO',
        description: 'Complete a 10K run in under 60 minutes',
        xp: 200,
        threshold: 300
      },
      {
        id: 'cardio_5',
        name: 'ELITE CARDIO',
        description: 'Complete a half marathon',
        xp: 300,
        threshold: 500
      }
    ],
    flexibility: [
      {
        id: 'flex_1',
        name: 'MOBILITY FOUNDATION',
        description: 'Touch your toes while keeping legs straight',
        xp: 50,
        threshold: 0
      },
      {
        id: 'flex_2',
        name: 'FLEXIBILITY PROGRESS I',
        description: 'Hold a proper squat position for 30 seconds',
        xp: 100,
        threshold: 50
      },
      {
        id: 'flex_3',
        name: 'FLEXIBILITY PROGRESS II',
        description: 'Perform a seated forward bend (head to knees)',
        xp: 150,
        threshold: 150
      },
      {
        id: 'flex_4',
        name: 'ADVANCED FLEXIBILITY',
        description: 'Hold a proper downward dog position for 60 seconds',
        xp: 200,
        threshold: 300
      },
      {
        id: 'flex_5',
        name: 'ELITE FLEXIBILITY',
        description: 'Perform a full side split',
        xp: 300,
        threshold: 500
      }
    ]
  };
  
  // Select appropriate category challenges
  const categoryChallenges = challenges[challengeCategory] || challenges.strength;
  
  // Filter challenges based on user progress
  return categoryChallenges.map(challenge => {
    // Challenge is unlocked if user has enough XP in this category
    const unlocked = userProgress >= challenge.threshold;
    
    return {
      ...challenge,
      unlocked,
      unlocksAt: !unlocked ? `Requires ${challenge.threshold} ${challengeCategory} XP` : null
    };
  });
}