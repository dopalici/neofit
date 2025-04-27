import React, { useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getPersonalizedChallengeProgression } from '../../utils/habitUtils';

export default function ProgressiveChallenge({ 
  challengesData, 
  onStartChallenge, 
  onCompleteChallenge,
  userPreferences
}) {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [activeCategory, setActiveCategory] = useState('strength');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [userProgress, setUserProgress] = useState(100); // Default progress for demo
  
  // Initialize challenges from data or use defaults
  useEffect(() => {
    if (challengesData) {
      setActiveChallenges(challengesData.active || []);
    }
    
    // Set default category based on user preferences if available
    if (userPreferences && userPreferences.interests && userPreferences.interests.length > 0) {
      const defaultCategory = userPreferences.interests.find(
        interest => ['strength', 'cardio', 'flexibility'].includes(interest)
      ) || 'strength';
      
      setActiveCategory(defaultCategory);
    }
    
    // Load challenges for active category
    const challenges = getPersonalizedChallengeProgression(activeCategory, userProgress);
    setAvailableChallenges(challenges);
  }, [challengesData, userPreferences, activeCategory]);
  
  // Change category and load appropriate challenges
  const changeCategory = (category) => {
    setActiveCategory(category);
    setShowCategoryMenu(false);
    
    // Load challenges for selected category
    const challenges = getPersonalizedChallengeProgression(category, userProgress);
    setAvailableChallenges(challenges);
  };
  
  // Start a new challenge
  const startChallenge = (challengeId) => {
    if (onStartChallenge) {
      onStartChallenge(challengeId, activeCategory);
    }
  };
  
  // Complete a challenge
  const completeChallenge = (challengeId) => {
    if (onCompleteChallenge) {
      onCompleteChallenge(challengeId);
    }
  };
  
  // Category display names
  const categoryNames = {
    strength: 'STRENGTH',
    cardio: 'CARDIOVASCULAR',
    flexibility: 'FLEXIBILITY'
  };
  
  // Category icons (simplified for this example)
  const getCategoryIcon = (category) => {
    return <Trophy size={16} className="text-cyan-500 mr-2" />;
  };
  
  // If challenges aren't loaded yet
  if (!availableChallenges.length && !activeChallenges.length) {
    return (
      <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-mono text-cyan-300">PROGRESSION CHALLENGES</h3>
            <Trophy size={20} className="text-cyan-500" />
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">PROGRESSION CHALLENGES</h3>
          <div className="relative">
            <button 
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center text-cyan-600 text-xs font-mono bg-gray-900 px-3 py-1 rounded border border-cyan-800 hover:border-cyan-700"
            >
              <Filter size={12} className="mr-1" />
              {categoryNames[activeCategory]}
              {showCategoryMenu ? (
                <ChevronUp size={12} className="ml-1" />
              ) : (
                <ChevronDown size={12} className="ml-1" />
              )}
            </button>
            
            {showCategoryMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-cyan-800 rounded shadow-lg z-10">
                {['strength', 'cardio', 'flexibility'].map(category => (
                  <button
                    key={category}
                    onClick={() => changeCategory(category)}
                    className={`flex items-center w-full px-3 py-2 text-xs font-mono ${
                      activeCategory === category ? 'bg-cyan-900/30 text-cyan-300' : 'text-cyan-600 hover:bg-gray-800'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    {categoryNames[category]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Active challenges section */}
        {activeChallenges.filter(c => c.category === activeCategory).length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-mono text-cyan-600 mb-2">ACTIVE CHALLENGES</h4>
            <div className="space-y-3">
              {activeChallenges
                .filter(challenge => challenge.category === activeCategory)
                .map(challenge => (
                  <div 
                    key={challenge.id}
                    className="bg-gray-900 p-3 rounded-lg border border-cyan-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-mono text-sm text-cyan-300">
                            {challenge.name}
                          </h4>
                        </div>
                        <p className="text-xs mt-1 font-mono text-cyan-600">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="text-xs font-mono text-cyan-300">
                        +{challenge.xp} XP
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => completeChallenge(challenge.id)}
                      className="mt-2 w-full bg-cyan-900 text-cyan-300 border border-cyan-600 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                    >
                      MARK COMPLETE
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Available challenges section */}
        <div>
          <h4 className="text-xs font-mono text-cyan-600 mb-2">AVAILABLE CHALLENGES</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {availableChallenges
              // Filter out challenges that are already active
              .filter(availableChallenge => 
                !activeChallenges.some(activeChallenge => 
                  activeChallenge.id === availableChallenge.id && activeChallenge.category === activeCategory
                )
              )
              .map(challenge => (
                <div 
                  key={challenge.id}
                  className={`bg-gray-900 p-3 rounded-lg border ${
                    challenge.unlocked ? 'border-cyan-800' : 'border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        {!challenge.unlocked ? (
                          <Lock size={16} className="text-gray-600 mr-2" />
                        ) : (
                          <Trophy size={16} className="text-cyan-500 mr-2" />
                        )}
                        <h4 className={`font-mono text-sm ${
                          challenge.unlocked ? 'text-cyan-300' : 'text-gray-500'
                        }`}>
                          {challenge.name}
                        </h4>
                      </div>
                      <p className={`text-xs mt-1 font-mono ${
                        challenge.unlocked ? 'text-cyan-600' : 'text-gray-600'
                      }`}>
                        {challenge.description}
                      </p>
                    </div>
                    <div className={`text-xs font-mono ${
                      challenge.unlocked ? 'text-cyan-300' : 'text-gray-500'
                    }`}>
                      +{challenge.xp} XP
                    </div>
                  </div>
                  
                  {challenge.unlocked ? (
                    <button 
                      onClick={() => startChallenge(challenge.id)}
                      className="mt-2 w-full bg-cyan-900 text-cyan-300 border border-cyan-600 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                    >
                      START CHALLENGE
                    </button>
                  ) : (
                    <div className="mt-2 text-xs font-mono text-gray-600">
                      {challenge.unlocksAt}
                    </div>
                  )}
                </div>
              ))}
              
            {availableChallenges.filter(c => 
              !activeChallenges.some(ac => ac.id === c.id && ac.category === activeCategory)
            ).length === 0 && (
              <div className="text-center py-4">
                <p className="text-cyan-600 text-sm font-mono">NO AVAILABLE CHALLENGES</p>
                <p className="text-xs text-cyan-600 font-mono mt-1">Complete your active challenges to unlock more</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}