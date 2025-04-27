import React, { useState, useEffect } from 'react';
import { Flame, Award, Calendar, Trophy } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function HabitStreakTracker({ streakData, miniVersion = false }) {
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Show animation when component mounts to draw attention to the streak
  useEffect(() => {
    if (streakData && streakData.currentStreak > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [streakData]);
  
  if (!streakData) {
    return <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>;
  }
  
  // Simplified mini version for embedding in other components
  if (miniVersion) {
    return (
      <div className="flex items-center">
        <div className="relative w-12 h-12 bg-gray-900 border-2 border-cyan-700 rounded-full flex items-center justify-center mr-2">
          <Flame size={20} className={`text-cyan-500 ${showAnimation ? 'animate-pulse' : ''}`} />
          <span className={`absolute text-sm font-bold text-cyan-300 font-mono ${showAnimation ? 'animate-bounce' : ''}`}>
            {streakData.currentStreak}
          </span>
        </div>
        <div className="text-xs text-cyan-600 font-mono">
          {streakData.currentStreak > 0 ? `${streakData.currentStreak} DAY STREAK` : 'NO ACTIVE STREAK'}
        </div>
      </div>
    );
  }
  
  // Generate streak history for the last 14 days
  const getStreakHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dateString = date.toDateString();
      
      const historyItem = streakData.history.find(h => new Date(h.date).toDateString() === dateString);
      history.push(historyItem ? 1 : 0);
    }
    
    return history;
  };
  
  const streakHistory = getStreakHistory();
  
  // Calculate streak milestones
  const getNextMilestone = () => {
    const milestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
    for (const milestone of milestones) {
      if (streakData.currentStreak < milestone) {
        return {
          next: milestone,
          daysLeft: milestone - streakData.currentStreak
        };
      }
    }
    return { next: Math.ceil(streakData.currentStreak / 10) * 10 + 10, daysLeft: 10 };
  };
  
  const nextMilestone = getNextMilestone();
  
  // Get motivational message based on streak
  const getMotivationalMessage = () => {
    if (streakData.currentStreak === 0) {
      return "START YOUR ENHANCEMENT STREAK TODAY";
    } else if (streakData.currentStreak === 1) {
      return "SOLID START! COME BACK TOMORROW TO BUILD YOUR STREAK";
    } else if (streakData.currentStreak < 5) {
      return `KEEP GOING! ${nextMilestone.daysLeft} DAYS UNTIL YOUR NEXT MILESTONE`;
    } else if (streakData.currentStreak < 10) {
      return "IMPRESSIVE CONSISTENCY! YOU'RE BUILDING NEURAL PATHWAYS";
    } else if (streakData.currentStreak < 30) {
      return "OUTSTANDING DEDICATION! HABIT FULLY FORMING";
    } else {
      return "ELITE CONSISTENCY ACHIEVED! HABIT FULLY ESTABLISHED";
    }
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">CONSISTENCY MATRIX</h3>
          <div className="flex items-center">
            <Trophy size={16} className="text-cyan-500 mr-1" />
            <span className="text-xs font-mono text-cyan-600">NEXT: {nextMilestone.next} DAYS</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-24 h-24 bg-gray-900 border-2 border-cyan-700 rounded-full flex items-center justify-center">
            {showAnimation && (
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"></div>
            )}
            <Flame 
              size={32} 
              className={`text-cyan-500 ${showAnimation ? 'animate-pulse' : ''}`} 
            />
            <span className={`absolute text-2xl font-bold text-cyan-300 font-mono ${
              showAnimation && streakData.currentStreak > 0 ? 'animate-bounce' : ''
            }`}>
              {streakData.currentStreak}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900 p-3 rounded-lg text-center">
            <Award size={18} className="text-cyan-500 mx-auto mb-1" />
            <div className="text-xs text-cyan-600 font-mono">PEAK STREAK</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">{streakData.longestStreak}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg text-center">
            <Calendar size={18} className="text-cyan-500 mx-auto mb-1" />
            <div className="text-xs text-cyan-600 font-mono">LAST ACTIVE</div>
            <div className="text-sm font-bold text-cyan-300 font-mono">
              {streakData.lastCheckIn ? format(new Date(streakData.lastCheckIn), 'MMM d') : 'Never'}
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-xs text-cyan-600 font-mono mb-1">
            <span>{format(subDays(new Date(), 13), 'MMM d')}</span>
            <span>{format(new Date(), 'MMM d')}</span>
          </div>
          <div className="flex space-x-1">
            {streakHistory.map((day, i) => (
              <div 
                key={i} 
                className={`h-2 flex-1 rounded-full ${
                  day ? 'bg-cyan-500 shadow-glow' : 'bg-gray-700'
                }`}
                title={format(subDays(new Date(), 13 - i), 'MMM d, yyyy')}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="text-center text-xs text-cyan-600 font-mono mt-4 bg-gray-900 rounded-lg p-2 border border-cyan-900">
          {getMotivationalMessage()}
        </div>
      </div>
    </div>
  );
}