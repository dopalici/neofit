// src/components/dashboard/EnhancementProtocolsPanel.jsx
import React, { useState } from 'react';
import { Flag, Award, Zap, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';

export default function EnhancementProtocolsPanel({ goals, habitData, onStartChallenge }) {
  const [expandedGoal, setExpandedGoal] = useState(null);

  // Toggle expanded goal detail
  const toggleGoalExpand = (goalId) => {
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
  };

  // Format date string
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Get days remaining until target date
  const getDaysRemaining = (targetDate) => {
    try {
      const target = new Date(targetDate);
      const today = new Date();
      const diffTime = target - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  // Calculate streak impact on goal progress
  const calculateStreakImpact = (goal) => {
    if (!habitData || !habitData.streakData) {
      return 0;
    }
    
    const streak = habitData.streakData.currentStreak || 0;
    // 0.5% per day of streak, max 5%
    return Math.min(5, streak * 0.5);
  };

  // Get related challenges for a goal
  const getRelatedChallenges = (goalType) => {
    // Map goal types to relevant challenges
    const challengeMap = {
      'strength': [
        { id: 'str_1', name: '5 DAYS OF STRENGTH TRAINING', duration: 5 },
        { id: 'str_2', name: 'PROGRESSIVE OVERLOAD PROTOCOL', duration: 7 }
      ],
      'endurance': [
        { id: 'end_1', name: 'CARDIAC EFFICIENCY BOOST', duration: 3 },
        { id: 'end_2', name: 'OXYGEN UTILIZATION PROTOCOL', duration: 6 }
      ],
      'mobility': [
        { id: 'mob_1', name: 'JOINT MOBILITY ENHANCEMENT', duration: 4 },
        { id: 'mob_2', name: 'FLEXIBILITY PROTOCOL', duration: 7 }
      ],
      'default': [
        { id: 'def_1', name: 'CONSISTENCY CHALLENGE', duration: 5 },
        { id: 'def_2', name: 'DAILY CHECK-IN SERIES', duration: 3 }
      ]
    };
    
    return challengeMap[goalType] || challengeMap.default;
  };

  // Start a new challenge related to a goal
  const handleStartChallenge = (goalId, challenge) => {
    if (onStartChallenge) {
      onStartChallenge(goalId, challenge);
    }
  };

  // Get goal color class based on type
  const getGoalColorClass = (goalType) => {
    switch (goalType) {
      case 'strength': return 'border-blue-800 bg-blue-900/20';
      case 'endurance': return 'border-green-800 bg-green-900/20';
      case 'mobility': return 'border-purple-800 bg-purple-900/20';
      default: return 'border-cyan-800 bg-cyan-900/20';
    }
  };

  return (
    <div className="bg-gray-900 border border-cyan-800 rounded-lg shadow-lg shadow-cyan-900/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-mono text-cyan-300 flex items-center">
            <Flag size={20} className="text-cyan-500 mr-2" />
            ENHANCEMENT PROTOCOLS
          </h2>
          <div className="text-xs text-cyan-600 font-mono flex items-center">
            <Award size={14} className="mr-1" />
            GOAL SYSTEM
          </div>
        </div>
        
        {/* Goal list */}
        <div className="space-y-4">
          {goals && Object.entries(goals).map(([goalId, goal]) => {
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const streakImpact = calculateStreakImpact(goal);
            const isExpanded = expandedGoal === goalId;
            
            return (
              <div 
                key={goalId} 
                className={`border rounded-lg overflow-hidden transition-all ${getGoalColorClass(goal.type)}`}
              >
                {/* Goal header */}
                <div 
                  className="p-4 cursor-pointer group"
                  onClick={() => toggleGoalExpand(goalId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-cyan-600 font-mono">PROTOCOL</span>
                      <h3 className="font-bold text-cyan-300 font-mono">{goal.name}</h3>
                    </div>
                    
                    <button className="text-cyan-500 group-hover:text-cyan-300">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3 mb-1">
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500"
                        style={{ width: `${Math.min(100, goal.progress || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-cyan-400">{Math.round(goal.progress || 0)}% COMPLETE</span>
                    <span className="text-cyan-600">{daysRemaining} DAYS REMAINING</span>
                  </div>
                </div>
                
                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-800 space-y-4">
                    {/* Goal details */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-cyan-600 font-mono">STARTED</div>
                        <div className="text-sm text-cyan-400 font-mono">{formatDate(goal.startDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-600 font-mono">TARGET</div>
                        <div className="text-sm text-cyan-400 font-mono">{formatDate(goal.targetDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-600 font-mono">STREAK BOOST</div>
                        <div className="text-sm text-cyan-400 font-mono">+{streakImpact.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    {/* Related challenges/habits */}
                    <div>
                      <div className="text-xs text-cyan-600 font-mono mb-2">RELATED CHALLENGES</div>
                      <div className="space-y-2">
                        {getRelatedChallenges(goal.type).map(challenge => (
                          <div 
                            key={challenge.id}
                            className="flex justify-between items-center p-2 bg-gray-950 rounded border border-gray-800"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-cyan-900/20 border border-cyan-900 flex items-center justify-center mr-2">
                                <Zap size={14} className="text-cyan-500" />
                              </div>
                              <div>
                                <div className="text-sm text-cyan-400 font-mono">{challenge.name}</div>
                                <div className="text-xs text-cyan-600 font-mono">{challenge.duration} DAYS</div>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChallenge(goalId, challenge);
                              }}
                              className="flex items-center justify-center bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-400 px-3 py-1 rounded border border-cyan-900 text-xs font-mono"
                            >
                              START <ArrowRight size={12} className="ml-1" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Progress visualization */}
                    <div>
                      <div className="text-xs text-cyan-600 font-mono mb-2">PROGRESS FACTORS</div>
                      <div className="h-6 w-full bg-gray-950 rounded border border-gray-800 flex overflow-hidden">
                        {/* Base progress */}
                        <div 
                          className="h-full bg-cyan-700 flex items-center justify-center"
                          style={{ width: `${Math.min(95, goal.progress - streakImpact)}%` }}
                        >
                          <span className="text-[10px] text-white font-mono px-1">BASE</span>
                        </div>
                        
                        {/* Streak boost */}
                        {streakImpact > 0 && (
                          <div 
                            className="h-full bg-green-600 flex items-center justify-center"
                            style={{ width: `${streakImpact}%` }}
                          >
                            <span className="text-[10px] text-white font-mono px-1">STREAK</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Empty state */}
          {(!goals || Object.keys(goals).length === 0) && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Flag size={24} className="text-cyan-500" />
              </div>
              <h3 className="text-cyan-400 font-medium font-mono mb-1">NO ACTIVE PROTOCOLS</h3>
              <p className="text-xs text-cyan-600 font-mono">Start a new enhancement protocol to track your goals</p>
              <button className="mt-4 bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-400 px-4 py-2 rounded border border-cyan-900 text-sm font-mono">
                NEW PROTOCOL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}