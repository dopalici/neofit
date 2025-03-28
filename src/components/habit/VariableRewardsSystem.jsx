// src/components/habit/VariableRewardsSystem.jsx
import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Award } from 'lucide-react';

export default function VariableRewardsSystem({ userData }) {
  const [rewards, setRewards] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState(() => {
    const saved = localStorage.getItem('claimedRewards');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  
  // Simulate user level based on activity
  const userLevel = userData?.level || 12;
  const userXp = userData?.xp || 2450;
  const nextLevelXp = 3000;
  
  // Fetch potential rewards (would connect to backend in a real app)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const potentialRewards = [
        {
          id: 1,
          type: 'achievement',
          title: 'CARDIOVASCULAR ELITE',
          description: 'Achieved exceptional Heart Rate Recovery metrics',
          value: 'RARE BADGE',
          icon: <Award className="text-yellow-500" size={24} />,
          probability: 0.1, // 10% chance
          condition: 'Complete 5 cardiovascular workouts in a week'
        },
        {
          id: 2,
          type: 'streak',
          title: 'CONSISTENCY AMPLIFIER',
          description: '5-day streak bonus',
          value: '+100 XP',
          icon: <TrendingUp className="text-cyan-500" size={24} />,
          probability: 0.6, // 60% chance
          condition: 'Maintain a 5-day activity streak'
        },
        {
          id: 3,
          type: 'milestone',
          title: 'STRENGTH MILESTONE',
          description: 'Reached 80% of your max potential',
          value: 'DASHBOARD THEME UNLOCK',
          icon: <Star className="text-purple-500" size={24} />,
          probability: 0.3, // 30% chance
          condition: 'Reach 80% of your strength potential'
        },
        {
          id: 4,
          type: 'surprise',
          title: 'MYSTERY ENHANCEMENT',
          description: 'A surprise optimization for your next workout',
          value: 'CUSTOM WORKOUT PLAN',
          icon: <Gift className="text-pink-500" size={24} />,
          probability: 0.2, // 20% chance
          condition: 'Random chance on login'
        },
      ];
      
      setRewards(potentialRewards);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Save claimed rewards to localStorage
  useEffect(() => {
    localStorage.setItem('claimedRewards', JSON.stringify(claimedRewards));
  }, [claimedRewards]);
  
  // Check for rewards to give based on user activity
  // In a real app, this would connect to your analytics/tracking system
  const checkForRewards = () => {
    // Simulate checking conditions (in a real app, use actual user data)
    const eligibleRewards = rewards.filter(reward => {
      // For demo purposes, just use the probability
      return Math.random() < reward.probability;
    });
    
    // If there's an eligible reward that hasn't been claimed recently, show it
    const recentlyClaimedIds = claimedRewards
      .filter(r => (new Date() - new Date(r.claimedAt)) < 24 * 60 * 60 * 1000)
      .map(r => r.id);
    
    const availableRewards = eligibleRewards.filter(r => !recentlyClaimedIds.includes(r.id));
    
    if (availableRewards.length > 0) {
      // Pick a random reward from the available ones
      const randomIndex = Math.floor(Math.random() * availableRewards.length);
      setCurrentReward(availableRewards[randomIndex]);
      setShowRewardModal(true);
    }
  };
  
  // Claim the current reward
  const claimReward = () => {
    if (currentReward) {
      setClaimedRewards([
        ...claimedRewards,
        {
          id: currentReward.id,
          title: currentReward.title,
          claimedAt: new Date().toISOString()
        }
      ]);
      
      // In a real app, you'd apply the reward to the user's account here
      // For example, add XP, unlock features, etc.
      
      setShowRewardModal(false);
      setCurrentReward(null);
    }
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">ACHIEVEMENT MATRIX</h3>
          <button 
            onClick={checkForRewards} 
            className="text-cyan-600 text-xs font-mono hover:text-cyan-400"
          >
            CHECK REWARDS
          </button>
        </div>
        
        {/* User XP Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs text-cyan-600 font-mono">ENHANCEMENT LEVEL {userLevel}</div>
            <div className="text-xs text-cyan-600 font-mono">{userXp} / {nextLevelXp} XP</div>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-cyan-500 h-2 rounded-full" 
              style={{ width: `${(userXp / nextLevelXp) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Recent rewards */}
        <div className="space-y-2">
          <div className="text-xs text-cyan-600 font-mono mb-2">RECENT ACHIEVEMENTS</div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : claimedRewards.length > 0 ? (
            claimedRewards
              .sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt))
              .slice(0, 3)
              .map((reward, index) => {
                const rewardDetails = rewards.find(r => r.id === reward.id);
                return (
                  <div key={index} className="bg-gray-900 p-2 rounded-lg border border-cyan-900 flex items-center">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center">
                      {rewardDetails?.icon || <Star className="text-cyan-500" size={16} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-cyan-300">{reward.title}</h4>
                      <p className="text-xs text-cyan-600 font-mono">
                        {new Date(reward.claimedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-4">
              <p className="text-cyan-600 text-sm font-mono">NO ACHIEVEMENTS YET</p>
              <p className="text-xs text-cyan-600 font-mono mt-1">Complete activities to earn rewards</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Reward modal */}
      {showRewardModal && currentReward && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 w-80 max-w-md text-center">
            <div className="animate-bounce mb-4 w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              {currentReward.icon}
            </div>
            
            <h3 className="text-xl font-bold text-cyan-300 font-mono mb-2">
              {currentReward.title}
            </h3>
            
            <p className="text-cyan-600 font-mono mb-4">{currentReward.description}</p>
            
            <div className="bg-gray-950 border border-cyan-700 rounded p-2 mb-6">
              <div className="text-xs text-cyan-600 font-mono">REWARD</div>
              <div className="text-lg font-bold text-cyan-300 font-mono">{currentReward.value}</div>
            </div>
            
            <button 
              onClick={claimReward}
              className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-6 py-2 rounded font-medium hover:bg-cyan-800 transition w-full"
            >
              CLAIM REWARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}