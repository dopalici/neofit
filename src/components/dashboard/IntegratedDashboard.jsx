// src/components/dashboard/IntegratedDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useIntegratedHealth } from '../../hooks/useIntegratedHealth';
import EnhancedNutritionPanel from './EnhancedNutritionPanel';
import EnhancementMetricsPanel from './EnhancementMetricsPanel';
import EnhancementProtocolsPanel from './EnhancementProtocolsPanel';
import SleepAnalysis from './SleepAnalysis';
import HabitStreakTracker from '../habit/HabitStreakTracker';
import BiometricPanel from './BiometricPanel';
import ActivityLog from './ActivityLog';
import AIChatbot from './AIChatbot';
import { getPersonalizedRecommendations } from '../../services/knowledgeBaseService';
import { Zap, Check, X, Flame, Calendar, Bell, BookOpen } from 'lucide-react';

// Default user goals
const defaultGoals = {
  handstandPushup: {
    name: "VERTICAL INVERSION PROTOCOL",
    type: "strength",
    progress: 65.2,
    startDate: "2025-03-28",
    targetDate: "2025-05-17"
  },
  fourMinuteMile: {
    name: "SUB-4 VELOCITY THRESHOLD",
    type: "endurance",
    progress: 38.7,
    startDate: "2025-02-14",
    targetDate: "2025-08-27"
  }
};

