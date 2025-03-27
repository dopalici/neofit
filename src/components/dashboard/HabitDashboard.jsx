import React from 'react';
import DailyCheckIn from '../habit/DailyCheckIn';
import HabitStreakTracker from '../habit/HabitStreakTracker';

export default function HabitDashboard({ userData, healthData }) {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">HABIT OPTIMIZATION SYSTEM</h1>
        <div className="text-xs text-cyan-600 font-mono">
          BASED ON NEUROLOGICAL HABIT RESEARCH
        </div>
      </div>
      
      {/* First Row - Initial Habit Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <HabitStreakTracker />
        <DailyCheckIn />
      </div>
      
      {/* Placeholder for future components */}
      <div className="bg-gray-950 border border-cyan-800 rounded-lg p-6 text-center">
        <p className="text-cyan-400 font-mono">ADDITIONAL HABIT FEATURES COMING SOON</p>
        <p className="text-xs text-cyan-600 font-mono mt-2">Check back for variable rewards, progressive challenges, and more</p>
      </div>
    </div>
  );
}