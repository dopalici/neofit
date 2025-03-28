import React, { useState, useEffect } from 'react';
import { Flame, Award, Calendar } from 'lucide-react';
import { useHabitData } from '../../hooks/useHabitData';

const defaultStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckIn: null,
  history: []
};

export default function HabitStreakTracker({ miniVersion = false }) {
  const { data, loading } = useHabitData('checkins', defaultStreakData);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Show animation when component mounts to draw attention to the streak
  useEffect(() => {
    setShowAnimation(true);
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>;
  }
  
  // Simplified mini version for embedding in other components
  if (miniVersion) {
    return (
      <div className="flex items-center">
        <div className="relative w-12 h-12 bg-gray-900 border-2 border-cyan-700 rounded-full flex items-center justify-center mr-2">
          <Flame size={20} className="text-cyan-500" />
          <span className="absolute text-sm font-bold text-cyan-300 font-mono">{data.streak}</span>
        </div>
        <div className="text-xs text-cyan-600 font-mono">
          {data.streak > 0 ? `${data.streak} DAY STREAK` : 'NO ACTIVE STREAK'}
        </div>
      </div>
    );
  }
  
  // Generate streak history for the last 14 days
  const getStreakHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toDateString();
      
      const historyItem = data.history.find(h => new Date(h.date).toDateString() === dateString);
      history.push(historyItem ? 1 : 0);
    }
    
    return history;
  };
  
  const streakHistory = getStreakHistory();
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">CONSISTENCY MATRIX</h3>
          <button className="text-cyan-600 text-xs font-mono">VIEW HISTORY</button>
        </div>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-24 h-24 bg-gray-900 border-2 border-cyan-700 rounded-full flex items-center justify-center">
            <div className={`absolute inset-0 bg-cyan-500/20 rounded-full ${showAnimation ? 'animate-ping' : ''}`}></div>
            <Flame size={32} className={`text-cyan-500 ${showAnimation ? 'animate-pulse' : ''}`} />
            <span className="absolute text-2xl font-bold text-cyan-300 font-mono">{data.streak}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900 p-3 rounded-lg text-center">
            <Award size={18} className="text-cyan-500 mx-auto mb-1" />
            <div className="text-xs text-cyan-600 font-mono">PEAK STREAK</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">{data.longestStreak}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg text-center">
            <Calendar size={18} className="text-cyan-500 mx-auto mb-1" />
            <div className="text-xs text-cyan-600 font-mono">LAST ACTIVE</div>
            <div className="text-sm font-bold text-cyan-300 font-mono">
              {data.lastCheckIn ? new Date(data.lastCheckIn).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1 mb-4">
          {streakHistory.map((day, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full ${day ? 'bg-cyan-500' : 'bg-gray-700'}`}
            ></div>
          ))}
        </div>
        
        <div className="text-center text-xs text-cyan-600 font-mono">
          {data.streak > 0 
            ? `KEEP YOUR STREAK GOING - CHECK IN DAILY`
            : `START YOUR ENHANCEMENT STREAK TODAY`}
        </div>
      </div>
    </div>
  );
}