export default function IntegratedDashboard() {
  // Use the integrated health hook
  const {
    healthData,
    enhancementMetrics,
    nutritionData,
    userGoals,
    habitData,
    isLoading,
    addMeal,
    syncNutrition,
    performCheckInWithGoals,
    startGoalChallenge,
    completeGoalChallenge
  } = useIntegratedHealth(defaultGoals);
  
  // Local state
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  
  // Check if check-in is needed
  useEffect(() => {
    if (habitData && habitData.checkIns) {
      const today = new Date().toDateString();
      const needsCheckIn = habitData.checkIns.lastCheckIn !== today;
      
      // Show check-in notification after a delay if needed
      if (needsCheckIn && !isLoading) {
        const timer = setTimeout(() => {
          addNotification({
            id: 'daily-check-in',
            type: 'reminder',
            title: 'DAILY NEURAL SYNCHRONIZATION',
            message: 'Maintain your enhancement streak by completing today\'s check-in',
            action: 'check-in'
          });
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [habitData, isLoading]);
  
  // Handle sync nutrition
  const handleSyncNutrition = async () => {
    setIsSyncing(true);
    try {
      await syncNutrition();
      
      // Show success notification
      addNotification({
        id: `sync-${Date.now()}`,
        type: 'success',
        title: 'NUTRITION SYNC COMPLETE',
        message: 'Cellular fuel data successfully synchronized',
        action: null
      });
    } catch (error) {
      console.error('Error syncing nutrition:', error);
      
      // Show error notification
      addNotification({
        id: `sync-error-${Date.now()}`,
        type: 'error',
        title: 'SYNC ERROR',
        message: 'Failed to synchronize nutrition data. Please try again.',
        action: null
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle daily check-in
  const handleCheckIn = async () => {
    setShowCheckInModal(true);
    setCheckInStatus('checking-in');
    
    try {
      const result = await performCheckInWithGoals();
      
      if (result.success) {
        // Show success state
        setCheckInStatus('success');
        
        // Close modal after delay
        setTimeout(() => {
          setShowCheckInModal(false);
          setCheckInStatus(null);
          
          // If a reward was generated, show notification
          if (result.reward) {
            addNotification({
              id: `reward-${Date.now()}`,
              type: 'reward',
              title: 'REWARD UNLOCKED',
              message: `You've earned a reward: ${result.reward.title}`,
              action: 'claim-reward',
              data: result.reward
            });
          }
          
          // If streak milestone, show notification
          if (result.streakData && result.streakData.currentStreak % 5 === 0) {
            addNotification({
              id: `streak-${Date.now()}`,
              type: 'milestone',
              title: 'STREAK MILESTONE',
              message: `${result.streakData.currentStreak}-DAY STREAK ACHIEVED! Neural pathways strengthening.`,
              action: null
            });
          }
        }, 2000);
      } else {
        // Show failure state
        setCheckInStatus('error');
        
        // Close modal after delay
        setTimeout(() => {
          setShowCheckInModal(false);
          setCheckInStatus(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in check-in:', error);
      setCheckInStatus('error');
      
      // Close modal after delay
      setTimeout(() => {
        setShowCheckInModal(false);
        setCheckInStatus(null);
      }, 2000);
    }
  };
  
  // Add notification to the list
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 10000);
  };
  
  // Dismiss notification by id
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };
  
  // Handle notification action
  const handleNotificationAction = (notification) => {
    switch (notification.action) {
      case 'check-in':
        handleCheckIn();
        break;
      case 'claim-reward':
        // Handle claim reward
        if (notification.data) {
          // Implement reward claiming logic
          console.log('Claiming reward:', notification.data);
        }
        break;
      default:
        // No action needed
        break;
    }
    
    // Dismiss the notification
    dismissNotification(notification.id);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-cyan-300 font-mono">LOADING ENHANCEMENT MATRIX</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Main header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">HUMAN OPTIMIZATION MATRIX</h1>
        
        {/* Actions - right side of header */}
        <div className="flex items-center space-x-4">
          {/* Daily check-in button */}
          {habitData && habitData.checkIns && habitData.checkIns.lastCheckIn !== new Date().toDateString() ? (
            <button 
              onClick={handleCheckIn}
              className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-4 py-2 rounded font-medium hover:bg-cyan-800 transition flex items-center"
            >
              <Flame size={16} className="mr-2" />
              DAILY CHECK-IN
            </button>
          ) : (
            <div className="flex items-center text-xs text-cyan-600 font-mono">
              <Check size={16} className="text-green-500 mr-2" />
              CHECK-IN COMPLETE
            </div>
          )}
        </div>
      </div>
      
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-4 rounded-lg border flex items-start animate-slideIn ${
                notification.type === 'success' ? 'bg-green-900/20 border-green-800' :
                notification.type === 'error' ? 'bg-red-900/20 border-red-800' :
                notification.type === 'reward' ? 'bg-yellow-900/20 border-yellow-800' :
                notification.type === 'milestone' ? 'bg-purple-900/20 border-purple-800' :
                'bg-cyan-900/20 border-cyan-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                notification.type === 'success' ? 'bg-green-900/50 text-green-500' :
                notification.type === 'error' ? 'bg-red-900/50 text-red-500' :
                notification.type === 'reward' ? 'bg-yellow-900/50 text-yellow-500' :
                notification.type === 'milestone' ? 'bg-purple-900/50 text-purple-500' :
                'bg-cyan-900/50 text-cyan-500'
              }`}>
                {notification.type === 'success' && <Check size={16} />}
                {notification.type === 'error' && <X size={16} />}
                {notification.type === 'reward' && <Zap size={16} />}
                {notification.type === 'milestone' && <Calendar size={16} />}
                {notification.type === 'reminder' && <Bell size={16} />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm font-medium font-mono ${
                    notification.type === 'success' ? 'text-green-500' :
                    notification.type === 'error' ? 'text-red-500' :
                    notification.type === 'reward' ? 'text-yellow-500' :
                    notification.type === 'milestone' ? 'text-purple-500' :
                    'text-cyan-500'
                  }`}>
                    {notification.title}
                  </h3>
                  <button 
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-cyan-400 font-mono mt-1">{notification.message}</p>
                
                {notification.action && (
                  <button 
                    onClick={() => handleNotificationAction(notification)}
                    className={`mt-2 px-3 py-1 rounded text-xs font-mono ${
                      notification.type === 'success' ? 'bg-green-900/50 text-green-500 border border-green-800' :
                      notification.type === 'error' ? 'bg-red-900/50 text-red-500 border border-red-800' :
                      notification.type === 'reward' ? 'bg-yellow-900/50 text-yellow-500 border border-yellow-800' :
                      notification.type === 'milestone' ? 'bg-purple-900/50 text-purple-500 border border-purple-800' :
                      'bg-cyan-900/50 text-cyan-500 border border-cyan-800'
                    }`}
                  >
                    {notification.action === 'check-in' && 'COMPLETE CHECK-IN'}
                    {notification.action === 'claim-reward' && 'CLAIM REWARD'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Main dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Biometric model */}
          <BiometricPanel userData={{ metrics: enhancementMetrics }} healthData={healthData} />
          
          {/* Habit streak tracker */}
          <HabitStreakTracker streakData={habitData?.streakData} />
          
          {/* Activity log */}
          <ActivityLog />
          
          {/* Knowledge base recommendations */}
          {getPersonalizedRecommendations({
            enhancementMetrics,
            healthData,
            nutritionData,
            sleepAnalysis: { quality: healthData?.sleep?.stats?.optimalNights > 0 ? 'OPTIMAL' : 'SUBOPTIMAL' }
          }).length > 0 && (
            <div className="bg-gray-900 border border-cyan-700 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <BookOpen size={18} className="text-cyan-500 mr-2" />
                <h3 className="text-cyan-300 font-bold text-sm font-mono">KNOWLEDGE RECOMMENDATIONS</h3>
              </div>
              <div className="space-y-3">
                {getPersonalizedRecommendations({
                  enhancementMetrics,
                  healthData,
                  nutritionData,
                  sleepAnalysis: { quality: healthData?.sleep?.stats?.optimalNights > 0 ? 'OPTIMAL' : 'SUBOPTIMAL' }
                }).map(rec => (
                  <div key={rec.id} className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-cyan-600 transition-colors text-sm">
                    <h4 className="font-medium text-gray-100">{rec.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Middle columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhancement metrics */}
          <EnhancementMetricsPanel healthData={healthData} />
          
          {/* Enhancement protocols (goals) */}
          <EnhancementProtocolsPanel 
            goals={userGoals} 
            habitData={habitData}
            onStartChallenge={startGoalChallenge}
          />
        </div>
        
        {/* Right column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nutrition panel */}
          <EnhancedNutritionPanel 
            nutritionData={nutritionData}
            onSyncNutrition={handleSyncNutrition}
            isSyncing={isSyncing}
            onAddMeal={addMeal}
          />
          
          {/* Sleep analysis */}
          <SleepAnalysis sleepData={healthData?.sleep} />
        </div>
      </div>
      
      {/* AI Chatbot */}
      <AIChatbot />
      
      {/* Check-in modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 w-96 max-w-md text-center">
            <div className="mb-4">
              {checkInStatus === 'checking-in' && (
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              )}
              {checkInStatus === 'success' && (
                <div className="w-16 h-16 bg-green-900/30 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Check size={32} className="text-green-500" />
                </div>
              )}
              {checkInStatus === 'error' && (
                <div className="w-16 h-16 bg-red-900/30 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto">
                  <X size={32} className="text-red-500" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-cyan-300 font-mono mb-2">
              {checkInStatus === 'checking-in' && 'NEURAL SYNCHRONIZATION'}
              {checkInStatus === 'success' && 'SYNCHRONIZATION COMPLETE'}
              {checkInStatus === 'error' && 'SYNCHRONIZATION FAILED'}
            </h3>
            
            <p className="text-cyan-600 font-mono mb-4">
              {checkInStatus === 'checking-in' && 'Establishing neural pathways and reinforcing habits...'}
              {checkInStatus === 'success' && 'Daily check-in completed. Habit pathways strengthened.'}
              {checkInStatus === 'error' && 'Unable to complete check-in. Please try again.'}
            </p>
            
            {checkInStatus === 'checking-in' ? (
              <div className="h-8"></div>
            ) : (
              <button 
                onClick={() => {
                  setShowCheckInModal(false);
                  setCheckInStatus(null);
                }}
                className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-6 py-2 rounded font-medium hover:bg-cyan-800 transition"
              >
                CONTINUE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}