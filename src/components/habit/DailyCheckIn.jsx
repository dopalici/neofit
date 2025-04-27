import React, { useState, useEffect } from 'react';
import { Check, Bell, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DailyCheckIn({ checkInData, onCheckIn }) {
  const [showNotification, setShowNotification] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(null);
  
  // Check if a new day has started since last check-in
  useEffect(() => {
    if (checkInData) {
      const today = new Date().toDateString();
      
      // If user hasn't checked in today, show notification after delay
      if (checkInData.lastCheckIn !== today) {
        const timer = setTimeout(() => {
          setShowNotification(true);
        }, 3000); // Show notification after 3 seconds
        
        return () => clearTimeout(timer);
      } else {
        setShowNotification(false);
      }
    }
  }, [checkInData]);
  
  const handleCheckIn = async () => {
    if (!checkInData) return;
    
    const today = new Date().toDateString();
    
    // Only allow one check-in per day
    if (checkInData.lastCheckIn !== today) {
      try {
        const result = await onCheckIn('daily');
        
        if (result.success) {
          setCheckInSuccess({
            success: true,
            message: 'Check-in successful!'
          });
          
          setTimeout(() => setCheckInSuccess(null), 3000);
          setShowNotification(false);
          
          // Request notification permission
          if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        } else {
          setCheckInSuccess({
            success: false,
            message: result.message || 'Failed to check in. Please try again.'
          });
          
          setTimeout(() => setCheckInSuccess(null), 3000);
        }
      } catch (error) {
        setCheckInSuccess({
          success: false,
          message: 'An error occurred. Please try again.'
        });
        
        setTimeout(() => setCheckInSuccess(null), 3000);
      }
    }
  };
  
  if (!checkInData) {
    return <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48"></div>;
  }
  
  return (
    <>
      {/* Fixed notification for daily check-in */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 w-72 bg-gray-900 border border-cyan-700 rounded-lg shadow-lg shadow-cyan-900/30 p-4 z-50 animate-slide-in">
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
      
      {/* Success/error message */}
      {checkInSuccess && (
        <div className={`fixed top-20 right-6 w-72 ${
          checkInSuccess.success 
            ? 'bg-green-900/30 border-green-700' 
            : 'bg-red-900/30 border-red-700'
        } border rounded-lg shadow-lg p-4 z-50 animate-slide-in`}>
          <div className="flex items-start">
            <div className={`${
              checkInSuccess.success ? 'bg-green-900' : 'bg-red-900'
            } rounded-full p-2 mr-3`}>
              {checkInSuccess.success ? (
                <Check size={16} className="text-green-300" />
              ) : (
                <AlertTriangle size={16} className="text-red-300" />
              )}
            </div>
            <div>
              <h4 className={`text-sm font-medium ${
                checkInSuccess.success ? 'text-green-300' : 'text-red-300'
              } font-mono`}>
                {checkInSuccess.success ? 'SUCCESS' : 'ERROR'}
              </h4>
              <p className={`text-xs ${
                checkInSuccess.success ? 'text-green-600' : 'text-red-600'
              } font-mono mt-1`}>
                {checkInSuccess.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Check-in status area */}
      <div className="bg-gray-950 border border-cyan-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono text-cyan-300">DAILY SYNCHRONIZATION</h3>
          <p className="text-xs text-cyan-600 font-mono">
            {checkInData.lastCheckIn === new Date().toDateString() 
              ? 'SYNCHRONIZED TODAY' 
              : 'SYNCHRONIZATION REQUIRED'}
          </p>
          {checkInData.lastCheckIn && (
            <p className="text-xs text-cyan-600 font-mono mt-1">
              Last check-in: {formatDistanceToNow(new Date(checkInData.lastCheckIn))} ago
            </p>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="mr-4">
            <span className="text-xs text-cyan-600 font-mono">STREAK</span>
            <div className="text-xl font-bold text-cyan-300 font-mono">
              {checkInData.currentStreak || 0}
            </div>
          </div>
          
          {checkInData.lastCheckIn === new Date().toDateString() ? (
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