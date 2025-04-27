// src/components/dashboard/HabitDashboard.jsx
import React, { useState, useEffect } from 'react';
import DailyCheckIn from '../habit/DailyCheckIn';
import HabitStreakTracker from '../habit/HabitStreakTracker';
import ProgressiveChallenge from '../habit/ProgressiveChallenge';
import VariableRewardsSystem from '../habit/VariableRewardsSystem';
import InvestmentFeature from '../habit/InvestmentFeature';
import SmartReminders from '../habit/SmartReminders';
import { useHabitSystem } from '../../hooks/useHabitData';
import { Bell, X, Award } from 'lucide-react';

export default function HabitDashboard() {
  const { habitData, loading, error, notifications, actions } = useHabitSystem();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    interests: [],
    preferredCheckInTime: "08:00",
    goalCategories: [],
    notifications: true
  });
  
  // Check if onboarding is needed
  useEffect(() => {
    if (!loading && habitData && !habitData.preferences.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, habitData]);
  
  // Handle preference changes in onboarding
  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle interest toggle in onboarding
  const toggleInterest = (interest) => {
    setUserPreferences(prev => {
      const interests = [...prev.interests];
      const index = interests.indexOf(interest);
      
      if (index === -1) {
        interests.push(interest);
      } else {
        interests.splice(index, 1);
      }
      
      return {
        ...prev,
        interests
      };
    });
  };
  
  // Submit onboarding preferences
  const submitPreferences = () => {
    actions.updatePreferences(userPreferences);
    setShowOnboarding(false);
  };
  
  // Handle check-in from any component
  const handleCheckIn = (type = 'daily') => {
    return actions.checkIn(type);
  };
  
  // Handle claiming a reward
  const handleClaimReward = (rewardId) => {
    return actions.claimReward(rewardId);
  };
  
  // Handle challenge management
  const handleChallengeAction = (challengeId, action, category) => {
    return actions.manageChallenge(challengeId, action, category);
  };
  
  // Handle log body metrics
  const handleLogMetrics = (metrics) => {
    return actions.recordBodyMetrics(metrics);
  };
  
  // Handle log workout notes
  const handleLogWorkoutNotes = (notes) => {
    return actions.recordWorkoutNotes(notes);
  };
  
  // Handle reminder setup
  const handleSetupReminders = (reminders) => {
    return actions.configureReminders(reminders);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-cyan-300 font-mono">HABIT OPTIMIZATION SYSTEM</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>
          <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="p-4 bg-red-900/30 text-red-400 border border-red-800 rounded-lg">
          Error loading habit data. Please try refreshing the page.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-6 z-50 w-80 space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className="bg-gray-900 border border-cyan-700 rounded-lg shadow-lg shadow-cyan-900/30 p-4 animate-slide-in"
            >
              <div className="flex items-start">
                <div className="bg-cyan-900 rounded-full p-2 mr-3">
                  {notification.type === 'reward' ? (
                    <Award size={16} className="text-yellow-400" />
                  ) : (
                    <Bell size={16} className="text-cyan-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-cyan-300 font-mono">
                      {notification.type === 'reward' ? 'REWARD AVAILABLE' : 'SYSTEM NOTIFICATION'}
                    </h4>
                    <button 
                      onClick={() => actions.dismissNotification(notification.id)}
                      className="text-cyan-600 hover:text-cyan-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-cyan-600 font-mono mt-1">{notification.message}</p>
                  
                  {notification.type === 'reward' && notification.reward && (
                    <button 
                      onClick={() => handleClaimReward(notification.reward.id)}
                      className="mt-2 bg-cyan-900 text-cyan-300 border border-cyan-600 px-3 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                    >
                      CLAIM REWARD
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">HABIT OPTIMIZATION SYSTEM</h1>
        <div className="text-xs text-cyan-600 font-mono">
          BASED ON NEUROLOGICAL HABIT RESEARCH
        </div>
      </div>

      {/* First Row - Core Streak & Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <HabitStreakTracker 
          streakData={habitData?.streakData} 
        />
        <DailyCheckIn 
          checkInData={habitData?.checkIns}
          onCheckIn={handleCheckIn}
        />
      </div>

      {/* Second Row - Challenges & Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ProgressiveChallenge 
          challengesData={habitData?.challenges}
          onStartChallenge={(id, category) => handleChallengeAction(id, 'start', category)}
          onCompleteChallenge={(id) => handleChallengeAction(id, 'complete')}
          userPreferences={habitData?.preferences}
        />
        <VariableRewardsSystem 
          rewardsData={habitData?.rewards}
          onCheckRewards={() => handleCheckIn('rewards')}
          onClaimReward={handleClaimReward}
          userData={{ 
            level: Math.floor((habitData?.streakData?.currentStreak || 0) / 5) + 1,
            xp: (habitData?.streakData?.currentStreak || 0) * 50
          }}
        />
      </div>

      {/* Third Row - Personal Logs/Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <InvestmentFeature 
          bodyMetrics={habitData?.bodyMetrics}
          workoutNotes={habitData?.workoutNotes}
          onLogMetrics={handleLogMetrics}
          onLogWorkoutNotes={handleLogWorkoutNotes}
        />
      </div>

      {/* Fourth Row - Smart Reminders */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <SmartReminders 
          reminders={habitData?.reminders || []}
          onUpdateReminders={handleSetupReminders}
        />
      </div>
      
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyan-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-cyan-300 font-mono mb-4">HABIT SYSTEM INITIALIZATION</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-cyan-300 font-mono mb-2">SELECT YOUR FITNESS INTERESTS</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['strength', 'cardio', 'flexibility', 'nutrition', 'recovery', 'mindfulness'].map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono uppercase ${
                        userPreferences.interests.includes(interest)
                          ? 'bg-cyan-900 border border-cyan-600 text-cyan-300'
                          : 'bg-gray-800 border border-gray-700 text-gray-400'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-cyan-300 font-mono mb-2">PREFERRED CHECK-IN TIME</h3>
                <input
                  type="time"
                  value={userPreferences.preferredCheckInTime}
                  onChange={(e) => handlePreferenceChange('preferredCheckInTime', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-cyan-300"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-cyan-300 font-mono mb-2">PRIMARY GOAL CATEGORY</h3>
                <select
                  value={userPreferences.goalCategories[0] || ''}
                  onChange={(e) => handlePreferenceChange('goalCategories', [e.target.value])}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-cyan-300"
                >
                  <option value="">SELECT A GOAL</option>
                  <option value="weight_loss">WEIGHT LOSS</option>
                  <option value="muscle_gain">MUSCLE GAIN</option>
                  <option value="endurance">ENDURANCE</option>
                  <option value="flexibility">FLEXIBILITY</option>
                  <option value="overall_health">OVERALL HEALTH</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={userPreferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="notifications" className="text-sm text-cyan-300 font-mono">
                  ENABLE SYSTEM NOTIFICATIONS
                </label>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={submitPreferences}
                className="w-full bg-cyan-900 text-cyan-300 border border-cyan-600 py-2 rounded font-medium hover:bg-cyan-800 transition"
              >
                INITIALIZE SYSTEM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}