// src/components/dashboard/GoalsPanel.jsx
import React, { useEffect, useState } from 'react';
import { Trophy, ChevronRight, Award, Clock } from 'lucide-react';
import { getFromStorage, STORAGE_KEYS } from '../../utils/storageUtils';
import { Link } from 'react-router-dom';

export default function GoalsPanel({ goals }) {
  const [habitGoals, setHabitGoals] = useState([]);
  const [combinedGoals, setCombinedGoals] = useState([]);
  
  // Fetch active challenges from habit system
  useEffect(() => {
    // Get active challenges from habit system storage
    try {
      const habitData = getFromStorage('challenges', { active: [] });
      if (habitData && habitData.active && habitData.active.length > 0) {
        setHabitGoals(habitData.active);
      }
    } catch (error) {
      console.error("Error loading habit challenges:", error);
    }
  }, []);
  
  // Combine predefined goals with habit system goals
  useEffect(() => {
    const combined = [];
    
    // Add predefined goals if they exist
    if (goals) {
      if (goals.handstandPushup) {
        combined.push({
          id: 'handstandPushup',
          name: goals.handstandPushup.name,
          type: goals.handstandPushup.type,
          progress: goals.handstandPushup.progress,
          startDate: goals.handstandPushup.startDate,
          targetDate: goals.handstandPushup.targetDate,
          source: 'predefined',
          isPrimary: true
        });
      }
      
      if (goals.fourMinuteMile) {
        combined.push({
          id: 'fourMinuteMile',
          name: goals.fourMinuteMile.name,
          type: goals.fourMinuteMile.type,
          progress: goals.fourMinuteMile.progress,
          startDate: goals.fourMinuteMile.startDate,
          targetDate: goals.fourMinuteMile.targetDate,
          source: 'predefined',
          isPrimary: false
        });
      }
    }
    
    // Add goals from habit system
    habitGoals.forEach((habitGoal, index) => {
      combined.push({
        id: habitGoal.id || `habit-${index}`,
        name: habitGoal.name || 'Habit Challenge',
        type: habitGoal.category || 'habit',
        progress: habitGoal.progress || calculateHabitProgress(habitGoal),
        startDate: habitGoal.startDate || new Date().toISOString().slice(0, 10),
        targetDate: habitGoal.targetDate || calculateTargetDate(habitGoal.startDate),
        source: 'habit',
        isPrimary: index === 0, // First habit goal is primary if no other primary exists
        xp: habitGoal.xp || 100,
        metadata: habitGoal // Keep original data for reference
      });
    });
    
    // Ensure we have at least one primary goal
    if (combined.length > 0 && !combined.some(g => g.isPrimary)) {
      combined[0].isPrimary = true;
    }
    
    // Sort: primary goals first, then by progress (highest first)
    combined.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.progress - a.progress;
    });
    
    setCombinedGoals(combined);
  }, [goals, habitGoals]);
  
  // Calculate progress for habit goals based on check-ins or time
  const calculateHabitProgress = (habitGoal) => {
    // If goal already has a progress value, use it
    if (habitGoal.progress !== undefined && habitGoal.progress !== null) {
      return habitGoal.progress;
    }
    
    try {
      // If habit goal has a startDate and targetDate, calculate progress based on time
      if (habitGoal.startDate && habitGoal.targetDate) {
        const start = new Date(habitGoal.startDate).getTime();
        const target = new Date(habitGoal.targetDate).getTime();
        const now = new Date().getTime();
        
        if (now >= target) return 100; // Past target date = 100%
        if (now <= start) return 0; // Before start date = 0%
        
        return Math.round(((now - start) / (target - start)) * 100);
      }
      
      // If we have check-in data related to this habit
      const checkIns = getFromStorage('checkins', { history: [] });
      if (checkIns && checkIns.history && checkIns.history.length > 0) {
        // Count check-ins that match this habit (simplified)
        // In a real app, you'd have a more sophisticated way to track which check-ins apply to which habits
        const habitCheckIns = checkIns.history.filter(c => 
          c.challengeId === habitGoal.id || 
          c.type === habitGoal.category
        );
        
        // Calculate progress based on check-ins (assume 10 check-ins = 100%)
        const checkInProgress = Math.min(100, Math.round((habitCheckIns.length / 10) * 100));
        return checkInProgress;
      }
      
      // Default to random progress between 10-90% if we can't calculate
      return Math.floor(Math.random() * 80) + 10;
    } catch (error) {
      console.error("Error calculating habit progress:", error);
      return 50; // Default to 50% if calculation fails
    }
  };
  
  // Calculate target date if not provided (defaults to 30 days from start)
  const calculateTargetDate = (startDateStr) => {
    try {
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + 30);
      return targetDate.toISOString().slice(0, 10);
    } catch (error) {
      // Default to 30 days from today if calculation fails
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + 30);
      return targetDate.toISOString().slice(0, 10);
    }
  };
  
  // Format dates for display (MM/DD/YYYY)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch (error) {
      return dateString || 'N/A';
    }
  };
  
  // Calculate days remaining until target date
  const calculateDaysRemaining = (targetDateStr) => {
    try {
      const targetDate = new Date(targetDateStr);
      const today = new Date();
      
      // Reset both dates to start of day for accurate day calculation
      targetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      return 0;
    }
  };
  
  // Get icon for goal type
  const getGoalTypeIcon = (type) => {
    // You can add more type-specific icons here
    switch (type.toLowerCase()) {
      case 'strength':
        return <Trophy size={16} className="text-yellow-500" />;
      case 'endurance':
        return <Award size={16} className="text-cyan-500" />;
      case 'cardio':
        return <Award size={16} className="text-red-500" />;
      case 'flexibility':
        return <Award size={16} className="text-green-500" />;
      default:
        return <Trophy size={16} className="text-cyan-500" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-mono text-cyan-300">ENHANCEMENT PROTOCOLS</h2>
          <Link to="/habits" className="text-cyan-600 text-xs font-mono hover:text-cyan-400 flex items-center">
            ALL PROTOCOLS <ChevronRight size={14} className="ml-1" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {combinedGoals.length > 0 ? (
            combinedGoals.map((goal, index) => (
              <div key={goal.id} className="bg-gray-950 border border-cyan-900 p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      {getGoalTypeIcon(goal.type)}
                      <h3 className="font-medium text-cyan-300 font-mono ml-2">{goal.name}</h3>
                    </div>
                    <p className="text-sm text-cyan-600 mt-1 font-mono">
                      {goal.isPrimary ? 'PRIMARY' : 'SECONDARY'} ENHANCEMENT · {goal.type.toUpperCase()}
                      {goal.source === 'habit' && goal.xp && (
                        <span className="ml-2 text-yellow-500">+{goal.xp} XP</span>
                      )}
                    </p>
                  </div>
                  <span className="bg-gray-800 text-cyan-300 text-xs px-2 py-1 rounded font-mono">
                    {goal.progress.toFixed(1)}% COMPLETE
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div 
                      className="bg-cyan-500 h-1.5 rounded-full relative" 
                      style={{ width: `${goal.progress}%` }}
                    >
                      <div className="absolute right-0 top-0 h-1.5 w-1 bg-cyan-300"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-cyan-600 font-mono flex items-center">
                    <Clock size={12} className="mr-1" />
                    INITIATED: {formatDate(goal.startDate)}
                  </div>
                  <div className="text-xs text-cyan-600 font-mono">
                    {calculateDaysRemaining(goal.targetDate)} DAYS REMAINING
                  </div>
                </div>
                
                {/* Display additional information for habit goals */}
                {goal.source === 'habit' && (
                  <div className="mt-3 pt-3 border-t border-cyan-900/50">
                    <Link 
                      to="/habits"
                      className="text-xs text-cyan-500 hover:text-cyan-400 font-mono flex items-center justify-end"
                    >
                      VIEW DETAILS <ChevronRight size={12} className="ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-gray-950 border border-gray-800 p-4 rounded text-center">
              <Trophy size={24} className="mx-auto text-cyan-700 mb-2" />
              <p className="text-cyan-600 font-mono mb-2">NO ACTIVE ENHANCEMENT PROTOCOLS</p>
              <Link 
                to="/habits"
                className="inline-block bg-cyan-900 text-cyan-300 border border-cyan-700 px-3 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
              >
                INITIATE PROTOCOL
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}