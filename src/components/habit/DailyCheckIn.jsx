import React, { useState, useEffect } from 'react';
import { Check, Bell } from 'lucide-react';
import { useHabitData } from '../../hooks/useHabitData';
import { formatDistanceToNow } from 'date-fns';

const defaultCheckInData = {
  lastCheckIn: null,
  streak: 0,
  history: []
};

export default function DailyCheckIn() {
  const { data, loading, updateData } = useHabitData('checkins', defaultCheckInData);
  const [showNotification, setShowNotification] = useState(false);
  
  // Check if a new day has started since last check-in
  useEffect(() => {
    if (!loading && data) {
      const today = new Date().toDateString();
      
      // If user hasn't checked in today, show notification after delay
      if (data.lastCheckIn !== today) {
        const timer = setTimeout(() => {
          setShowNotification(true);
        }, 3000); // Show notification after 3 seconds
        
        return () => clearTimeout(timer);
      }
    }
  }, [loading, data]);
  
  const handleCheckIn = () => {
    if (!data) return;
    
    const today = new Date().toDateString();
    
    // Only allow one check-in per day
    if (data.lastCheckIn !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      // If last check-in was yesterday, increase streak
      const newStreak = data.lastCheckIn === yesterdayString ? data.streak + 1 : 1;
      
      updateData({
        lastCheckIn: today,
        streak: newStreak,
        history: [
          { date: today, time: new Date().toISOString() },
          ...data.history
        ]
      });
      
      setShowNotification(false);
      
      // Request notification permission
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  };
  
  if (loading) {
    return <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>;
  }
  
  return (
    <>
      {/* Fixed notification for daily check-in */}
      {showNotification && (
        <div className="fixed top-20 right-6 w-72 bg-gray-900 border border-cyan-700 rounded-lg shadow-lg shadow-cyan-900/30 p-4 z-50 animate-slide-in">
          <div className="flex items-start">
            <div className="bg-cyan-900 rounded-full p-2 mr-3">
              <Bell size={16} className="text-cyan-300" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-cyan-300 font-mono">DAILY NEURAL SYNCHRONIZATION</h4>
              <p className="text-xs text-cyan-600 font-mono mt-1">Maintain your enhancement streak by checking in today.</p>
              
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={handleCheckIn}
                  className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-3 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                >
                  SYNCHRONIZE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Check-in status area */}
      <div className="bg-gray-950 border border-cyan-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono text-cyan-300">DAILY SYNCHRONIZATION</h3>
          <p className="text-xs text-cyan-600 font-mono">
            {data.lastCheckIn === new Date().toDateString() 
              ? 'SYNCHRONIZED TODAY' 
              : 'SYNCHRONIZATION REQUIRED'}
          </p>
          {data.lastCheckIn && (
            <p className="text-xs text-cyan-600 font-mono mt-1">
              Last check-in: {formatDistanceToNow(new Date(data.lastCheckIn))} ago
            </p>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="mr-4">
            <span className="text-xs text-cyan-600 font-mono">STREAK</span>
            <div className="text-xl font-bold text-cyan-300 font-mono">{data.streak}</div>
          </div>
          
          {data.lastCheckIn === new Date().toDateString() ? (
            <div className="w-10 h-10 bg-cyan-900/30 border border-cyan-700 rounded-full flex items-center justify-center">
              <Check size={18} className="text-cyan-300" />
            </div>
          ) : (
            <button 
              onClick={handleCheckIn}
              className="w-10 h-10 bg-cyan-900 border border-cyan-600 rounded-full flex items-center justify-center hover:bg-cyan-800 transition"
            >
              <Bell size={18} className="text-cyan-300" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}