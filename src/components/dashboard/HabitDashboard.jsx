// src/components/dashboard/HabitDashboard.jsx
import React from 'react';
import DailyCheckIn from '../habit/DailyCheckIn';
import HabitStreakTracker from '../habit/HabitStreakTracker';
// Import the other habit components
import ProgressiveChallenge from '../habit/ProgressiveChallenge';
import VariableRewardsSystem from '../habit/VariableRewardsSystem';
import InvestmentFeature from '../habit/InvestmentFeature'; // Assuming this is the Workout/Metrics Log

// Pass necessary props down, e.g., userData for rewards, habitData if needed
export default function HabitDashboard({ userData, habitData, onCheckIn }) {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-cyan-300 font-mono">HABIT OPTIMIZATION SYSTEM</h1>
        <div className="text-xs text-cyan-600 font-mono">
          BASED ON NEUROLOGICAL HABIT RESEARCH
        </div>
      </div>

      {/* First Row - Core Streak & Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pass relevant parts of habitData if available */}
        <HabitStreakTracker streakData={habitData?.streakData} />
        {/* Pass onCheckIn handler and relevant data */}
        <DailyCheckIn checkInData={habitData?.checkInsData} onCheckIn={onCheckIn} />
      </div>

      {/* Second Row - Challenges & Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Challenges might need specific user progress data */}
        <ProgressiveChallenge />
        {/* Rewards system likely needs userData to check eligibility */}
        <VariableRewardsSystem userData={userData} claimedRewardsData={habitData?.rewardsData} />
      </div>

      {/* Third Row - Personal Logs/Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-6">
         {/* Renamed from InvestmentFeature - This component manages its own state via localStorage */}
        <InvestmentFeature />
      </div>

      {/* Add SmartReminders if desired */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
         {/* SmartReminders manages its own state via localStorage */}
         {/* <SmartReminders /> */}
       </div>

    </div>
  );
}