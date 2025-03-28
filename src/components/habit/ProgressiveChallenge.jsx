import React, { useState } from 'react';
import { Trophy, Lock, CheckCircle } from 'lucide-react';

export default function ProgressiveChallenge({ challenges }) {
  // Default challenges if none provided
  const defaultChallenges = [
    {
      id: 1,
      name: "CARDIOVASCULAR EFFICIENCY I",
      description: "Complete 5km run under 25 minutes",
      xp: 100,
      completed: true,
      unlocked: true
    },
    {
      id: 2,
      name: "MUSCLE TENSION PROTOCOL",
      description: "Complete 4 sets of 12 reps at 75% max capacity",
      xp: 150,
      completed: false,
      unlocked: true
    },
    {
      id: 3,
      name: "CARDIOVASCULAR EFFICIENCY II",
      description: "Complete 10km run under 50 minutes",
      xp: 200,
      completed: false,
      unlocked: false,
      unlocksAt: "Complete CARDIOVASCULAR EFFICIENCY I"
    }
  ];
  
  const [userChallenges, setUserChallenges] = useState(challenges || defaultChallenges);
  
  const completeChallenge = (id) => {
    setUserChallenges(prev => 
      prev.map(challenge => {
        if (challenge.id === id) {
          return { ...challenge, completed: true };
        }
        // Unlock the next challenge that depends on this one
        if (challenge.unlocksAt && challenge.unlocksAt.includes(prev.find(c => c.id === id).name)) {
          return { ...challenge, unlocked: true };
        }
        return challenge;
      })
    );
  };
  
  return (
    <div className="bg-gray-950 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-mono text-cyan-300">PROGRESSION CHALLENGES</h3>
          <Trophy size={20} className="text-cyan-500" />
        </div>
        
        <div className="space-y-4">
          {userChallenges.map(challenge => (
            <div 
              key={challenge.id}
              className={`bg-gray-900 p-3 rounded-lg border ${
                challenge.completed ? 'border-green-500' : 
                challenge.unlocked ? 'border-cyan-700' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    {challenge.completed ? (
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                    ) : challenge.unlocked ? (
                      <div className="w-4 h-4 mr-2"></div>
                    ) : (
                      <Lock size={16} className="text-gray-600 mr-2" />
                    )}
                    <h4 className={`font-mono text-sm ${
                      challenge.completed ? 'text-green-400' : 
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
                  challenge.completed ? 'text-green-400' : 
                  challenge.unlocked ? 'text-cyan-300' : 'text-gray-500'
                }`}>
                  +{challenge.xp} XP
                </div>
              </div>
              
              {!challenge.completed && challenge.unlocked && (
                <button 
                  onClick={() => completeChallenge(challenge.id)}
                  className="mt-2 w-full bg-cyan-900 text-cyan-300 border border-cyan-600 py-1 rounded text-xs font-medium hover:bg-cyan-800 transition"
                >
                  MARK COMPLETE
                </button>
              )}
              
              {!challenge.unlocked && (
                <div className="mt-2 text-xs font-mono text-gray-600">
                  UNLOCK REQUIREMENT: {challenge.unlocksAt}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}