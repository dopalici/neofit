// src/components/habit/VariableRewardsSystem.jsx
import React, { useState, useEffect } from 'react';
import { Gift, Star, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VariableRewardsSystem({ 
  rewardsData, 
  userData, 
  onCheckRewards,
  onClaimReward 
}) {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [recentRewards, setRecentRewards] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Convert from rewardsData to component state
  useEffect(() => {
    if (rewardsData) {
      setAvailableRewards(rewardsData.available || []);
      setRecentRewards(rewardsData.claimed || []);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [rewardsData]);
  
  // Simulate user level based on activity
  const userLevel = userData?.level || 1;
  const userXp = userData?.xp || 0;
  const nextLevelXp = userLevel * 250;
  const progress = Math.min(100, (userXp / nextLevelXp) * 100);
  
  // Check for rewards
  const checkForRewards = () => {
    if (onCheckRewards) {
      onCheckRewards();
    }
    
    // If we have available rewards, show the most recent one
    if (availableRewards.length > 0) {
      const reward = availableRewards[0];
      setCurrentReward(reward);
      setShowRewardModal(true);
      setRewardClaimed(false);
    } else {
      // Provide feedback that no rewards are currently available
      setCurrentReward({
        id: 'no-reward',
        type: 'info',
        title: 'NO REWARDS AVAILABLE',
        description: 'Continue your fitness activities to earn rewards',
        value: 'COME BACK TOMORROW'
      });
      setShowRewardModal(true);
      setRewardClaimed(false);
    }
  };
  
  // Claim the current reward
  const claimReward = async () => {
    if (!currentReward || currentReward.id === 'no-reward') {
      setShowRewardModal(false);
      return;
    }
    
    try {
      if (onClaimReward) {
        const result = await onClaimReward(currentReward.id);
        
        if (result.success) {
          setRewardClaimed(true);
          
          // Show claimed state briefly before closing
          setTimeout(() => {
            setShowRewardModal(false);
            setCurrentReward(null);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setShowRewardModal(false);
    }
  };
  
  // Get icon for reward type
  const getRewardIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <Award className="text-yellow-500" size={24} />;
      case 'streak':
        return <TrendingUp className="text-cyan-500" size={24} />;
      case 'milestone':
        return <Star className="text-purple-500" size={24} />;
      case 'surprise':
        return <Gift className="text-pink-500" size={24} />;
      case 'progress':
        return <TrendingUp className="text-green-500" size={24} />;
      case 'personalized':
        return <Award className="text-blue-500" size={24} />;
      default:
        return <Star className="text-cyan-500" size={24} />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-gray-950 border border-cyan-900 rounded-lg p-4 animate-pulse h-48">
        <div className="h-6 bg-gray-800 rounded-full w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded-full w-1/2 mb-8"></div>
        <div className="h-12 bg-gray-800 rounded mb-4"></div>
        <div className="h-12 bg-gray-800 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">ACHIEVEMENT MATRIX</h3>
          <button 
            onClick={checkForRewards} 
            className="text-cyan-600 text-xs font-mono hover:text-cyan-400 flex items-center"
          >
            <Gift size={14} className="mr-1" />
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
              className="bg-cyan-500 h-2 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Available rewards */}
        {availableRewards.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs text-cyan-600 font-mono">AVAILABLE REWARDS</h4>
              <div className="text-xs text-cyan-600 font-mono">{availableRewards.length} REWARD{availableRewards.length !== 1 ? 'S' : ''}</div>
            </div>
            <div className="space-y-2">
              {availableRewards.slice(0, 2).map((reward, index) => (
                <div key={reward.id} className="bg-gray-900 p-3 rounded-lg border border-cyan-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center">
                      {getRewardIcon(reward.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-cyan-300">{reward.title}</h4>
                      <p className="text-xs text-cyan-600 font-mono line-clamp-1">
                        {reward.value}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentReward(reward);
                      setShowRewardModal(true);
                      setRewardClaimed(false);
                    }}
                    className="bg-cyan-900 text-cyan-300 border border-cyan-600 px-3 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                  >
                    CLAIM
                  </button>
                </div>
              ))}
              
              {availableRewards.length > 2 && (
                <div className="text-center">
                  <button
                    onClick={checkForRewards}
                    className="text-cyan-600 text-xs font-mono hover:text-cyan-400"
                  >
                    VIEW ALL REWARDS
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Recent rewards */}
        <div>
          <h4 className="text-xs text-cyan-600 font-mono mb-2">RECENT ACHIEVEMENTS</h4>
          
          {recentRewards.length > 0 ? (
            <div className="space-y-2">
              {recentRewards
                .slice(0, 3)
                .map(reward => (
                  <div key={reward.id} className="bg-gray-900 p-2 rounded-lg border border-cyan-900 flex items-center">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center">
                      {getRewardIcon(reward.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-cyan-300">{reward.title}</h4>
                      <p className="text-xs text-cyan-600 font-mono">
                        {reward.claimedAt ? new Date(reward.claimedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-cyan-600 text-sm font-mono">NO ACHIEVEMENTS YET</p>
              <p className="text-xs text-cyan-600 font-mono mt-1">Complete activities to earn rewards</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Reward modal */}
      {showRewardModal && currentReward && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-6 w-80 max-w-md text-center relative">
            {/* Close button */}
            <button
              onClick={() => setShowRewardModal(false)}
              className="absolute top-2 right-2 text-cyan-600 hover:text-cyan-400"
            >
              ×
            </button>
            
            <div className={`${rewardClaimed ? '' : 'animate-bounce'} mb-4 w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center`}>
              {getRewardIcon(currentReward.type)}
            </div>
            
            <h3 className="text-xl font-bold text-cyan-300 font-mono mb-2">
              {currentReward.title}
            </h3>
            
            <p className="text-cyan-600 font-mono mb-4">{currentReward.description}</p>
            
            <div className="bg-gray-950 border border-cyan-700 rounded p-2 mb-6">
              <div className="text-xs text-cyan-600 font-mono">REWARD</div>
              <div className="text-lg font-bold text-cyan-300 font-mono">{currentReward.value}</div>
            </div>
            
            {!rewardClaimed ? (
              <button 
                onClick={claimReward}
                className={`bg-cyan-900 text-cyan-300 border border-cyan-600 px-6 py-2 rounded font-medium hover:bg-cyan-800 transition w-full ${
                  currentReward.id === 'no-reward' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={currentReward.id === 'no-reward'}
              >
                {currentReward.id === 'no-reward' ? 'OK' : 'CLAIM REWARD'}
              </button>
            ) : (
              <div className="bg-green-900/30 border border-green-700 rounded-lg py-2 text-green-400 font-mono text-sm">
                REWARD CLAIMED!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}